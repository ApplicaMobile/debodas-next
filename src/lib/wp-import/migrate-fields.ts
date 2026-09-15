/**
 * Mapea campos ACF / postmeta de una boda WP al shape Prisma (misc, galería, etc.).
 */
import { isInvitationThemeSlug } from "@/lib/invitations/themes";
import type { DigitalInvitation } from "@/lib/invitations/types";
import { encryptSecret } from "@/lib/security/secrets";
import type { BodaPaymentSettings } from "@/lib/bodas/payment-settings";
import {
  metaGet,
  metaInt,
  readRepeater,
  type MetaMap,
} from "./acf";

const PUBLIC_HOST = "https://debodas.com.ar";

export function parseIdList(raw: string): number[] {
  if (!raw.trim()) {
    return [];
  }
  return raw
    .split(/[,\s]+/)
    .map((part) => Number(part))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function rewritePublicMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed
    .replace(/^http:\/\/localhost:8080/i, PUBLIC_HOST)
    .replace(/^http:\/\/localhost(?::\d+)?/i, PUBLIC_HOST)
    .replace(/^https?:\/\/127\.0\.0\.1(?::\d+)?/i, PUBLIC_HOST)
    .replace(/^http:\/\/(www\.)?debodas\.com\.ar/i, PUBLIC_HOST)
    .replace(/^http:\/\/(www\.)?test\.debodas\.com\.ar/i, "https://test.debodas.com.ar");
}

export function publicUploadsUrl(attachedFile: string, siteUrl: string): string {
  const file = attachedFile.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!file) {
    return "";
  }
  if (/^https?:\/\//i.test(file)) {
    return rewritePublicMediaUrl(file);
  }
  const base = rewritePublicMediaUrl(siteUrl || PUBLIC_HOST).replace(/\/+$/, "");
  return `${base}/wp-content/uploads/${file}`;
}

export function pickAttachmentUrl(input: {
  guid?: string;
  attachedFile?: string;
  siteUrl: string;
}): string {
  const attached = input.attachedFile?.trim() ?? "";
  if (attached) {
    return publicUploadsUrl(attached, input.siteUrl);
  }
  const guid = rewritePublicMediaUrl(input.guid ?? "");
  if (guid.includes("/wp-content/uploads/")) {
    return guid;
  }
  if (guid.startsWith("http://") || guid.startsWith("https://")) {
    return rewritePublicMediaUrl(guid);
  }
  return "";
}

export function collectGalleryAttachmentIds(meta: MetaMap): number[] {
  const ids = new Set<number>();
  const push = (raw: string) => {
    for (const id of parseIdList(raw)) {
      ids.add(id);
    }
  };

  push(metaGet(meta, "_thumbnail_id"));
  push(metaGet(meta, "extra_images"));
  push(metaGet(meta, "banner_image"));

  for (const [key, value] of meta) {
    if (key.endsWith("_image") || key.endsWith("_voucher")) {
      push(value);
    }
  }

  return [...ids];
}

export function buildPicturesFromMeta(
  meta: MetaMap,
  attachments: Map<number, string>,
): Array<{ url: string; alt: string | null; sortOrder: number }> {
  const seen = new Set<string>();
  const pictures: Array<{ url: string; alt: string | null; sortOrder: number }> = [];

  const pushUrl = (url: string, alt: string | null) => {
    const normalized = rewritePublicMediaUrl(url);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    pictures.push({ url: normalized, alt, sortOrder: pictures.length });
  };

  const rows = readRepeater(meta, "pictures", ["image", "alt", "url"]);
  for (const row of rows) {
    const imageId = Number(row.image || 0);
    const fromId = imageId > 0 ? attachments.get(imageId) : undefined;
    const fromUrl = row.url?.trim();
    const url =
      fromId ||
      (fromUrl && /^https?:\/\//i.test(fromUrl) ? fromUrl : "") ||
      (fromUrl && attachments.get(Number(fromUrl)));
    if (url) {
      pushUrl(url, row.alt || null);
    }
  }

  for (const id of parseIdList(metaGet(meta, "extra_images"))) {
    const url = attachments.get(id);
    if (url) {
      pushUrl(url, null);
    }
  }

  return pictures;
}

function asRecord(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "string" || typeof raw === "number") {
      out[key] = String(raw);
    }
  }
  return out;
}

function groupFromMeta(
  meta: MetaMap,
  prefix: string,
  fields: string[],
): Record<string, string> {
  const serialized = maybeUnserialize(meta.get(prefix) ?? "");
  const fromSerialized = asRecord(serialized) ?? {};
  const out: Record<string, string> = {};
  for (const field of fields) {
    const flat = metaGet(meta, `${prefix}_${field}`);
    const nested = fromSerialized[field]?.trim() ?? "";
    const value = flat || nested;
    if (value) {
      out[field] = value;
    }
  }
  return out;
}

export function buildPaymentSettingsFromMeta(meta: MetaMap): BodaPaymentSettings {
  const mpTokens = groupFromMeta(meta, "mp_tokens", ["public_key", "access_token"]);
  const mpAlias = groupFromMeta(meta, "mp_alias_cvu", ["owner_mp", "alias_cvu_mp"]);
  const bank = groupFromMeta(meta, "bank_account", [
    "bank",
    "cbu",
    "owner",
    "alias",
    "account_type",
    "account_number",
    "cuitcuil",
  ]);
  const bankUsd = groupFromMeta(meta, "bank_account_usd", [
    "bank",
    "cbu",
    "owner",
    "alias",
    "account_type",
    "account_number",
    "cuitcuil",
  ]);
  const paypalRaw = groupFromMeta(meta, "paypal", ["paypal_me", "owner"]);

  const settings: BodaPaymentSettings = {};

  if (mpTokens.public_key || mpTokens.access_token) {
    settings.mp_tokens = {
      public_key: mpTokens.public_key || undefined,
      access_token: mpTokens.access_token
        ? encryptSecret(mpTokens.access_token)
        : undefined,
    };
  }
  if (mpAlias.owner_mp || mpAlias.alias_cvu_mp) {
    settings.mp_alias_cvu = {
      owner_mp: mpAlias.owner_mp,
      alias_cvu_mp: mpAlias.alias_cvu_mp,
    };
  }
  if (bank.bank || bank.cbu) {
    settings.bank_account = bank;
  }
  if (bankUsd.bank || bankUsd.cbu) {
    settings.bank_account_usd = bankUsd;
  }
  if (paypalRaw.paypal_me || paypalRaw.owner) {
    settings.paypal = {
      paypal_me: paypalRaw.paypal_me,
      owner: paypalRaw.owner,
    };
  }

  return settings;
}

export function hasPaymentSettings(settings: BodaPaymentSettings): boolean {
  return Boolean(
    settings.mp_tokens?.public_key ||
      settings.mp_tokens?.access_token ||
      settings.bank_account?.cbu ||
      settings.mp_alias_cvu?.alias_cvu_mp ||
      settings.paypal?.paypal_me,
  );
}

function parseDressCodeColors(raw: string): Array<{ hex: string; name: string }> {
  const parsed = maybeUnserialize(raw);
  const list = Array.isArray(parsed) ? parsed : [];
  const colors: Array<{ hex: string; name: string }> = [];
  for (const item of list) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Record<string, unknown>;
    const hex = String(row.hex ?? "").trim();
    const name = String(row.name ?? "").trim();
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) {
      colors.push({ hex, name: name || hex });
    }
  }
  return colors;
}

export function buildDressCodeFromMeta(meta: MetaMap): {
  caballeros: string;
  damas: string;
  colors_damas: Array<{ hex: string; name: string }>;
  colors_caballeros: Array<{ hex: string; name: string }>;
} | null {
  const caballeros = metaGet(meta, "dress_code_caballeros");
  const damas = metaGet(meta, "dress_code_damas");
  const colors = parseDressCodeColors(meta.get("dress_code_colors") ?? "");
  if (!caballeros && !damas && colors.length === 0) {
    return null;
  }
  return {
    caballeros,
    damas,
    colors_damas: colors,
    colors_caballeros: [],
  };
}

function parseWpDatetime(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 16);
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(trimmed)) {
    return trimmed.replace(" ", "T").slice(0, 16);
  }
  return trimmed;
}

export function buildInvitationsFromMeta(meta: MetaMap): DigitalInvitation[] {
  const rows = readRepeater(meta, "invitations", [
    "invitation_name",
    "invitation_title",
    "invitation_description",
    "invitation_theme",
    "invitation_datetime",
    "invitation_outfit",
    "invitation_location_name",
    "invitation_location_address",
    "invitation_location_lat",
    "invitation_location_lng",
    "invitation_is_visible_in_microsite",
    "name",
    "title",
    "description",
    "theme",
    "datetime",
    "outfit",
    "location_name",
  ]);

  const items: DigitalInvitation[] = [];

  for (const [index, row] of rows.entries()) {
    const theme = row.invitation_theme || row.theme;
    if (!isInvitationThemeSlug(theme)) {
      continue;
    }
    const outfitRaw = (row.invitation_outfit || row.outfit || "formal").toLowerCase();
    const outfit =
      outfitRaw === "informal" || outfitRaw === "sport" ? outfitRaw : "formal";
    items.push({
      id: `legacy-${index}-${theme}`,
      name: row.invitation_name || row.name || "Invitación",
      title: row.invitation_title || row.title || "",
      description: row.invitation_description || row.description || "",
      theme,
      datetime: parseWpDatetime(row.invitation_datetime || row.datetime || ""),
      outfit,
      locationName:
        row.invitation_location_name || row.location_name || "",
      location: {
        address: row.invitation_location_address || "",
        lat: row.invitation_location_lat || "",
        lng: row.invitation_location_lng || "",
      },
      isVisibleInMicrosite:
        row.invitation_is_visible_in_microsite !== "0" &&
        row.invitation_is_visible_in_microsite !== "false",
      createdAt: new Date().toISOString(),
    });
  }

  return items;
}

export interface WpTarjetaPago {
  id: string;
  nombre: string;
  monto: number;
  comprobante_url: string;
  fecha: string;
}

export interface WpAbonarTarjeta {
  titulo: string;
  valor_referencia: string;
  texto_monto: string;
  pagos: WpTarjetaPago[];
}

export function buildRsvpTableLabels(meta: MetaMap): string[] {
  const rows = readRepeater(meta, "rsvp_tables", [
    "table_label",
    "table_description",
    "label",
  ]);
  return rows.map((row, index) => {
    const label = (row.table_label || row.label || "").trim();
    return label || `Mesa ${index + 1}`;
  });
}

export function resolveRsvpTableName(
  tableIdRaw: string,
  labels: string[],
): string | null {
  const raw = tableIdRaw.trim();
  if (!raw) {
    return null;
  }
  if (/^\d+$/.test(raw)) {
    const index = Number(raw);
    return labels[index] || labels[index - 1] || raw;
  }
  return raw;
}

function asTarjetaPago(value: unknown, index: number): WpTarjetaPago | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const nombre = String(row.nombre ?? row.name ?? "").trim();
  const monto = Number(String(row.monto ?? row.amount ?? "").replace(/[^\d.-]/g, ""));
  const comprobante = String(
    row.comprobante_url ?? row.comprobante ?? row.voucher ?? "",
  ).trim();
  const fecha = String(row.fecha ?? row.date ?? "").trim();
  if (!nombre && !Number.isFinite(monto) && !comprobante) {
    return null;
  }
  return {
    id: String(row.id ?? `wp-${index}`),
    nombre: nombre || "Invitado",
    monto: Number.isFinite(monto) ? monto : 0,
    comprobante_url: rewritePublicMediaUrl(comprobante),
    fecha: fecha || new Date().toISOString(),
  };
}

export function buildAbonarTarjetaFromMeta(meta: MetaMap): WpAbonarTarjeta | null {
  const titulo = metaGet(meta, "titulo_abonar_tarjeta");
  const valor = metaGet(meta, "valor_referencia_tarjeta");
  const texto = metaGet(meta, "texto_monto_tarjeta");
  const rawPagos = maybeUnserialize(meta.get("tarjeta_pagos") ?? "");
  const list = Array.isArray(rawPagos) ? rawPagos : [];
  const pagos = list
    .map((item, index) => asTarjetaPago(item, index))
    .filter((item): item is WpTarjetaPago => item !== null);

  if (!titulo && !valor && !texto && pagos.length === 0) {
    return null;
  }

  return {
    titulo,
    valor_referencia: valor,
    texto_monto: texto,
    pagos,
  };
}

export function wpAlbumHintCount(meta: MetaMap): number {
  const repeater = metaInt(meta, "pictures");
  const extra = parseIdList(metaGet(meta, "extra_images")).length;
  return Math.max(repeater, extra);
}

/**
 * JSON o serialize PHP mínimo (strings / números / arrays asociativos).
 */
export function maybeUnserialize(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through to PHP
    }
  }
  if (
    trimmed.startsWith("a:") ||
    trimmed.startsWith("s:") ||
    trimmed.startsWith("i:") ||
    trimmed.startsWith("N;")
  ) {
    try {
      const result = phpUnserialize(trimmed, 0);
      return result.value;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function phpUnserialize(
  input: string,
  offset: number,
): { value: unknown; offset: number } {
  const type = input[offset];
  if (type === "N" && input[offset + 1] === ";") {
    return { value: null, offset: offset + 2 };
  }
  if (type === "b") {
    const match = /^b:([01]);/.exec(input.slice(offset));
    if (!match) {
      throw new Error("bool");
    }
    return { value: match[1] === "1", offset: offset + match[0].length };
  }
  if (type === "i" || type === "d") {
    const match = /^(?:i|d):(-?\d+(?:\.\d+)?);/.exec(input.slice(offset));
    if (!match) {
      throw new Error("number");
    }
    return {
      value: type === "i" ? Number(match[1]) : Number(match[1]),
      offset: offset + match[0].length,
    };
  }
  if (type === "s") {
    const header = /^s:(\d+):"/.exec(input.slice(offset));
    if (!header) {
      throw new Error("string header");
    }
    const length = Number(header[1]);
    const start = offset + header[0].length;
    const str = input.slice(start, start + length);
    const end = start + length;
    if (input.slice(end, end + 2) !== '";') {
      throw new Error("string end");
    }
    return { value: str, offset: end + 2 };
  }
  if (type === "a") {
    const header = /^a:(\d+):\{/.exec(input.slice(offset));
    if (!header) {
      throw new Error("array header");
    }
    const count = Number(header[1]);
    let cursor = offset + header[0].length;
    const obj: Record<string, unknown> = {};
    const list: unknown[] = [];
    let isList = true;
    for (let i = 0; i < count; i += 1) {
      const keyRes = phpUnserialize(input, cursor);
      const valRes = phpUnserialize(input, keyRes.offset);
      cursor = valRes.offset;
      const key = String(keyRes.value);
      if (key !== String(i)) {
        isList = false;
      }
      obj[key] = valRes.value;
      list.push(valRes.value);
    }
    if (input[cursor] !== "}") {
      throw new Error("array end");
    }
    return { value: isList ? list : obj, offset: cursor + 1 };
  }
  throw new Error(`unsupported PHP type ${type}`);
}
