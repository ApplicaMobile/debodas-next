import { hash } from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { BodaPaymentSettings } from "@/lib/bodas/payment-settings";
import { hasPaymentSettings } from "@/lib/wp-import/migrate-fields";
import { isPhpassHash, verifyPhpass } from "@/lib/wp-import/phpass";
import { adaptWpPasswordHash } from "@/lib/wp-import/acf";
import {
  collectGalleryAttachmentIds,
} from "@/lib/wp-import/migrate-fields";
import { metaGet, metaInt } from "@/lib/wp-import/acf";
import {
  openWpConnection,
  wpDatabaseUrl,
  wpTablesAvailable,
} from "@/lib/wp-import/connection";
import {
  collectWarnings,
  coupleLabelFromMeta,
  dryRunHash,
  findWpUserByEmail,
  loadAttachmentUrls,
  loadMeta,
  loadWpBodas,
  loadWpBodasForUser,
  loadWpSiteUrl,
  loadWpUsers,
  mappedBodaPayload,
  resolvePasswordHash,
  syntheticEmail,
} from "@/lib/wp-import/map";
import { rehostBodaImages } from "@/lib/wp-import/rehost";
import type {
  WpBodaListItem,
  WpBodaPreview,
  WpMigrateOptions,
  WpMigrateResult,
  WpUserRow,
} from "@/lib/wp-import/types";

export { wpDatabaseUrl, wpTablesAvailable };

async function upsertUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  dryRun: boolean;
}): Promise<string> {
  if (input.dryRun) {
    return dryRunHash(input.email);
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, role: true },
  });

  if (existing) {
    if (existing.role === "admin") {
      return existing.id;
    }
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: input.name || undefined,
        passwordHash: input.passwordHash,
      },
    });
    return existing.id;
  }

  const created = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name || null,
      passwordHash: input.passwordHash,
      role: "couple",
      createdAt: input.createdAt,
    },
  });
  return created.id;
}

function wpPostIdFromMisc(misc: unknown): number | null {
  if (!misc || typeof misc !== "object" || Array.isArray(misc)) {
    return null;
  }
  const raw = (misc as Record<string, unknown>).wp_post_id;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function prismaIndexByWp() {
  const bodas = await prisma.boda.findMany({
    select: { id: true, slug: true, misc: true },
  });
  const byWpId = new Map<number, { id: string; slug: string }>();
  const bySlug = new Map<string, { id: string; slug: string }>();
  for (const boda of bodas) {
    const row = { id: boda.id, slug: boda.slug };
    bySlug.set(boda.slug, row);
    const wpId = wpPostIdFromMisc(boda.misc);
    if (wpId) {
      byWpId.set(wpId, row);
    }
  }
  return { byWpId, bySlug };
}

export async function listWpBodas(filter?: {
  q?: string;
  status?: "pendiente" | "migrada" | "all";
}): Promise<WpBodaListItem[]> {
  const conn = await openWpConnection();
  try {
    if (!(await wpTablesAvailable(conn))) {
      return [];
    }
    const [siteUrl, users, bodas, index] = await Promise.all([
      loadWpSiteUrl(conn),
      loadWpUsers(conn),
      loadWpBodas(conn),
      prismaIndexByWp(),
    ]);
    void siteUrl;

    const q = (filter?.q ?? "").trim().toLowerCase();
    const statusFilter = filter?.status ?? "all";
    const items: WpBodaListItem[] = [];

    for (const boda of bodas) {
      const meta = await loadMeta(conn, boda.ID);
      const wpUserId =
        metaInt(meta, "user") || metaInt(meta, "users") || boda.post_author;
      const user = wpUserId ? (users.get(wpUserId) ?? null) : null;
      const payload = mappedBodaPayload(boda, meta, new Map());
      const slug = boda.post_name || `boda-${boda.ID}`;
      const email =
        user?.user_email ||
        metaGet(meta, "email_cliente") ||
        `boda-${boda.ID}@imported.debodas.local`;
      const prismaRow = index.byWpId.get(boda.ID) ?? index.bySlug.get(slug) ?? null;
      const status: WpBodaListItem["status"] = prismaRow ? "migrada" : "pendiente";
      if (statusFilter !== "all" && status !== statusFilter) {
        continue;
      }
      const haystack = `${slug} ${email} ${boda.post_title} ${payload.couple.bride_name} ${payload.couple.groom_name}`.toLowerCase();
      if (q && !haystack.includes(q)) {
        continue;
      }
      items.push({
        wpPostId: boda.ID,
        slug,
        title: boda.post_title || slug,
        email: email.toLowerCase().trim(),
        coupleLabel: coupleLabelFromMeta(meta, boda.post_title || slug),
        plan: payload.plan,
        eventDate: String(payload.event.date ?? ""),
        isOnline: payload.isOnline,
        pictureCount: Math.max(payload.pictures.length, payload.albumHint),
        giftCount: payload.gifts.length,
        guestCount: payload.guests.length,
        albumHint: payload.albumHint,
        needsPasswordReset: isPhpassHash(user?.user_pass ?? ""),
        status,
        prismaBodaId: prismaRow?.id ?? null,
        prismaSlug: prismaRow?.slug ?? null,
      });
    }
    return items;
  } finally {
    await conn.end();
  }
}

export async function previewBoda(
  wpPostId: number,
): Promise<WpBodaPreview> {
  const conn = await openWpConnection();
  try {
    const [siteUrl, users, bodas] = await Promise.all([
      loadWpSiteUrl(conn),
      loadWpUsers(conn),
      loadWpBodas(conn, { wpPostId }),
    ]);
    const boda = bodas[0];
    if (!boda) {
      throw new Error(`No hay boda WP #${wpPostId}`);
    }
    const meta = await loadMeta(conn, boda.ID);
    const attachmentIds = collectGalleryAttachmentIds(meta);
    const attachments = await loadAttachmentUrls(conn, attachmentIds, siteUrl);
    const payload = mappedBodaPayload(boda, meta, attachments);
    const wpUserId =
      metaInt(meta, "user") || metaInt(meta, "users") || boda.post_author;
    const user = wpUserId ? (users.get(wpUserId) ?? null) : null;
    const email =
      user?.user_email ||
      metaGet(meta, "email_cliente") ||
      `boda-${boda.ID}@imported.debodas.local`;
    const needsReset = isPhpassHash(user?.user_pass ?? "");
    const warnings = collectWarnings({
      albumHint: payload.albumHint,
      pictures: payload.pictures.length,
      needsReset,
      guests: payload.guests,
    });
    return {
      wpPostId: boda.ID,
      slug: boda.post_name || `boda-${boda.ID}`,
      email: email.toLowerCase().trim(),
      plan: payload.plan,
      theme: payload.theme,
      isOnline: payload.isOnline,
      gifts: payload.gifts.length,
      pictures: payload.pictures.length,
      guests: payload.guests.length,
      confirmedGifts: payload.confirmedGifts.length,
      invitations: payload.invitations.length,
      faq: payload.faqItems.length,
      schedule: payload.schedule.length,
      hasPayments: hasPaymentSettings(payload.paymentSettings as BodaPaymentSettings),
      hasDressCode: Boolean(payload.misc.dress_code),
      hasAbonar: payload.hasAbonar,
      abonarPagos: payload.abonarPagos,
      albumHint: payload.albumHint,
      needsPasswordReset: needsReset,
      warnings,
    };
  } finally {
    await conn.end();
  }
}

async function persistBoda(input: {
  boda: Awaited<ReturnType<typeof loadWpBodas>>[number];
  meta: Awaited<ReturnType<typeof loadMeta>>;
  user: WpUserRow | null;
  attachments: Map<number, string>;
  options: WpMigrateOptions;
  usedEmails: Set<string>;
}): Promise<WpMigrateResult> {
  const { boda, meta, attachments, options, usedEmails } = input;
  const dryRun = Boolean(options.dryRun);
  const overwrite = options.overwrite !== false;
  const slug = boda.post_name || `boda-${boda.ID}`;
  const payload = mappedBodaPayload(boda, meta, attachments);

  let email =
    input.user?.user_email ||
    metaGet(meta, "email_cliente") ||
    `boda-${boda.ID}@imported.debodas.local`;
  email = email.toLowerCase().trim();
  if (usedEmails.has(email)) {
    email = syntheticEmail(email, boda.ID);
  }
  usedEmails.add(email);

  let passwordHash = options.passwordHash;
  let needsReset = false;
  if (!passwordHash) {
    const resolved = await resolvePasswordHash(input.user?.user_pass ?? "");
    passwordHash = resolved.passwordHash;
    needsReset = resolved.needsReset;
  }

  const warnings = collectWarnings({
    albumHint: payload.albumHint,
    pictures: payload.pictures.length,
    needsReset,
    guests: payload.guests,
  });

  const name =
    input.user?.display_name ||
    [payload.couple.bride_name, payload.couple.groom_name].filter(Boolean).join(" & ") ||
    boda.post_title;

  if (dryRun) {
    return {
      ok: true,
      wpPostId: boda.ID,
      slug,
      email,
      bodaId: null,
      needsPasswordReset: needsReset,
      warnings,
    };
  }

  const existingBoda = await prisma.boda.findUnique({
    where: { slug },
    select: { id: true, userId: true },
  });
  if (existingBoda && !overwrite) {
    return {
      ok: true,
      wpPostId: boda.ID,
      slug,
      email,
      bodaId: existingBoda.id,
      needsPasswordReset: needsReset,
      warnings: [
        ...warnings,
        { code: "SKIPPED", message: "Ya existía; overwrite=false." },
      ],
    };
  }

  const userId = await upsertUser({
    email,
    name,
    passwordHash,
    createdAt: input.user?.user_registered ?? boda.post_date,
    dryRun: false,
  });

  const owned = await prisma.boda.findUnique({
    where: { userId },
    select: { id: true, slug: true },
  });

  let targetUserId = userId;
  if (owned && owned.slug !== slug) {
    const altEmail = syntheticEmail(email, boda.ID);
    targetUserId = await upsertUser({
      email: altEmail,
      name,
      passwordHash,
      createdAt: input.user?.user_registered ?? boda.post_date,
      dryRun: false,
    });
    usedEmails.add(altEmail);
    email = altEmail;
  }

  const bodaData: Prisma.BodaUncheckedCreateInput = {
    userId: targetUserId,
    slug,
    title: boda.post_title || slug,
    plan: payload.plan,
    micrositeTheme: payload.theme,
    couple: payload.couple,
    event: payload.event,
    banner: payload.banner as Prisma.InputJsonObject,
    options: payload.options as Prisma.InputJsonObject,
    misc: payload.misc as Prisma.InputJsonObject,
    giftsListTitle: payload.giftsListTitle,
    featuredImageUrl: payload.featuredImageUrl,
    isOnline: payload.isOnline,
    createdAt: boda.post_date,
    updatedAt: boda.post_modified,
  };

  let bodaId: string;
  if (existingBoda) {
    await prisma.gift.deleteMany({ where: { bodaId: existingBoda.id } });
    await prisma.picture.deleteMany({ where: { bodaId: existingBoda.id } });
    await prisma.scheduleItem.deleteMany({ where: { bodaId: existingBoda.id } });
    await prisma.faqItem.deleteMany({ where: { bodaId: existingBoda.id } });
    await prisma.rsvpGuest.deleteMany({ where: { bodaId: existingBoda.id } });
    await prisma.confirmedGift.deleteMany({ where: { bodaId: existingBoda.id } });
    await prisma.boda.update({
      where: { id: existingBoda.id },
      data: {
        title: bodaData.title,
        plan: bodaData.plan,
        micrositeTheme: bodaData.micrositeTheme,
        couple: bodaData.couple as Prisma.InputJsonValue,
        event: bodaData.event as Prisma.InputJsonValue,
        banner: bodaData.banner as Prisma.InputJsonValue,
        options: bodaData.options as Prisma.InputJsonValue,
        misc: bodaData.misc as Prisma.InputJsonValue,
        giftsListTitle: bodaData.giftsListTitle,
        featuredImageUrl: bodaData.featuredImageUrl,
        isOnline: bodaData.isOnline,
        updatedAt: boda.post_modified,
      },
    });
    bodaId = existingBoda.id;
  } else {
    const created = await prisma.boda.create({ data: bodaData });
    bodaId = created.id;
  }

  if (payload.gifts.length) {
    await prisma.gift.createMany({
      data: payload.gifts.map((g) => ({ ...g, bodaId })),
    });
  }
  if (payload.pictures.length) {
    await prisma.picture.createMany({
      data: payload.pictures.map((p) => ({ ...p, bodaId })),
    });
  }
  if (payload.schedule.length) {
    await prisma.scheduleItem.createMany({
      data: payload.schedule.map((s) => ({ ...s, bodaId })),
    });
  }
  if (payload.faqItems.length) {
    await prisma.faqItem.createMany({
      data: payload.faqItems.map((f) => ({ ...f, bodaId })),
    });
  }
  if (payload.guests.length) {
    await prisma.rsvpGuest.createMany({
      data: payload.guests.map((g) => ({ ...g, bodaId })),
    });
  }
  if (payload.confirmedGifts.length) {
    await prisma.confirmedGift.createMany({
      data: payload.confirmedGifts.map((g) => ({
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

  return {
    ok: true,
    wpPostId: boda.ID,
    slug,
    email,
    bodaId,
    needsPasswordReset: needsReset,
    warnings,
  };
}

export async function migrateBoda(
  wpPostId: number,
  options: WpMigrateOptions = {},
): Promise<WpMigrateResult> {
  const conn = await openWpConnection();
  try {
    const [siteUrl, users, bodas] = await Promise.all([
      loadWpSiteUrl(conn),
      loadWpUsers(conn),
      loadWpBodas(conn, { wpPostId }),
    ]);
    const boda = bodas[0];
    if (!boda) {
      return { ok: false, wpPostId, slug: "", error: `No hay boda WP #${wpPostId}` };
    }
    const meta = await loadMeta(conn, boda.ID);
    const wpUserId =
      metaInt(meta, "user") || metaInt(meta, "users") || boda.post_author;
    const user = wpUserId ? (users.get(wpUserId) ?? null) : null;
    const attachments = await loadAttachmentUrls(
      conn,
      collectGalleryAttachmentIds(meta),
      siteUrl,
    );
    return persistBoda({
      boda,
      meta,
      user,
      attachments,
      options,
      usedEmails: new Set(["admin@debodas.local"]),
    });
  } catch (error) {
    return {
      ok: false,
      wpPostId,
      slug: "",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await conn.end();
  }
}

export async function migrateMany(
  wpPostIds: number[],
  options: WpMigrateOptions = {},
): Promise<WpMigrateResult[]> {
  const results: WpMigrateResult[] = [];
  for (const id of wpPostIds) {
    results.push(await migrateBoda(id, options));
  }
  return results;
}

export async function importRatingsForMigrated(): Promise<number> {
  const conn = await openWpConnection();
  try {
    const prefix = (await import("@/lib/wp-import/connection")).wpTablePrefix();
    const [rows] = await conn.query<import("mysql2/promise").RowDataPacket[]>(
      `SELECT ID, post_date FROM ${prefix}posts WHERE post_type = 'calificacion' AND post_status = 'publish'`,
    );
    const index = await prismaIndexByWp();
    let imported = 0;
    for (const row of rows) {
      const postId = Number(row.ID);
      const meta = await loadMeta(conn, postId);
      const wpBodaId = metaInt(meta, "id_boda");
      const email = metaGet(meta, "email_cliente").toLowerCase();
      const name = metaGet(meta, "nombre_cliente") || "Cliente";
      const score = metaInt(meta, "puntuacion", 5);
      const comment = metaGet(meta, "comentario") || null;
      const estado = metaGet(meta, "estado").toLowerCase();
      const status =
        estado === "aprobado" || estado === "approved"
          ? "approved"
          : estado === "rechazado" || estado === "rejected"
            ? "rejected"
            : "pending";
      if (!wpBodaId || !email) {
        continue;
      }
      const prismaBoda = index.byWpId.get(wpBodaId);
      if (!prismaBoda) {
        continue;
      }
      await prisma.rating.upsert({
        where: { bodaId_email: { bodaId: prismaBoda.id, email } },
        create: {
          bodaId: prismaBoda.id,
          name,
          email,
          score: Math.min(5, Math.max(1, score || 5)),
          comment,
          status,
          createdAt: new Date(row.post_date),
        },
        update: {
          name,
          score: Math.min(5, Math.max(1, score || 5)),
          comment,
          status,
        },
      });
      imported += 1;
    }
    return imported;
  } finally {
    await conn.end();
  }
}

export async function migrateAllPending(
  options: WpMigrateOptions = {},
): Promise<WpMigrateResult[]> {
  const pending = await listWpBodas({ status: "pendiente" });
  const results = await migrateMany(
    pending.map((item) => item.wpPostId),
    options,
  );
  try {
    await importRatingsForMigrated();
  } catch (error) {
    console.warn("[wp-import] ratings:", error);
  }
  return results;
}

export async function rehostBoda(bodaId: string): Promise<{
  updated: number;
  failed: number;
}> {
  return rehostBodaImages(bodaId);
}

export async function verifyWpPassword(
  email: string,
  password: string,
): Promise<{
  wpUserId: number;
  email: string;
  name: string;
  passwordHash: string;
} | null> {
  const conn = await openWpConnection();
  try {
    if (!(await wpTablesAvailable(conn))) {
      return null;
    }
    const user = await findWpUserByEmail(conn, email);
    if (!user) {
      return null;
    }
    const adapted = adaptWpPasswordHash(user.user_pass);
    if (!adapted.needsReset && adapted.passwordHash) {
      const { compare } = await import("bcryptjs");
      const ok = await compare(password, adapted.passwordHash);
      if (!ok) {
        return null;
      }
    } else if (isPhpassHash(user.user_pass)) {
      if (!verifyPhpass(password, user.user_pass)) {
        return null;
      }
    } else {
      return null;
    }
    return {
      wpUserId: user.ID,
      email: user.user_email,
      name: user.display_name,
      passwordHash: await hash(password, 10),
    };
  } catch {
    return null;
  } finally {
    await conn.end();
  }
}

export async function migrateWpUserOnLogin(input: {
  email: string;
  password: string;
}): Promise<{ userId: string; bodaSlug: string | null } | null> {
  const verified = await verifyWpPassword(input.email, input.password);
  if (!verified) {
    return null;
  }
  const conn = await openWpConnection();
  try {
    const user = await findWpUserByEmail(conn, verified.email);
    if (!user) {
      return null;
    }
    const bodas = await loadWpBodasForUser(conn, user);
    if (bodas.length === 0) {
      const existing = await prisma.user.findUnique({
        where: { email: verified.email },
        include: { boda: { select: { slug: true } } },
      });
      if (existing) {
        return { userId: existing.id, bodaSlug: existing.boda?.slug ?? null };
      }
      const created = await prisma.user.create({
        data: {
          email: verified.email,
          name: verified.name || null,
          passwordHash: verified.passwordHash,
          role: "couple",
        },
      });
      return { userId: created.id, bodaSlug: null };
    }
    let lastUserId = "";
    let lastSlug: string | null = null;
    const siteUrl = await loadWpSiteUrl(conn);
    const usedEmails = new Set(["admin@debodas.local"]);
    for (const boda of bodas) {
      const meta = await loadMeta(conn, boda.ID);
      const attachments = await loadAttachmentUrls(
        conn,
        collectGalleryAttachmentIds(meta),
        siteUrl,
      );
      const result = await persistBoda({
        boda,
        meta,
        user,
        attachments,
        options: { overwrite: false, passwordHash: verified.passwordHash },
        usedEmails,
      });
      if (result.ok && result.bodaId) {
        const row = await prisma.boda.findUnique({
          where: { id: result.bodaId },
          select: { userId: true, slug: true },
        });
        if (row) {
          lastUserId = row.userId;
          lastSlug = row.slug;
        }
      }
    }
    if (!lastUserId) {
      return null;
    }
    return { userId: lastUserId, bodaSlug: lastSlug };
  } finally {
    await conn.end();
  }
}

export async function runCliImport(args: {
  dryRun: boolean;
  limit: number | null;
  slug: string | null;
}): Promise<void> {
  const conn = await openWpConnection();
  try {
    console.log("WP → Prisma import");
    console.log(`  source: ${wpDatabaseUrl()}`);
    console.log(
      `  mode: ${args.dryRun ? "DRY-RUN" : "WRITE"} | limit=${args.limit ?? "all"} | slug=${args.slug ?? "all"}`,
    );
    if (!(await wpTablesAvailable(conn))) {
      console.error("No se encontraron tablas wp_posts. Cargá el dump WP en esta misma BD.");
      return;
    }
    const siteUrl = await loadWpSiteUrl(conn);
    const users = await loadWpUsers(conn);
    const bodas = await loadWpBodas(conn, { slug: args.slug, limit: args.limit });
    console.log(`  siteurl: ${siteUrl}`);
    console.log(`  bodas a procesar: ${bodas.length}`);
    console.log(`  usuarios WP: ${users.size}`);

    const usedEmails = new Set<string>(["admin@debodas.local"]);
    let ok = 0;
    let fail = 0;
    let resets = 0;

    for (const boda of bodas) {
      const meta = await loadMeta(conn, boda.ID);
      const wpUserId =
        metaInt(meta, "user") || metaInt(meta, "users") || boda.post_author;
      const user = wpUserId ? (users.get(wpUserId) ?? null) : null;
      const attachments = await loadAttachmentUrls(
        conn,
        collectGalleryAttachmentIds(meta),
        siteUrl,
      );
      const result = await persistBoda({
        boda,
        meta,
        user,
        attachments,
        options: { dryRun: args.dryRun, overwrite: true },
        usedEmails,
      });
      if (result.ok) {
        ok += 1;
        if (result.needsPasswordReset) {
          resets += 1;
        }
        const extras = (result.warnings ?? []).map((w) => w.code).join(",");
        console.log(
          `[${args.dryRun ? "dry-run" : "ok"}] #${result.wpPostId} ${result.slug} → ${result.email}${extras ? ` | ${extras}` : ""}`,
        );
      } else {
        fail += 1;
        console.error(`[fail] #${boda.ID}: ${result.error}`);
      }
    }

    if (!args.dryRun) {
      const ratings = await importRatingsForMigrated();
      console.log(`  ratings: ${ratings}`);
    }

    console.log("—".repeat(48));
    console.log(`Listo: ok=${ok} fail=${fail} password_reset_needed≈${resets}`);
  } finally {
    await conn.end();
  }
}
