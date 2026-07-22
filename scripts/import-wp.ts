/**
 * Import WordPress dump (debodas_wp) → Prisma (debodas_web).
 *
 * Usage:
 *   npm run db:import-wp -- --dry-run
 *   npm run db:import-wp -- --limit=5
 *   npm run db:import-wp -- --slug=cande-y-marcelo-20260822
 *   npm run db:import-wp
 *
 * Requires WP_DATABASE_URL (and DATABASE_URL) in .env.local
 */
import { config } from "dotenv";
import { createHash, randomBytes } from "crypto";
import { hash } from "bcryptjs";
import mysql from "mysql2/promise";
import { PrismaClient, type Prisma } from "@prisma/client";
import {
  adaptWpPasswordHash,
  mapRsvpMenu,
  mapRsvpStatus,
  metaBool,
  metaGet,
  metaInt,
  normalizePlan,
  repairSpanishLostAccents,
  readRepeater,
  rowsToMeta,
  stripHtml,
  type MetaMap,
} from "./wp/acf";

config({ path: ".env.local" });
config();

const prisma = new PrismaClient();

const WP_URL =
  process.env.WP_DATABASE_URL ?? "mysql://root:@localhost:3306/debodas_wp";
const TABLE_PREFIX = process.env.WP_TABLE_PREFIX ?? "wp_";

interface CliArgs {
  dryRun: boolean;
  limit: number | null;
  slug: string | null;
}

function parseArgs(argv: string[]): CliArgs {
  let dryRun = false;
  let limit: number | null = null;
  let slug: string | null = null;

  for (const arg of argv) {
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg.startsWith("--limit=")) {
      limit = Number(arg.slice("--limit=".length));
    } else if (arg.startsWith("--slug=")) {
      slug = arg.slice("--slug=".length).trim();
    }
  }

  return { dryRun, limit, slug };
}

function mysqlConfigFromUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username || "root"),
    password: decodeURIComponent(parsed.password || ""),
    database: parsed.pathname.replace(/^\//, ""),
    charset: "utf8mb4" as const,
  };
}

type WpBodaRow = {
  ID: number;
  post_title: string;
  post_name: string;
  post_author: number;
  post_date: Date;
  post_modified: Date;
};

type WpUserRow = {
  ID: number;
  user_email: string;
  display_name: string;
  user_pass: string;
  user_registered: Date;
};

async function loadAttachmentUrls(
  conn: mysql.Connection,
  ids: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  const unique = [...new Set(ids.filter((id) => id > 0))];
  if (unique.length === 0) {
    return map;
  }

  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT ID, guid FROM ${TABLE_PREFIX}posts WHERE ID IN (?) AND post_type = 'attachment'`,
    [unique],
  );

  for (const row of rows) {
    const guid = String(row.guid ?? "").trim();
    if (guid) {
      // Prefer production host if dump rewrote siteurl to localhost
      map.set(
        Number(row.ID),
        guid
          .replace("http://localhost:8080", "https://debodas.com.ar")
          .replace("http://localhost", "https://debodas.com.ar"),
      );
    }
  }

  return map;
}

function collectAttachmentIds(meta: MetaMap): number[] {
  const ids: number[] = [];
  const push = (raw: string) => {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) {
      ids.push(n);
    }
  };

  push(metaGet(meta, "_thumbnail_id"));
  for (const [key, value] of meta) {
    if (
      key.endsWith("_image") ||
      key.endsWith("_voucher") ||
      key === "banner_image"
    ) {
      push(value);
    }
  }
  return ids;
}

function buildCouple(meta: MetaMap) {
  const bride =
    metaGet(meta, "couple_nombre_del_novioa1") ||
    metaGet(meta, "couple_bride_name") ||
    metaGet(meta, "couple_bride");
  const groom =
    metaGet(meta, "couple_nombre_del_novioa2") ||
    metaGet(meta, "couple_groom_name") ||
    metaGet(meta, "couple_groom");
  const brideLast = metaGet(meta, "couple_apellido_del_novioa1");
  const groomLast = metaGet(meta, "couple_apellido_del_novioa2");

  return {
    bride_name: bride,
    groom_name: groom,
    bride_lastname: brideLast,
    groom_lastname: groomLast,
    phone: metaGet(meta, "phone"),
  };
}

function formatEventDate(raw: string): string {
  // ACF often stores YYYYMMDD
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(6, 8)}/${raw.slice(4, 6)}/${raw.slice(0, 4)}`;
  }
  return raw;
}

function buildEvent(meta: MetaMap) {
  return {
    date: formatEventDate(metaGet(meta, "event_date")),
    time: metaGet(meta, "event_time"),
    place: metaGet(meta, "event_place") || metaGet(meta, "event_location"),
  };
}

function buildOptions(meta: MetaMap): Record<string, unknown> {
  return {
    show_faq: metaBool(meta, "options_show_faq") ? 1 : 0,
    show_dress_code: metaBool(meta, "options_show_dress_code") ? 1 : 0,
    password: metaGet(meta, "options_password"),
    is_online: metaBool(meta, "options_is_online") ? 1 : 0,
    free_mount: metaBool(meta, "options_free_mount") ? 1 : 0,
    hide_gifts_list: metaBool(meta, "options_hide_gifts_list") ? 1 : 0,
  };
}

function buildMisc(meta: MetaMap, wpPostId: number): Record<string, unknown> {
  const siteSource = metaGet(meta, "site_source");
  return {
    our_story: stripHtml(metaGet(meta, "misc_our_story") || metaGet(meta, "our_story")),
    spotify_url: metaGet(meta, "misc_spotify_url") || metaGet(meta, "spotify_url"),
    microsite_font:
      metaGet(meta, "microsite_font") ||
      metaGet(meta, "misc_microsite_font") ||
      "tema-default",
    site_source: siteSource,
    site_source_other: "",
    wp_post_id: wpPostId,
  };
}

function buildBanner(
  meta: MetaMap,
  attachments: Map<number, string>,
): Record<string, unknown> {
  const imageId = metaInt(meta, "banner_image") || metaInt(meta, "_thumbnail_id");
  const url = imageId ? attachments.get(imageId) : undefined;
  return {
    title: metaGet(meta, "banner_title"),
    description: metaGet(meta, "banner_description"),
    ...(url ? { image: { url, id: imageId } } : {}),
  };
}

function buildGifts(meta: MetaMap, attachments: Map<number, string>) {
  const title = metaGet(meta, "gifts_list_title") || "Lista de regalos";
  let rows = readRepeater(meta, "gifts_list_gifts", [
    "title",
    "price",
    "image",
    "quantity",
  ]);

  // Legacy key in some dumps
  if (rows.length === 0) {
    rows = readRepeater(meta, "gifts_list_presents", [
      "title",
      "price",
      "image",
      "quantity",
    ]);
  }

  const gifts = rows
    .filter((row) => row.title)
    .map((row, index) => {
      const imageId = Number(row.image || 0);
      return {
        title: row.title,
        price: Number(row.price || 0) || 0,
        quantity: Number(row.quantity || 1) || 1,
        imageUrl: imageId > 0 ? (attachments.get(imageId) ?? null) : null,
        sortOrder: index,
      };
    });

  return { title, gifts };
}

function buildPictures(meta: MetaMap, attachments: Map<number, string>) {
  const rows = readRepeater(meta, "pictures", ["image", "alt"]);
  return rows
    .map((row, index) => {
      const imageId = Number(row.image || 0);
      const url = imageId > 0 ? attachments.get(imageId) : null;
      if (!url) {
        return null;
      }
      return {
        url,
        alt: row.alt || null,
        sortOrder: index,
      };
    })
    .filter(Boolean) as Array<{ url: string; alt: string | null; sortOrder: number }>;
}

function buildSchedule(meta: MetaMap) {
  const modern = readRepeater(meta, "schedule", [
    "time",
    "title",
    "description",
    "icon",
  ]).filter((row) => row.title);

  if (modern.length > 0) {
    return modern.map((row, index) => ({
      time: row.time || "—",
      title: row.title,
      description: row.description || null,
      icon: row.icon || "anillos",
      sortOrder: index,
    }));
  }

  // Legacy fixed slots
  const legacyKeys = [
    ["schedule_ceremony", "Ceremonia"],
    ["schedule_toast", "Brindis"],
    ["schedule_dinner", "Cena"],
    ["schedule_party", "Fiesta"],
  ] as const;

  return legacyKeys
    .map(([key, title], index) => {
      const description = metaGet(meta, key);
      if (!description) {
        return null;
      }
      return {
        time: "—",
        title,
        description,
        icon: "anillos",
        sortOrder: index,
      };
    })
    .filter(Boolean) as Array<{
    time: string;
    title: string;
    description: string | null;
    icon: string;
    sortOrder: number;
  }>;
}

function buildFaq(meta: MetaMap) {
  const rows = readRepeater(meta, "faq_items", [
    "pregunta",
    "respuesta",
    "question",
    "answer",
  ]);

  return rows
    .map((row, index) => {
      const question = row.pregunta || row.question;
      const answer = stripHtml(row.respuesta || row.answer || "");
      if (!question) {
        return null;
      }
      return {
        question,
        answer: answer || question,
        sortOrder: index,
      };
    })
    .filter(Boolean) as Array<{
    question: string;
    answer: string;
    sortOrder: number;
  }>;
}

function buildGuests(meta: MetaMap) {
  const rows = readRepeater(meta, "confirmed_guests", [
    "confirmed_guest_guest_name",
    "confirmed_guest_guest_lastname",
    "confirmed_guest_menu",
    "confirmed_guest_confirm_value",
    "confirmed_guest_table_id",
    "confirmed_guest_cancelled",
  ]);

  return rows
    .map((row) => {
      const name = [row.confirmed_guest_guest_name, row.confirmed_guest_guest_lastname]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (!name) {
        return null;
      }
      const cancelled = row.confirmed_guest_cancelled === "1";
      return {
        name,
        email: null as string | null,
        status: cancelled
          ? "declined"
          : mapRsvpStatus(row.confirmed_guest_confirm_value),
        menu: mapRsvpMenu(row.confirmed_guest_menu),
        tableName: row.confirmed_guest_table_id || null,
        notes: null as string | null,
      };
    })
    .filter(Boolean) as Array<{
    name: string;
    email: string | null;
    status: string;
    menu: string;
    tableName: string | null;
    notes: string | null;
  }>;
}

function buildConfirmedGifts(
  meta: MetaMap,
  attachments: Map<number, string>,
) {
  const rows = readRepeater(meta, "confirmed_gifts", [
    "participants",
    "email",
    "phone",
    "dedication",
    "method",
    "price",
    "gifts",
    "voucher",
    "confirmed",
  ]);

  return rows
    .filter((row) => row.participants || row.email || row.price)
    .map((row) => {
      const voucherId = Number(row.voucher || 0);
      const amount = Number(String(row.price).replace(/[^\d.-]/g, "")) || 0;
      const giftTitles = row.gifts
        ? row.gifts.split(/,|\n/).map((t) => t.trim()).filter(Boolean)
        : [];

      return {
        participants: row.participants || "Invitado",
        email: row.email || null,
        phone: row.phone || null,
        dedication: row.dedication || null,
        method: row.method || "bank_transfer",
        amount,
        currency: "ARS",
        items: giftTitles.map((title) => ({ title, quantity: 1 })),
        voucherUrl:
          voucherId > 0 ? (attachments.get(voucherId) ?? null) : null,
        confirmed:
          row.confirmed === "1" ||
          row.confirmed === "true" ||
          row.confirmed === "yes",
      };
    });
}

async function loadWpUsers(
  conn: mysql.Connection,
): Promise<Map<number, WpUserRow>> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT ID, user_email, display_name, user_pass, user_registered
     FROM ${TABLE_PREFIX}users`,
  );
  const map = new Map<number, WpUserRow>();
  for (const row of rows) {
    map.set(Number(row.ID), {
      ID: Number(row.ID),
      user_email: String(row.user_email ?? "").toLowerCase().trim(),
      display_name: repairSpanishLostAccents(String(row.display_name ?? "")),
      user_pass: String(row.user_pass ?? ""),
      user_registered: new Date(row.user_registered),
    });
  }
  return map;
}

async function loadWpBodas(
  conn: mysql.Connection,
  args: CliArgs,
): Promise<WpBodaRow[]> {
  const params: Array<string | number> = [];
  let sql = `
    SELECT ID, post_title, post_name, post_author, post_date, post_modified
    FROM ${TABLE_PREFIX}posts
    WHERE post_type = 'boda' AND post_status = 'publish'
  `;

  if (args.slug) {
    sql += ` AND post_name = ?`;
    params.push(args.slug);
  }

  sql += ` ORDER BY ID ASC`;

  if (args.limit && args.limit > 0) {
    sql += ` LIMIT ?`;
    params.push(args.limit);
  }

  const [rows] = await conn.query<mysql.RowDataPacket[]>(sql, params);
  return rows.map((row) => ({
    ID: Number(row.ID),
    post_title: repairSpanishLostAccents(String(row.post_title ?? "")),
    post_name: String(row.post_name ?? ""),
    post_author: Number(row.post_author ?? 0),
    post_date: new Date(row.post_date),
    post_modified: new Date(row.post_modified),
  }));
}

async function loadMeta(
  conn: mysql.Connection,
  postId: number,
): Promise<MetaMap> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT meta_key, meta_value FROM ${TABLE_PREFIX}postmeta WHERE post_id = ?`,
    [postId],
  );
  return rowsToMeta(
    rows.map((r) => ({
      meta_key: String(r.meta_key),
      meta_value: r.meta_value == null ? null : String(r.meta_value),
    })),
  );
}

async function resolvePasswordHash(wpPass: string): Promise<{
  passwordHash: string;
  needsReset: boolean;
}> {
  const adapted = adaptWpPasswordHash(wpPass);
  if (!adapted.needsReset && adapted.passwordHash) {
    return adapted;
  }
  const random = randomBytes(24).toString("base64url");
  return {
    passwordHash: await hash(random, 10),
    needsReset: true,
  };
}

function syntheticEmail(baseEmail: string, wpPostId: number): string {
  const [local, domain] = baseEmail.split("@");
  if (!local || !domain) {
    return `boda-${wpPostId}@imported.debodas.local`;
  }
  return `${local}+boda${wpPostId}@${domain}`.toLowerCase();
}

async function upsertUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  dryRun: boolean;
}): Promise<string> {
  if (input.dryRun) {
    return `dry-user-${createHash("sha1").update(input.email).digest("hex").slice(0, 8)}`;
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, role: true },
  });

  if (existing) {
    // Don't overwrite admin role / password for seeded admin
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

async function importBoda(input: {
  boda: WpBodaRow;
  meta: MetaMap;
  user: WpUserRow | null;
  attachments: Map<number, string>;
  dryRun: boolean;
  usedEmails: Set<string>;
}): Promise<
  | { ok: true; slug: string; reset: boolean; bodaId: string | null; wpPostId: number }
  | { ok: false; error: string }
> {
  const { boda, meta, attachments, dryRun, usedEmails } = input;
  const slug = boda.post_name || `boda-${boda.ID}`;

  let email =
    input.user?.user_email ||
    metaGet(meta, "email_cliente") ||
    `boda-${boda.ID}@imported.debodas.local`;
  email = email.toLowerCase().trim();

  if (usedEmails.has(email)) {
    email = syntheticEmail(email, boda.ID);
  }
  usedEmails.add(email);

  const passSource = input.user?.user_pass ?? "";
  const { passwordHash, needsReset } = await resolvePasswordHash(passSource);

  const couple = buildCouple(meta);
  const event = buildEvent(meta);
  const options = buildOptions(meta);
  const misc = buildMisc(meta, boda.ID);
  const banner = buildBanner(meta, attachments);
  const { title: giftsListTitle, gifts } = buildGifts(meta, attachments);
  const pictures = buildPictures(meta, attachments);
  const schedule = buildSchedule(meta);
  const faqItems = buildFaq(meta);
  const guests = buildGuests(meta);
  const confirmedGifts = buildConfirmedGifts(meta, attachments);
  const plan = normalizePlan(metaGet(meta, "plan"));
  const theme = metaGet(meta, "microsite_theme") || "base";
  const isOnline = metaBool(meta, "options_is_online");
  const thumbId = metaInt(meta, "_thumbnail_id");
  const featuredImageUrl =
    (thumbId ? attachments.get(thumbId) : null) ||
    (banner.image as { url?: string } | undefined)?.url ||
    null;

  const name =
    input.user?.display_name ||
    [couple.bride_name, couple.groom_name].filter(Boolean).join(" & ") ||
    boda.post_title;

  if (dryRun) {
    console.log(
      `[dry-run] #${boda.ID} ${slug} → ${email} | plan=${plan} online=${isOnline} gifts=${gifts.length} guests=${guests.length} confirmedGifts=${confirmedGifts.length}${needsReset ? " | RESET_PWD" : ""}`,
    );
    return { ok: true, slug, reset: needsReset, bodaId: null, wpPostId: boda.ID };
  }

  const userId = await upsertUser({
    email,
    name,
    passwordHash,
    createdAt: input.user?.user_registered ?? boda.post_date,
    dryRun,
  });

  const existingBoda = await prisma.boda.findUnique({
    where: { slug },
    select: { id: true, userId: true },
  });

  // One boda per user in schema — if this user already owns another slug, synthesize email path already handled;
  // if userId is taken by another boda, move ownership carefully.
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
  }

  const bodaData: Prisma.BodaUncheckedCreateInput = {
    userId: targetUserId,
    slug,
    title: boda.post_title || slug,
    plan,
    micrositeTheme: theme,
    couple,
    event,
    banner: banner as Prisma.InputJsonObject,
    options: options as Prisma.InputJsonObject,
    misc: misc as Prisma.InputJsonObject,
    giftsListTitle,
    featuredImageUrl,
    isOnline,
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

  if (gifts.length) {
    await prisma.gift.createMany({
      data: gifts.map((g) => ({ ...g, bodaId })),
    });
  }
  if (pictures.length) {
    await prisma.picture.createMany({
      data: pictures.map((p) => ({ ...p, bodaId })),
    });
  }
  if (schedule.length) {
    await prisma.scheduleItem.createMany({
      data: schedule.map((s) => ({ ...s, bodaId })),
    });
  }
  if (faqItems.length) {
    await prisma.faqItem.createMany({
      data: faqItems.map((f) => ({ ...f, bodaId })),
    });
  }
  if (guests.length) {
    await prisma.rsvpGuest.createMany({
      data: guests.map((g) => ({ ...g, bodaId })),
    });
  }
  if (confirmedGifts.length) {
    await prisma.confirmedGift.createMany({
      data: confirmedGifts.map((g) => ({
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

  console.log(
    `[ok] #${boda.ID} ${slug} → ${email} | gifts=${gifts.length} guests=${guests.length} cgifts=${confirmedGifts.length}${needsReset ? " | RESET_PWD" : ""}`,
  );

  return { ok: true, slug, reset: needsReset, bodaId, wpPostId: boda.ID };
}

async function importRatings(
  conn: mysql.Connection,
  dryRun: boolean,
  wpToPrismaBodaId: Map<number, string>,
): Promise<number> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT ID, post_date FROM ${TABLE_PREFIX}posts WHERE post_type = 'calificacion' AND post_status = 'publish'`,
  );

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

    if (dryRun) {
      console.log(
        `[dry-run] rating wp#${postId} → boda_wp#${wpBodaId} ${email} ${score}/5`,
      );
      imported += 1;
      continue;
    }

    const bodaId = wpToPrismaBodaId.get(wpBodaId);
    if (!bodaId) {
      console.warn(`[skip] rating wp#${postId}: boda wp#${wpBodaId} no migrada`);
      continue;
    }

    await prisma.rating.upsert({
      where: {
        bodaId_email: { bodaId, email },
      },
      create: {
        bodaId,
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
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log("WP → Prisma import");
  console.log(`  source: ${WP_URL}`);
  console.log(
    `  mode: ${args.dryRun ? "DRY-RUN" : "WRITE"} | limit=${args.limit ?? "all"} | slug=${args.slug ?? "all"}`,
  );

  const conn = await mysql.createConnection(mysqlConfigFromUrl(WP_URL));
  await conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
  const users = await loadWpUsers(conn);
  const bodas = await loadWpBodas(conn, args);
  console.log(`  bodas a procesar: ${bodas.length}`);
  console.log(`  usuarios WP: ${users.size}`);

  const usedEmails = new Set<string>(["admin@debodas.local"]);
  const wpToPrismaBodaId = new Map<number, string>();
  let ok = 0;
  let fail = 0;
  let resets = 0;

  for (const boda of bodas) {
    try {
      const meta = await loadMeta(conn, boda.ID);
      const wpUserId =
        metaInt(meta, "user") || metaInt(meta, "users") || boda.post_author;
      const user = wpUserId ? (users.get(wpUserId) ?? null) : null;
      const attachmentIds = collectAttachmentIds(meta);
      const attachments = await loadAttachmentUrls(conn, attachmentIds);

      const result = await importBoda({
        boda,
        meta,
        user,
        attachments,
        dryRun: args.dryRun,
        usedEmails,
      });

      if (result.ok) {
        ok += 1;
        if (result.reset) {
          resets += 1;
        }
        if (result.bodaId) {
          wpToPrismaBodaId.set(result.wpPostId, result.bodaId);
        }
      } else {
        fail += 1;
        console.error(`[fail] #${boda.ID}: ${result.error}`);
      }
    } catch (error) {
      fail += 1;
      console.error(`[fail] #${boda.ID} ${boda.post_name}`, error);
    }
  }

  const ratings = await importRatings(conn, args.dryRun, wpToPrismaBodaId);

  await conn.end();
  await prisma.$disconnect();

  console.log("—".repeat(48));
  console.log(
    `Listo: ok=${ok} fail=${fail} ratings=${ratings} password_reset_needed≈${resets}`,
  );
  if (!args.dryRun && resets > 0) {
    console.log(
      "Algunos usuarios usan hash WP viejo ($P$): deberán usar /recuperar.",
    );
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
