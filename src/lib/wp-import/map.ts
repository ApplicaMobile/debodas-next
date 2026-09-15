import { createHash, randomBytes } from "crypto";
import { hash } from "bcryptjs";
import type mysql from "mysql2/promise";
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
} from "@/lib/wp-import/acf";
import {
  buildAbonarTarjetaFromMeta,
  buildDressCodeFromMeta,
  buildInvitationsFromMeta,
  buildPaymentSettingsFromMeta,
  buildPicturesFromMeta,
  buildRsvpTableLabels,
  collectGalleryAttachmentIds,
  hasPaymentSettings,
  pickAttachmentUrl,
  resolveRsvpTableName,
  rewritePublicMediaUrl,
  wpAlbumHintCount,
} from "@/lib/wp-import/migrate-fields";
import { wpTablePrefix } from "@/lib/wp-import/connection";
import type { WpBodaRow, WpImportWarning, WpUserRow } from "@/lib/wp-import/types";
import type { BodaPaymentSettings } from "@/lib/bodas/payment-settings";

export async function loadWpSiteUrl(conn: mysql.Connection): Promise<string> {
  const prefix = wpTablePrefix();
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT option_value FROM ${prefix}options
     WHERE option_name IN ('siteurl', 'home')
     ORDER BY FIELD(option_name, 'siteurl', 'home')
     LIMIT 2`,
  );
  const raw = String(rows[0]?.option_value ?? "").trim();
  const rewritten = rewritePublicMediaUrl(raw).replace(/\/+$/, "");
  return rewritten || "https://debodas.com.ar";
}

export async function loadAttachmentUrls(
  conn: mysql.Connection,
  ids: number[],
  siteUrl: string,
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  const unique = [...new Set(ids.filter((id) => id > 0))];
  if (unique.length === 0) {
    return map;
  }
  const prefix = wpTablePrefix();
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT p.ID, p.guid, pm.meta_value AS attached_file
     FROM ${prefix}posts p
     LEFT JOIN ${prefix}postmeta pm
       ON pm.post_id = p.ID AND pm.meta_key = '_wp_attached_file'
     WHERE p.ID IN (?) AND p.post_type = 'attachment'`,
    [unique],
  );
  for (const row of rows) {
    const url = pickAttachmentUrl({
      guid: String(row.guid ?? ""),
      attachedFile: String(row.attached_file ?? ""),
      siteUrl,
    });
    if (url) {
      map.set(Number(row.ID), url);
    }
  }
  return map;
}

export async function loadWpUsers(
  conn: mysql.Connection,
): Promise<Map<number, WpUserRow>> {
  const prefix = wpTablePrefix();
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT ID, user_email, display_name, user_pass, user_registered
     FROM ${prefix}users`,
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

export async function findWpUserByEmail(
  conn: mysql.Connection,
  email: string,
): Promise<WpUserRow | null> {
  const prefix = wpTablePrefix();
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT ID, user_email, display_name, user_pass, user_registered
     FROM ${prefix}users WHERE user_email = ? LIMIT 1`,
    [email],
  );
  const row = rows[0];
  if (!row) {
    return null;
  }
  return {
    ID: Number(row.ID),
    user_email: String(row.user_email ?? "").toLowerCase().trim(),
    display_name: repairSpanishLostAccents(String(row.display_name ?? "")),
    user_pass: String(row.user_pass ?? ""),
    user_registered: new Date(row.user_registered),
  };
}

export async function loadWpBodas(
  conn: mysql.Connection,
  filter?: { slug?: string | null; wpPostId?: number | null; limit?: number | null },
): Promise<WpBodaRow[]> {
  const prefix = wpTablePrefix();
  const params: Array<string | number> = [];
  let sql = `
    SELECT ID, post_title, post_name, post_author, post_date, post_modified
    FROM ${prefix}posts
    WHERE post_type = 'boda' AND post_status IN ('publish', 'draft', 'private')
  `;
  if (filter?.slug) {
    sql += ` AND post_name = ?`;
    params.push(filter.slug);
  }
  if (filter?.wpPostId) {
    sql += ` AND ID = ?`;
    params.push(filter.wpPostId);
  }
  sql += ` ORDER BY ID ASC`;
  if (filter?.limit && filter.limit > 0) {
    sql += ` LIMIT ?`;
    params.push(filter.limit);
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

export async function loadWpBodasForUser(
  conn: mysql.Connection,
  wpUser: WpUserRow,
): Promise<WpBodaRow[]> {
  const prefix = wpTablePrefix();
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT p.ID, p.post_title, p.post_name, p.post_author, p.post_date, p.post_modified
     FROM ${prefix}posts p
     LEFT JOIN ${prefix}postmeta um ON um.post_id = p.ID AND um.meta_key = 'user'
     WHERE p.post_type = 'boda'
       AND p.post_status IN ('publish', 'draft', 'private')
       AND (p.post_author = ? OR um.meta_value = ?)
     ORDER BY p.ID ASC`,
    [wpUser.ID, String(wpUser.ID)],
  );
  return rows.map((row) => ({
    ID: Number(row.ID),
    post_title: repairSpanishLostAccents(String(row.post_title ?? "")),
    post_name: String(row.post_name ?? ""),
    post_author: Number(row.post_author ?? 0),
    post_date: new Date(row.post_date),
    post_modified: new Date(row.post_modified),
  }));
}

export async function loadMeta(
  conn: mysql.Connection,
  postId: number,
): Promise<MetaMap> {
  const prefix = wpTablePrefix();
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT meta_key, meta_value FROM ${prefix}postmeta WHERE post_id = ?`,
    [postId],
  );
  return rowsToMeta(
    rows.map((r) => ({
      meta_key: String(r.meta_key),
      meta_value: r.meta_value == null ? null : String(r.meta_value),
    })),
  );
}

export function buildCouple(meta: MetaMap) {
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
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(6, 8)}/${raw.slice(4, 6)}/${raw.slice(0, 4)}`;
  }
  return raw;
}

export function buildEvent(meta: MetaMap) {
  return {
    date: formatEventDate(metaGet(meta, "event_date")),
    time: metaGet(meta, "event_time"),
    place: metaGet(meta, "event_place") || metaGet(meta, "event_location"),
  };
}

export function buildOptions(meta: MetaMap): Record<string, unknown> {
  const showDress =
    metaBool(meta, "options_show_dress_code") || metaBool(meta, "dress_code_show");
  return {
    show_faq: metaBool(meta, "options_show_faq") ? 1 : 0,
    show_dress_code: showDress ? 1 : 0,
    password: metaGet(meta, "options_password"),
    is_online: metaBool(meta, "options_is_online") ? 1 : 0,
    free_mount: metaBool(meta, "options_free_mount") ? 1 : 0,
    hide_gifts_list: metaBool(meta, "options_hide_gifts_list") ? 1 : 0,
  };
}

export function buildMisc(meta: MetaMap, wpPostId: number): Record<string, unknown> {
  const siteSource = metaGet(meta, "site_source");
  const paymentSettings = buildPaymentSettingsFromMeta(meta);
  const dressCode = buildDressCodeFromMeta(meta);
  const invitations = buildInvitationsFromMeta(meta);
  const canva = metaGet(meta, "canva_invitation_url");
  const abonar = buildAbonarTarjetaFromMeta(meta);

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
    ...(hasPaymentSettings(paymentSettings)
      ? { payment_settings: paymentSettings }
      : {}),
    ...(dressCode ? { dress_code: dressCode } : {}),
    ...(invitations.length ? { invitations } : {}),
    ...(canva ? { canva_invitation_url: canva, canvaInvitationUrl: canva } : {}),
    ...(abonar
      ? {
          abonar_tarjeta: {
            titulo: abonar.titulo,
            valor_referencia: abonar.valor_referencia,
            texto_monto: abonar.texto_monto,
          },
          tarjeta_pagos: abonar.pagos,
        }
      : {}),
  };
}

export function buildBanner(meta: MetaMap, attachments: Map<number, string>) {
  const imageId = metaInt(meta, "banner_image") || metaInt(meta, "_thumbnail_id");
  const url = imageId ? attachments.get(imageId) : undefined;
  return {
    title: metaGet(meta, "banner_title"),
    description: metaGet(meta, "banner_description"),
    ...(url ? { image: { url, id: imageId } } : {}),
  };
}

export function buildGifts(meta: MetaMap, attachments: Map<number, string>) {
  const title = metaGet(meta, "gifts_list_title") || "Lista de regalos";
  let rows = readRepeater(meta, "gifts_list_gifts", [
    "title",
    "price",
    "image",
    "quantity",
  ]);
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

export function buildSchedule(meta: MetaMap) {
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

export function buildFaq(meta: MetaMap) {
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

export function buildGuests(meta: MetaMap) {
  const tableLabels = buildRsvpTableLabels(meta);
  const rows = readRepeater(meta, "confirmed_guests", [
    "confirmed_guest_guest_name",
    "confirmed_guest_guest_lastname",
    "confirmed_guest_menu",
    "confirmed_guest_confirm_value",
    "confirmed_guest_table_id",
    "confirmed_guest_cancelled",
    "confirmed_guest_email",
    "confirmed_guest_guest_email",
    "guest_name",
    "guest_lastname",
    "email",
  ]);

  return rows
    .map((row) => {
      const name = [
        row.confirmed_guest_guest_name || row.guest_name,
        row.confirmed_guest_guest_lastname || row.guest_lastname,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (!name) {
        return null;
      }
      const cancelled = row.confirmed_guest_cancelled === "1";
      const email = (
        row.confirmed_guest_email ||
        row.confirmed_guest_guest_email ||
        row.email ||
        ""
      )
        .toLowerCase()
        .trim();
      return {
        name,
        email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
        status: cancelled
          ? "declined"
          : mapRsvpStatus(row.confirmed_guest_confirm_value),
        menu: mapRsvpMenu(row.confirmed_guest_menu),
        tableName: resolveRsvpTableName(row.confirmed_guest_table_id, tableLabels),
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

export function buildConfirmedGifts(
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
        voucherUrl: voucherId > 0 ? (attachments.get(voucherId) ?? null) : null,
        confirmed:
          row.confirmed === "1" ||
          row.confirmed === "true" ||
          row.confirmed === "yes",
      };
    });
}

export async function resolvePasswordHash(wpPass: string): Promise<{
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

export function syntheticEmail(baseEmail: string, wpPostId: number): string {
  const [local, domain] = baseEmail.split("@");
  if (!local || !domain) {
    return `boda-${wpPostId}@imported.debodas.local`;
  }
  return `${local}+boda${wpPostId}@${domain}`.toLowerCase();
}

export function dryRunHash(email: string): string {
  return `dry-user-${createHash("sha1").update(email).digest("hex").slice(0, 8)}`;
}

export function coupleLabelFromMeta(meta: MetaMap, fallback: string): string {
  const couple = buildCouple(meta);
  const label = [couple.bride_name, couple.groom_name].filter(Boolean).join(" & ");
  return label || fallback;
}

export function collectWarnings(input: {
  albumHint: number;
  pictures: number;
  needsReset: boolean;
  guests: Array<{ tableName: string | null }>;
}): WpImportWarning[] {
  const warnings: WpImportWarning[] = [];
  if (input.albumHint > 0 && input.pictures === 0) {
    warnings.push({
      code: "GALLERY_EMPTY",
      message: `WP tenía ≈${input.albumHint} fotos pero no se resolvieron URLs.`,
    });
  }
  if (input.needsReset) {
    warnings.push({
      code: "RESET_PWD",
      message: "Hash WP $P$: el usuario deberá usar /recuperar o entrar una vez con su clave.",
    });
  }
  return warnings;
}

export function mappedBodaPayload(
  boda: WpBodaRow,
  meta: MetaMap,
  attachments: Map<number, string>,
) {
  const couple = buildCouple(meta);
  const event = buildEvent(meta);
  const options = buildOptions(meta);
  const misc = buildMisc(meta, boda.ID);
  const banner = buildBanner(meta, attachments);
  const { title: giftsListTitle, gifts } = buildGifts(meta, attachments);
  const pictures = buildPicturesFromMeta(meta, attachments);
  const schedule = buildSchedule(meta);
  const faqItems = buildFaq(meta);
  const guests = buildGuests(meta);
  const confirmedGifts = buildConfirmedGifts(meta, attachments);
  const paymentSettings = (misc.payment_settings ?? {}) as BodaPaymentSettings;
  const invitations = Array.isArray(misc.invitations) ? misc.invitations : [];
  const abonar = misc.abonar_tarjeta as { titulo?: string } | undefined;
  const pagos = Array.isArray(misc.tarjeta_pagos) ? misc.tarjeta_pagos : [];
  const albumHint = wpAlbumHintCount(meta);
  const plan = normalizePlan(metaGet(meta, "plan"));
  const theme = metaGet(meta, "microsite_theme") || "base";
  const isOnline = metaBool(meta, "options_is_online");
  const thumbId = metaInt(meta, "_thumbnail_id");
  const featuredImageUrl =
    (thumbId ? attachments.get(thumbId) : null) ||
    (banner.image as { url?: string } | undefined)?.url ||
    null;

  return {
    couple,
    event,
    options,
    misc,
    banner,
    giftsListTitle,
    gifts,
    pictures,
    schedule,
    faqItems,
    guests,
    confirmedGifts,
    paymentSettings,
    invitations,
    albumHint,
    plan,
    theme,
    isOnline,
    featuredImageUrl,
    hasAbonar: Boolean(abonar?.titulo || pagos.length),
    abonarPagos: pagos.length,
  };
}
