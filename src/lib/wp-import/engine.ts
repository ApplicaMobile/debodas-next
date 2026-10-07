import type mysql from "mysql2/promise";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { BodaPaymentSettings } from "@/lib/bodas/payment-settings";
import { collectGalleryAttachmentIds, hasPaymentSettings } from "@/lib/wp-import/migrate-fields";
import { metaGet, metaInt } from "@/lib/wp-import/acf";
import {
  openWpConnection,
  wpDatabaseUrl,
  wpTablePrefix,
  wpTablesAvailable,
} from "@/lib/wp-import/connection";
import {
  collectWarnings,
  coupleLabelFromMeta,
  findWpUserByEmail,
  loadAttachmentUrls,
  loadMeta,
  loadWpBodas,
  loadWpBodasForUser,
  loadWpSiteUrl,
  loadWpUsers,
  mappedBodaPayload,
} from "@/lib/wp-import/map";
import { isWpUserTombstoned, persistWpBoda, type ImportDb } from "@/lib/wp-import/persist";
import { classifyWpHash, hashPasswordForNext, verifyWpHash } from "@/lib/wp-import/passwords";
import { rehostBodaImages, type RehostResult } from "@/lib/wp-import/rehost";
import type { WpImportCliArgs } from "@/lib/wp-import/cli-args";
import { RunLog, defaultLogDir, newRunId, redactDatabaseUrl } from "@/lib/wp-import/run-log";
import type {
  WpBodaListItem,
  WpBodaPreview,
  WpImportMode,
  WpMigrateOptions,
  WpMigrateResult,
  WpUserRow,
} from "@/lib/wp-import/types";

export { wpDatabaseUrl, wpTablesAvailable };

/** Tope de bodas por clic en el admin (la corrida masiva va por CLI). */
export const ADMIN_BATCH_CAP = 25;

function wpPostIdFromMisc(misc: unknown): number | null {
  if (!misc || typeof misc !== "object" || Array.isArray(misc)) {
    return null;
  }
  const n = Number((misc as Record<string, unknown>).wp_post_id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Índice WP → Prisma: legacy_map primero, después misc.wp_post_id y slug. */
async function prismaIndexByWp() {
  const [bodas, maps] = await Promise.all([
    prisma.boda.findMany({
      select: { id: true, slug: true, misc: true, user: { select: { status: true } } },
    }),
    prisma.legacyMap.findMany({ where: { kind: "boda" }, select: { wpId: true, prismaId: true } }),
  ]);
  type IndexRow = { id: string; slug: string; deleted: boolean };
  const byId = new Map<string, IndexRow>();
  const byWpId = new Map<number, IndexRow>();
  const bySlug = new Map<string, IndexRow & { wpPostId: number | null }>();
  for (const boda of bodas) {
    const row = { id: boda.id, slug: boda.slug, deleted: boda.user?.status === "deleted" };
    byId.set(boda.id, row);
    const wpId = wpPostIdFromMisc(boda.misc);
    bySlug.set(boda.slug, { ...row, wpPostId: wpId });
    if (wpId) {
      byWpId.set(wpId, row);
    }
  }
  for (const map of maps) {
    const row = byId.get(map.prismaId);
    if (row) byWpId.set(map.wpId, row);
  }
  return { byWpId, bySlug };
}

function ownerOf(meta: Map<string, string>, boda: { post_author: number }, users: Map<number, WpUserRow>) {
  const wpUserId = metaInt(meta, "user") || metaInt(meta, "users") || boda.post_author;
  return wpUserId ? (users.get(wpUserId) ?? null) : null;
}

export async function listWpBodas(filter?: {
  q?: string;
  status?: WpBodaListItem["status"] | "all";
}): Promise<WpBodaListItem[]> {
  const conn = await openWpConnection();
  try {
    if (!(await wpTablesAvailable(conn))) {
      return [];
    }
    const [users, bodas, index] = await Promise.all([
      loadWpUsers(conn),
      loadWpBodas(conn),
      prismaIndexByWp(),
    ]);

    const q = (filter?.q ?? "").trim().toLowerCase();
    const statusFilter = filter?.status ?? "all";
    const items: WpBodaListItem[] = [];

    for (const boda of bodas) {
      const meta = await loadMeta(conn, boda.ID);
      const user = ownerOf(meta, boda, users);
      const payload = mappedBodaPayload(boda, meta, new Map());
      const slug = boda.post_name || `boda-${boda.ID}`;
      const email =
        user?.user_email ||
        metaGet(meta, "email_cliente") ||
        `boda-${boda.ID}@imported.debodas.local`;
      // Identidad por ID de WP; el slug solo cuenta si la boda tiene ese mismo wp_post_id.
      const slugRow = index.bySlug.get(slug);
      const prismaRow =
        index.byWpId.get(boda.ID) ?? (slugRow && slugRow.wpPostId === boda.ID ? slugRow : null);
      const status: WpBodaListItem["status"] = prismaRow
        ? prismaRow.deleted
          ? "eliminada"
          : "migrada"
        : "pendiente";
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
        needsPasswordReset: Boolean(user) && classifyWpHash(user?.user_pass) === "unknown",
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
    const attachments = await loadAttachmentUrls(conn, collectGalleryAttachmentIds(meta), siteUrl);
    const payload = mappedBodaPayload(boda, meta, attachments);
    const user = ownerOf(meta, boda, users);
    const email =
      user?.user_email ||
      metaGet(meta, "email_cliente") ||
      `boda-${boda.ID}@imported.debodas.local`;
    const needsReset = Boolean(user) && classifyWpHash(user?.user_pass) === "unknown";
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

interface RunState {
  conn: mysql.Connection;
  siteUrl: string;
  users: Map<number, WpUserRow>;
  usedEmails: Set<string>;
  runId: string;
}

async function importOne(
  state: RunState,
  boda: Awaited<ReturnType<typeof loadWpBodas>>[number],
  options: WpMigrateOptions,
  db: ImportDb = prisma,
): Promise<WpMigrateResult> {
  try {
    const meta = await loadMeta(state.conn, boda.ID);
    const user = ownerOf(meta, boda, state.users);
    const attachments = await loadAttachmentUrls(
      state.conn,
      collectGalleryAttachmentIds(meta),
      state.siteUrl,
    );
    return await persistWpBoda(
      { boda, meta, user, attachments },
      {
        db,
        mode: options.mode ?? "only-new",
        dryRun: Boolean(options.dryRun),
        runId: options.runId ?? state.runId,
        usedEmails: state.usedEmails,
        passwordHash: options.passwordHash,
      },
    );
  } catch (error) {
    return {
      ok: false,
      wpPostId: boda.ID,
      slug: boda.post_name || `boda-${boda.ID}`,
      action: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function openRun(runId?: string): Promise<RunState> {
  const conn = await openWpConnection();
  try {
    const [siteUrl, users] = await Promise.all([loadWpSiteUrl(conn), loadWpUsers(conn)]);
    return {
      conn,
      siteUrl,
      users,
      usedEmails: new Set(["admin@debodas.local"]),
      runId: runId ?? newRunId(),
    };
  } catch (error) {
    await conn.end();
    throw error;
  }
}

export async function migrateBoda(
  wpPostId: number,
  options: WpMigrateOptions = {},
): Promise<WpMigrateResult> {
  const results = await migrateMany([wpPostId], options);
  return results[0]!;
}

/** Importa varias bodas por ID de WP. Una transacción por boda; si una falla, sigue. */
export async function migrateMany(
  wpPostIds: number[],
  options: WpMigrateOptions = {},
): Promise<WpMigrateResult[]> {
  if (wpPostIds.length === 0) return [];
  let state: RunState;
  try {
    state = await openRun(options.runId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return wpPostIds.map((id) => ({ ok: false, wpPostId: id, slug: "", action: "error", error: message }));
  }
  try {
    const bodas = await loadWpBodas(state.conn, { ids: wpPostIds });
    const found = new Map(bodas.map((b) => [b.ID, b]));
    const results: WpMigrateResult[] = [];
    for (const id of wpPostIds) {
      const boda = found.get(id);
      if (!boda) {
        results.push({ ok: false, wpPostId: id, slug: "", action: "error", error: `No hay boda WP #${id}` });
        continue;
      }
      results.push(await importOne(state, boda, options));
    }
    return results;
  } finally {
    await state.conn.end();
  }
}

/**
 * Importa calificaciones (CPT `calificacion`) de bodas ya migradas.
 * Idempotente vía legacy_map (kind "rating"); solo `overwrite` pisa una existente.
 */
export async function importRatingsForMigrated(
  options: { mode?: WpImportMode; runId?: string; dryRun?: boolean } = {},
): Promise<number> {
  const mode = options.mode ?? "only-new";
  const runId = options.runId ?? newRunId();
  const conn = await openWpConnection();
  try {
    const prefix = wpTablePrefix();
    const [rows] = await conn.query<mysql.RowDataPacket[]>(
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
      const score = Math.min(5, Math.max(1, metaInt(meta, "puntuacion", 5) || 5));
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
      if (!prismaBoda || prismaBoda.deleted) {
        continue;
      }
      const mapped = await prisma.legacyMap.findUnique({
        where: { kind_wpId: { kind: "rating", wpId: postId } },
        select: { id: true },
      });
      if (mapped && mode !== "overwrite") {
        continue;
      }
      if (options.dryRun) {
        imported += 1;
        continue;
      }
      await prisma.$transaction(async (tx) => {
        const rating = await tx.rating.upsert({
          where: { bodaId_email: { bodaId: prismaBoda.id, email } },
          create: {
            bodaId: prismaBoda.id,
            name,
            email,
            score,
            comment,
            status,
            createdAt: new Date(row.post_date),
          },
          // Sin overwrite no se pisa una calificación que ya existe (pudo moderarse en Next).
          update: mode === "overwrite" ? { name, score, comment, status } : {},
          select: { id: true },
        });
        await tx.legacyMap.upsert({
          where: { kind_wpId: { kind: "rating", wpId: postId } },
          create: { kind: "rating", wpId: postId, prismaId: rating.id, runId },
          update: { prismaId: rating.id, runId, importedAt: new Date() },
        });
      });
      imported += 1;
    }
    return imported;
  } finally {
    await conn.end();
  }
}

/**
 * "Migrar pendientes" del admin: solo nuevas (nunca pisa) y con tope por clic.
 * Para la corrida masiva usar `npm run db:import-wp`.
 */
export async function migrateAllPending(
  options: { cap?: number; runId?: string } = {},
): Promise<{ results: WpMigrateResult[]; pending: number; cap: number }> {
  const cap = Math.max(1, Math.min(options.cap ?? ADMIN_BATCH_CAP, ADMIN_BATCH_CAP));
  const pending = await listWpBodas({ status: "pendiente" });
  const runId = options.runId ?? newRunId();
  const results = await migrateMany(
    pending.slice(0, cap).map((item) => item.wpPostId),
    { mode: "only-new", runId },
  );
  try {
    await importRatingsForMigrated({ mode: "only-new", runId });
  } catch (error) {
    console.warn("[wp-import] ratings:", error instanceof Error ? error.message : error);
  }
  return { results, pending: pending.length, cap };
}

export async function rehostBoda(bodaId: string): Promise<RehostResult> {
  return rehostBodaImages(bodaId);
}

/** Verifica la clave contra wp_users ($wp$2y$, bcrypt, $P$, MD5). */
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
    if (!(await verifyWpHash(password, user.user_pass))) {
      return null;
    }
    return {
      wpUserId: user.ID,
      email: user.user_email,
      name: user.display_name,
      passwordHash: await hashPasswordForNext(password),
    };
  } catch {
    return null;
  } finally {
    await conn.end();
  }
}

/**
 * Login perezoso: el email no existe en Prisma pero sí en wp_users. Si la
 * clave coincide, se importan sus bodas (solo nuevas) con un bcrypt fresco.
 */
export async function migrateWpUserOnLogin(input: {
  email: string;
  password: string;
}): Promise<{ userId: string; bodaSlug: string | null } | null> {
  const verified = await verifyWpPassword(input.email, input.password);
  if (!verified) {
    return null;
  }
  const state = await openRun();
  try {
    const user = await findWpUserByEmail(state.conn, verified.email);
    if (!user) {
      return null;
    }
    // Cuenta eliminada en Next (aunque esté anonimizada): no se recrea desde WordPress.
    if (await isWpUserTombstoned(prisma, { wpUserId: user.ID, email: verified.email })) {
      return null;
    }
    const bodas = await loadWpBodasForUser(state.conn, user);
    if (bodas.length === 0) {
      const existing = await prisma.user.findUnique({
        where: { email: verified.email },
        include: { boda: { select: { slug: true } } },
      });
      if (existing) {
        return { userId: existing.id, bodaSlug: existing.boda?.slug ?? null };
      }
      const legacyTaken = await prisma.user.findUnique({
        where: { legacyWpUserId: user.ID },
        select: { id: true },
      });
      const created = await prisma.user.create({
        data: {
          email: verified.email,
          name: verified.name || null,
          passwordHash: verified.passwordHash,
          role: "couple",
          migratedFromWp: true,
          legacyWpUserId: legacyTaken ? null : user.ID,
        },
      });
      return { userId: created.id, bodaSlug: null };
    }
    let lastUserId = "";
    let lastSlug: string | null = null;
    for (const boda of bodas) {
      const result = await importOne(state, boda, {
        mode: "only-new",
        passwordHash: verified.passwordHash,
      });
      if (!result.ok || !result.bodaId) {
        continue;
      }
      const row = await prisma.boda.findUnique({
        where: { id: result.bodaId },
        select: {
          userId: true,
          slug: true,
          user: { select: { legacyWpUserId: true, email: true, status: true } },
        },
      });
      if (!row || row.user.status === "deleted") continue;
      // Solo devolvemos una cuenta que sea de este usuario WP (recién creada o ligada por ID/email).
      const belongs =
        result.action === "created" ||
        row.user.legacyWpUserId === user.ID ||
        row.user.email === verified.email;
      if (belongs) {
        lastUserId = row.userId;
        lastSlug = row.slug;
      }
    }
    if (!lastUserId) {
      return null;
    }
    return { userId: lastUserId, bodaSlug: lastSlug };
  } finally {
    await state.conn.end();
  }
}

export interface CliRunSummary {
  runId: string;
  mode: WpImportMode;
  dryRun: boolean;
  total: number;
  byAction: Record<string, number>;
  warningsByCode: Record<string, number>;
  hashKinds: Record<string, number>;
  failed: Array<{ wpPostId: number; error: string }>;
  duplicateSlugs: Array<{ wpPostId: number; slug: string }>;
  ratings: number | null;
  logFile: string;
  reportFile: string;
}

function bump(record: Record<string, number>, key: string) {
  record[key] = (record[key] ?? 0) + 1;
}

/** CLI `npm run db:import-wp`. Una transacción por boda, sigue ante errores, JSONL por corrida. */
export async function runCliImport(args: WpImportCliArgs): Promise<CliRunSummary | null> {
  const runId = newRunId();
  const log = new RunLog(runId, args.logDir ?? defaultLogDir());
  const state = await openRun(runId);
  try {
    console.log("WP → Prisma import");
    console.log(`  run: ${runId}`);
    console.log(`  source: ${redactDatabaseUrl(wpDatabaseUrl())}`);
    console.log(
      `  mode: ${args.mode}${args.dryRun ? " (DRY-RUN, sin escrituras)" : ""} | limit=${args.limit ?? "all"} | ids=${args.ids?.join(",") ?? "all"} | slug=${args.slug ?? "all"}`,
    );
    if (args.mode === "overwrite") {
      console.warn("  ⚠ --overwrite: se reemplazan regalos, fotos, RSVP y regalos confirmados sin pago de las bodas existentes.");
    }
    if (!(await wpTablesAvailable(state.conn))) {
      console.error("No se encontraron tablas wp_posts. Revisá WP_DATABASE_URL / WP_TABLE_PREFIX.");
      return null;
    }
    const bodas = await loadWpBodas(state.conn, { slug: args.slug, ids: args.ids, limit: args.limit });
    console.log(`  siteurl: ${state.siteUrl}`);
    console.log(`  bodas a procesar: ${bodas.length} | usuarios WP: ${state.users.size}`);
    console.log(`  log: ${log.file}`);

    const summary: CliRunSummary = {
      runId,
      mode: args.mode,
      dryRun: args.dryRun,
      total: bodas.length,
      byAction: {},
      warningsByCode: {},
      hashKinds: {},
      failed: [],
      duplicateSlugs: [],
      ratings: null,
      logFile: log.file,
      reportFile: log.reportFile,
    };

    for (const boda of bodas) {
      const result = await importOne(state, boda, { mode: args.mode, dryRun: args.dryRun, runId });
      bump(summary.byAction, result.action ?? (result.ok ? "ok" : "error"));
      if (result.hashKind) bump(summary.hashKinds, result.hashKind);
      for (const w of result.warnings ?? []) {
        bump(summary.warningsByCode, w.code);
        if (w.code === "DUPLICATE_SLUG") summary.duplicateSlugs.push({ wpPostId: result.wpPostId, slug: result.slug });
      }
      if (!result.ok) {
        summary.failed.push({ wpPostId: boda.ID, error: result.error ?? "error" });
        console.error(`[fail] #${boda.ID} ${boda.post_name}: ${result.error}`);
      } else {
        const codes = (result.warnings ?? []).map((w) => w.code).join(",");
        console.log(
          `[${result.action}${result.reason ? `:${result.reason}` : ""}] #${result.wpPostId} ${result.slug} → ${result.email ?? ""}${codes ? ` | ${codes}` : ""}`,
        );
      }
      log.write({
        wpPostId: result.wpPostId,
        slug: result.slug,
        email: result.email,
        bodaId: result.bodaId ?? null,
        action: result.action,
        reason: result.reason,
        hashKind: result.hashKind,
        sourceHash: result.sourceHash,
        counts: result.counts,
        warnings: result.warnings ?? [],
        error: result.error,
      });
    }

    if (!args.skipRatings) {
      try {
        summary.ratings = await importRatingsForMigrated({
          mode: args.mode,
          runId,
          dryRun: args.dryRun,
        });
      } catch (error) {
        console.warn("  ratings:", error instanceof Error ? error.message : error);
      }
    }

    log.writeReport(summary as unknown as Record<string, unknown>);

    if (!args.dryRun) {
      await prisma.adminAuditLog.create({
        data: {
          actorEmail: "cli:db:import-wp",
          action: "admin.wp.import_cli",
          entity: "wp_boda",
          entityId: runId,
          metadata: {
            mode: summary.mode,
            total: summary.total,
            byAction: summary.byAction,
            warningsByCode: summary.warningsByCode,
            failed: summary.failed.slice(0, 50),
            duplicateSlugs: summary.duplicateSlugs,
            ratings: summary.ratings,
          } as Prisma.InputJsonObject,
        },
      });
    }

    console.log("—".repeat(48));
    console.log(`Listo (${args.dryRun ? "dry-run" : args.mode}):`, JSON.stringify(summary.byAction));
    if (Object.keys(summary.warningsByCode).length) {
      console.log("Avisos:", JSON.stringify(summary.warningsByCode));
    }
    console.log("Hashes:", JSON.stringify(summary.hashKinds));
    console.log(`Reporte: ${log.reportFile}`);
    return summary;
  } finally {
    await state.conn.end();
  }
}
