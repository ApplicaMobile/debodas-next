import { createHash } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { MetaMap } from "@/lib/wp-import/acf";
import { metaGet } from "@/lib/wp-import/acf";
import { collectWarnings, mappedBodaPayload, syntheticEmail } from "@/lib/wp-import/map";
import {
  collectHttpUrls,
  normalizeMediaUrl,
  replaceHttpUrls,
} from "@/lib/wp-import/media-map";
import {
  classifyWpHash,
  planImportPassword,
  type ImportPasswordPlan,
} from "@/lib/wp-import/passwords";
import type {
  WpBodaRow,
  WpImportAction,
  WpImportMode,
  WpImportWarning,
  WpMigrateResult,
  WpUserRow,
} from "@/lib/wp-import/types";
import { normalizeAccountStatus } from "@/lib/account/status";

/** Cliente Prisma (o un fake con la misma forma en los tests). */
export type ImportDb = PrismaClient;

/** Error al intentar importar algo de una cuenta eliminada (tombstone). */
export class DeletedAccountImportError extends Error {
  constructor(message = "La cuenta de este usuario fue eliminada; no se vuelve a importar.") {
    super(message);
    this.name = "DeletedAccountImportError";
  }
}

/**
 * ¿Este usuario de WordPress corresponde a una cuenta eliminada en Next?
 * Se mira por legacyWpUserId (se conserva aunque la cuenta se anonimice),
 * por legacy_map (kind=user) y por email.
 */
export async function isWpUserTombstoned(
  db: Pick<ImportDb, "user" | "legacyMap"> | Prisma.TransactionClient,
  input: { wpUserId?: number | null; email?: string | null },
): Promise<boolean> {
  const candidates: Array<{ status: string } | null> = [];
  if (input.wpUserId) {
    candidates.push(
      await db.user.findUnique({ where: { legacyWpUserId: input.wpUserId }, select: { status: true } }),
    );
    const mapped = await db.legacyMap.findUnique({
      where: { kind_wpId: { kind: "user", wpId: input.wpUserId } },
      select: { prismaId: true },
    });
    if (mapped) {
      candidates.push(await db.user.findUnique({ where: { id: mapped.prismaId }, select: { status: true } }));
    }
  }
  const email = input.email?.trim().toLowerCase();
  if (email) {
    candidates.push(await db.user.findUnique({ where: { email }, select: { status: true } }));
  }
  return candidates.some((user) => normalizeAccountStatus(user?.status ?? null) === "deleted" && user !== null);
}
type Tx = Prisma.TransactionClient;

export interface PersistInput {
  boda: WpBodaRow;
  meta: MetaMap;
  user: WpUserRow | null;
  attachments: Map<number, string>;
}

export interface PersistContext {
  db: ImportDb;
  mode: WpImportMode;
  dryRun: boolean;
  runId: string;
  /** Emails ya asignados en esta corrida (detecta duplicados también en dry-run). */
  usedEmails: Set<string>;
  /** bcrypt ya calculado (login perezoso: la pareja acaba de tipear su clave). */
  passwordHash?: string;
}

/** Tolerancia para no confundir los hijos creados por el propio import con ediciones. */
const EDIT_TOLERANCE_MS = 2000;
const TX_OPTIONS = { maxWait: 10_000, timeout: 120_000 } as const;

const VOLATILE_META = new Set(["_edit_lock", "_edit_last", "_wp_old_slug", "_wp_old_date"]);

/** sha256 del post + meta (ordenada) + dueño. No incluye el hash de la clave. */
export function computeSourceHash(
  boda: WpBodaRow,
  meta: MetaMap,
  user: WpUserRow | null,
): string {
  const metaEntries = [...meta.entries()]
    .filter(([key]) => !VOLATILE_META.has(key))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const payload = {
    id: boda.ID,
    title: boda.post_title,
    name: boda.post_name,
    author: boda.post_author,
    date: boda.post_date instanceof Date ? boda.post_date.toISOString() : String(boda.post_date),
    modified:
      boda.post_modified instanceof Date ? boda.post_modified.toISOString() : String(boda.post_modified),
    meta: metaEntries,
    user: user ? { id: user.ID, email: user.user_email, name: user.display_name } : null,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function wpPostIdFromMisc(misc: unknown): number | null {
  if (!misc || typeof misc !== "object" || Array.isArray(misc)) return null;
  const n = Number((misc as Record<string, unknown>).wp_post_id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

type ExistingBoda = { id: string; slug: string; userId: string; updatedAt: Date };

/** Busca la boda Prisma de un post WP: primero legacy_map, después slug + misc.wp_post_id. */
async function findExistingBoda(
  db: Tx,
  wpPostId: number,
  slug: string,
): Promise<{
  existing: ExistingBoda | null;
  map: { prismaId: string; sourceHash: string | null; importedAt: Date } | null;
  slugTakenByOther: boolean;
}> {
  const map = await db.legacyMap.findUnique({
    where: { kind_wpId: { kind: "boda", wpId: wpPostId } },
    select: { prismaId: true, sourceHash: true, importedAt: true },
  });
  let existing: ExistingBoda | null = null;
  if (map) {
    existing = await db.boda.findUnique({
      where: { id: map.prismaId },
      select: { id: true, slug: true, userId: true, updatedAt: true },
    });
  }
  const bySlug = await db.boda.findUnique({
    where: { slug },
    select: { id: true, slug: true, userId: true, updatedAt: true, misc: true },
  });
  if (!existing && bySlug && wpPostIdFromMisc(bySlug.misc) === wpPostId) {
    // Importada por el motor viejo (sin legacy_map): la adoptamos.
    existing = { id: bySlug.id, slug: bySlug.slug, userId: bySlug.userId, updatedAt: bySlug.updatedAt };
  }
  const slugTakenByOther = Boolean(bySlug && (!existing || bySlug.id !== existing.id));
  return { existing, map: existing ? map : null, slugTakenByOther };
}

async function uniqueSlug(db: Tx, base: string, wpPostId: number): Promise<string> {
  const candidates = [`${base}-${wpPostId}`];
  for (let i = 2; i < 50; i += 1) candidates.push(`${base}-${wpPostId}-${i}`);
  for (const candidate of candidates) {
    const taken = await db.boda.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  throw new Error(`No se encontró slug libre para ${base}`);
}

/** ¿La boda (o sus hijos) se editaron en Next después de `since`? */
export async function editedInNextSince(
  db: Tx,
  boda: { id: string; updatedAt: Date },
  since: Date,
): Promise<boolean> {
  const threshold = new Date(since.getTime() + EDIT_TOLERANCE_MS);
  if (boda.updatedAt > threshold) return true;
  const where = { bodaId: boda.id, updatedAt: { gt: threshold } };
  const created = { bodaId: boda.id, createdAt: { gt: threshold } };
  const counts = await Promise.all([
    db.gift.count({ where }),
    db.scheduleItem.count({ where }),
    db.faqItem.count({ where }),
    db.rsvpGuest.count({ where }),
    db.confirmedGift.count({ where }),
    db.picture.count({ where: created }),
    db.payment.count({ where: created }),
  ]);
  return counts.some((n) => n > 0);
}

/** Reemplaza URLs de WP que ya fueron rehosteadas (legacy_media) por su ruta nueva. */
async function applyRehostedMedia<T>(db: Tx, payload: T): Promise<T> {
  const urls = [...collectHttpUrls(payload)].map(normalizeMediaUrl);
  if (urls.length === 0) return payload;
  const rows = await db.legacyMedia.findMany({
    where: { originalUrl: { in: [...new Set(urls)] } },
    select: { originalUrl: true, newPath: true },
  });
  if (rows.length === 0) return payload;
  const byUrl = new Map(rows.map((r) => [r.originalUrl, r.newPath]));
  return replaceHttpUrls(payload, (url) => byUrl.get(normalizeMediaUrl(url)) ?? null);
}

async function upsertMap(
  db: Tx,
  kind: "user" | "boda" | "rating",
  wpId: number,
  prismaId: string,
  runId: string,
  sourceHash: string | null,
  importedAt: Date = new Date(),
) {
  await db.legacyMap.upsert({
    where: { kind_wpId: { kind, wpId } },
    create: { kind, wpId, prismaId, sourceHash, runId, importedAt },
    update: { prismaId, sourceHash, runId, importedAt },
  });
}

interface OwnerInput {
  email: string;
  name: string;
  createdAt: Date;
  wpUser: WpUserRow | null;
  plan: ImportPasswordPlan;
  wpPostId: number;
  runId: string;
  warnings: WpImportWarning[];
}

/**
 * Encuentra o crea el usuario dueño. Si el usuario ya existe NUNCA se tocan
 * `passwordHash` ni `legacyPasswordHash` (las parejas pueden haber cambiado su clave en Next).
 */
async function resolveOwner(tx: Tx, input: OwnerInput): Promise<{ userId: string; email: string }> {
  const { wpUser } = input;

  async function legacyIdFree(id: number): Promise<boolean> {
    const taken = await tx.user.findUnique({ where: { legacyWpUserId: id }, select: { id: true } });
    return !taken;
  }

  async function findOrCreate(email: string, primary: boolean): Promise<string> {
    let user: {
      id: string;
      name: string | null;
      role: string;
      migratedFromWp: boolean;
      legacyWpUserId: number | null;
      status?: string;
    } | null = null;
    const select = {
      id: true,
      name: true,
      role: true,
      migratedFromWp: true,
      legacyWpUserId: true,
      status: true,
    };
    if (primary && wpUser && (await isWpUserTombstoned(tx, { wpUserId: wpUser.ID }))) {
      throw new DeletedAccountImportError();
    }
    if (primary && wpUser) {
      const mapped = await tx.legacyMap.findUnique({
        where: { kind_wpId: { kind: "user", wpId: wpUser.ID } },
        select: { prismaId: true },
      });
      if (mapped) {
        user = await tx.user.findUnique({ where: { id: mapped.prismaId }, select });
      }
    }
    if (!user) {
      user = await tx.user.findUnique({ where: { email }, select });
    }
    if (user && normalizeAccountStatus(user.status ?? null) === "deleted") {
      throw new DeletedAccountImportError();
    }
    if (user) {
      const data: Prisma.UserUpdateInput = {};
      if (!user.name && input.name) data.name = input.name;
      if (user.role !== "admin" && !user.migratedFromWp) data.migratedFromWp = true;
      if (primary && wpUser && user.legacyWpUserId == null && (await legacyIdFree(wpUser.ID))) {
        data.legacyWpUserId = wpUser.ID;
      }
      if (Object.keys(data).length > 0) {
        await tx.user.update({ where: { id: user.id }, data });
      }
    } else {
      const legacyWpUserId =
        primary && wpUser && (await legacyIdFree(wpUser.ID)) ? wpUser.ID : null;
      const created = await tx.user.create({
        data: {
          email,
          name: input.name || null,
          passwordHash: input.plan.passwordHash,
          legacyPasswordHash: input.plan.legacyPasswordHash,
          role: "couple",
          createdAt: input.createdAt,
          migratedFromWp: true,
          legacyWpUserId,
        },
        select: { id: true },
      });
      user = { id: created.id, name: input.name, role: "couple", migratedFromWp: true, legacyWpUserId };
    }
    if (primary && wpUser) {
      await upsertMap(tx, "user", wpUser.ID, user.id, input.runId, null);
    }
    return user.id;
  }

  let email = input.email;
  let userId = await findOrCreate(email, true);
  const owned = await tx.boda.findUnique({ where: { userId }, select: { id: true, slug: true } });
  if (owned) {
    // Boda.userId es único: una pareja con varias bodas recibe un email `usuario+bodaN@…`.
    email = syntheticEmail(input.email, input.wpPostId);
    userId = await findOrCreate(email, false);
    input.warnings.push({
      code: "MULTI_BODA_OWNER",
      message: `El usuario ya tenía la boda ${owned.slug}; esta queda con el email ${email}.`,
    });
    const ownedToo = await tx.boda.findUnique({ where: { userId }, select: { slug: true } });
    if (ownedToo) {
      throw new Error(`El usuario sintético ${email} ya tiene la boda ${ownedToo.slug}.`);
    }
  }
  return { userId, email };
}

function resultBase(input: PersistInput, slug: string, email: string, sourceHash: string) {
  return { wpPostId: input.boda.ID, slug, email, sourceHash };
}

/**
 * Importa UNA boda de WordPress de forma idempotente.
 *
 * Modos:
 * - `only-new`: si ya existe (por legacy_map / wp_post_id) se saltea.
 * - `changed`: re-importa solo si cambió `sourceHash` y la boda NO se editó en Next desde el último import.
 * - `overwrite`: reemplaza siempre (destructivo; solo staging, lo valida el que llama).
 *
 * Todas las escrituras van en una transacción por boda.
 */
export async function persistWpBoda(
  input: PersistInput,
  ctx: PersistContext,
): Promise<WpMigrateResult> {
  const { boda, meta } = input;
  const db = ctx.db;
  const warnings: WpImportWarning[] = [];
  const baseSlug = boda.post_name || `boda-${boda.ID}`;
  const sourceHash = computeSourceHash(boda, meta, input.user);
  const hashKind = classifyWpHash(input.user?.user_pass ?? "");

  let email = (
    input.user?.user_email ||
    metaGet(meta, "email_cliente") ||
    `boda-${boda.ID}@imported.debodas.local`
  )
    .toLowerCase()
    .trim();

  const { existing, map, slugTakenByOther } = await findExistingBoda(db, boda.ID, baseSlug);

  let slug = existing?.slug ?? baseSlug;
  if (!existing && slugTakenByOther) {
    slug = ctx.dryRun ? `${baseSlug}-${boda.ID}` : await uniqueSlug(db, baseSlug, boda.ID);
    warnings.push({
      code: "DUPLICATE_SLUG",
      message: `El slug "${baseSlug}" ya lo usa otra boda; esta se importa como "${slug}".`,
    });
  }
  if (existing && existing.slug !== baseSlug) {
    warnings.push({
      code: "SLUG_CHANGED",
      message: `En WP el slug es "${baseSlug}" pero en Next sigue "${existing.slug}" (no se renombra).`,
    });
  }

  // ---- Decisión ----
  let decision: "create" | "update" | "overwrite" | "skip" = "create";
  let reason: string | undefined;
  if (existing) {
    if (ctx.mode === "only-new") {
      decision = "skip";
      reason = "already_imported";
    } else if (ctx.mode === "overwrite") {
      decision = "overwrite";
    } else if (!map) {
      decision = "skip";
      reason = "no_baseline";
      warnings.push({
        code: "NO_BASELINE",
        message:
          "Importada antes de legacy_map: se adopta sin tocarla. Para refrescarla usá --overwrite en staging.",
      });
    } else if (map.sourceHash && map.sourceHash === sourceHash) {
      decision = "skip";
      reason = "unchanged";
    } else if (await editedInNextSince(db, existing, map.importedAt)) {
      decision = "skip";
      reason = "edited_in_next";
      warnings.push({
        code: "EDITED_IN_NEXT",
        message: "Cambió en WP pero también se editó en Next después del último import: no se pisa.",
      });
    } else {
      decision = "update";
    }
  }

  // Cuenta dada de baja en Next: nunca se reimporta ni se pisa, en ningún modo.
  if (existing) {
    const owner = await db.user.findUnique({
      where: { id: existing.userId },
      select: { status: true },
    });
    if (owner && normalizeAccountStatus(owner.status) === "deleted") {
      decision = "skip";
      reason = "account_deleted";
    }
  }

  // Emails repetidos dentro de la misma corrida (útil sobre todo en dry-run).
  if (decision === "create") {
    if (ctx.usedEmails.has(email)) {
      const alt = syntheticEmail(email, boda.ID);
      if (ctx.dryRun) {
        warnings.push({
          code: "MULTI_BODA_OWNER",
          message: `Email repetido en la corrida; se usaría ${alt}.`,
        });
      }
      email = ctx.dryRun ? alt : email;
    }
    ctx.usedEmails.add(email);
  }

  const needsReset = decision === "create" && !ctx.passwordHash && hashKind === "unknown" && Boolean(input.user);
  warnings.push(
    ...collectWarnings({
      albumHint: 0,
      pictures: 0,
      needsReset,
      guests: [],
    }),
  );

  const base = resultBase(input, slug, email, sourceHash);

  if (decision === "skip") {
    if (!ctx.dryRun && existing && !map) {
      // Adopción conservadora: línea base = updatedAt actual (cualquier hijo posterior cuenta como edición).
      await upsertMap(db, "boda", boda.ID, existing.id, ctx.runId, sourceHash, existing.updatedAt);
    }
    return {
      ok: true,
      ...base,
      bodaId: existing?.id ?? null,
      action: "skipped",
      reason,
      hashKind,
      needsPasswordReset: false,
      warnings,
    };
  }

  const payload = mappedBodaPayload(boda, meta, input.attachments);
  const albumWarnings = collectWarnings({
    albumHint: payload.albumHint,
    pictures: payload.pictures.length,
    needsReset: false,
    guests: payload.guests,
  });
  warnings.push(...albumWarnings);

  if (ctx.dryRun) {
    const action: WpImportAction =
      decision === "create" ? "would_create" : decision === "update" ? "would_update" : "would_overwrite";
    return {
      ok: true,
      ...base,
      bodaId: existing?.id ?? null,
      action,
      hashKind,
      needsPasswordReset: needsReset,
      counts: {
        gifts: payload.gifts.length,
        pictures: payload.pictures.length,
        guests: payload.guests.length,
        confirmedGifts: payload.confirmedGifts.length,
      },
      warnings,
    };
  }

  // Clave: solo hace falta si vamos a crear un usuario.
  const plan: ImportPasswordPlan | null =
    decision === "create"
      ? ctx.passwordHash
        ? { kind: hashKind, passwordHash: ctx.passwordHash, legacyPasswordHash: null, needsReset: false }
        : await planImportPassword(input.user?.user_pass ?? "")
      : null;

  const name =
    input.user?.display_name ||
    [payload.couple.bride_name, payload.couple.groom_name].filter(Boolean).join(" & ") ||
    boda.post_title;

  const result = await db.$transaction(async (tx) => {
    const mapped = await applyRehostedMedia(tx, {
      banner: payload.banner,
      misc: payload.misc,
      featuredImageUrl: payload.featuredImageUrl,
      gifts: payload.gifts,
      pictures: payload.pictures,
      confirmedGifts: payload.confirmedGifts,
    });

    const bodaFields = {
      title: boda.post_title || slug,
      plan: payload.plan,
      micrositeTheme: payload.theme,
      couple: payload.couple as Prisma.InputJsonObject,
      event: payload.event as Prisma.InputJsonObject,
      banner: mapped.banner as Prisma.InputJsonObject,
      options: payload.options as Prisma.InputJsonObject,
      misc: mapped.misc as Prisma.InputJsonObject,
      giftsListTitle: payload.giftsListTitle,
      featuredImageUrl: mapped.featuredImageUrl,
      isOnline: payload.isOnline,
      updatedAt: boda.post_modified,
    };

    let bodaId: string;
    let ownerEmail = email;
    if (decision === "create") {
      const owner = await resolveOwner(tx, {
        email,
        name,
        createdAt: input.user?.user_registered ?? boda.post_date,
        wpUser: input.user,
        plan: plan!,
        wpPostId: boda.ID,
        runId: ctx.runId,
        warnings,
      });
      ownerEmail = owner.email;
      const created = await tx.boda.create({
        data: { ...bodaFields, userId: owner.userId, slug, createdAt: boda.post_date },
        select: { id: true },
      });
      bodaId = created.id;
    } else {
      bodaId = existing!.id;
      await tx.gift.deleteMany({ where: { bodaId } });
      await tx.picture.deleteMany({ where: { bodaId } });
      await tx.scheduleItem.deleteMany({ where: { bodaId } });
      await tx.faqItem.deleteMany({ where: { bodaId } });
      await tx.rsvpGuest.deleteMany({ where: { bodaId } });
      // Los regalos confirmados atados a un pago de Next nunca se borran.
      await tx.confirmedGift.deleteMany({ where: { bodaId, paymentId: null } });
      await tx.boda.update({ where: { id: bodaId }, data: bodaFields });
    }

    if (mapped.gifts.length) {
      await tx.gift.createMany({ data: mapped.gifts.map((g) => ({ ...g, bodaId })) });
    }
    if (mapped.pictures.length) {
      await tx.picture.createMany({ data: mapped.pictures.map((p) => ({ ...p, bodaId })) });
    }
    if (payload.schedule.length) {
      await tx.scheduleItem.createMany({ data: payload.schedule.map((s) => ({ ...s, bodaId })) });
    }
    if (payload.faqItems.length) {
      await tx.faqItem.createMany({ data: payload.faqItems.map((f) => ({ ...f, bodaId })) });
    }
    if (payload.guests.length) {
      await tx.rsvpGuest.createMany({ data: payload.guests.map((g) => ({ ...g, bodaId })) });
    }
    if (mapped.confirmedGifts.length) {
      await tx.confirmedGift.createMany({
        data: mapped.confirmedGifts.map((g) => ({
          bodaId,
          participants: g.participants,
          email: g.email,
          phone: g.phone,
          dedication: g.dedication,
          method: g.method,
          amount: g.amount,
          currency: g.currency,
          items: g.items,
          voucherUrl: g.voucherUrl,
          confirmed: g.confirmed,
        })),
      });
    }

    await upsertMap(tx, "boda", boda.ID, bodaId, ctx.runId, sourceHash, new Date());
    return { bodaId, ownerEmail };
  }, TX_OPTIONS);

  const action: WpImportAction =
    decision === "create" ? "created" : decision === "update" ? "updated" : "overwritten";
  return {
    ok: true,
    ...base,
    email: result.ownerEmail,
    bodaId: result.bodaId,
    action,
    hashKind,
    needsPasswordReset: Boolean(plan?.needsReset),
    counts: {
      gifts: payload.gifts.length,
      pictures: payload.pictures.length,
      guests: payload.guests.length,
      confirmedGifts: payload.confirmedGifts.length,
    },
    warnings,
  };
}
