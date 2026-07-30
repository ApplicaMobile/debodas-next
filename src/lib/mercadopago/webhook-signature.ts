import { createHmac, timingSafeEqual } from "crypto";

export function getMercadoPagoWebhookSecret(): string | null {
  return process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() || null;
}

/**
 * Si es `true`, rechaza notificaciones sin firma válida cuando hay secret.
 * Por defecto es laxo: firma inválida → 401; sin firma → se permite
 * (IPN clásico / apps MP de cada pareja con otro secret).
 */
export function isMercadoPagoWebhookStrict(): boolean {
  return process.env.MERCADOPAGO_WEBHOOK_STRICT === "true";
}

export function parseMercadoPagoSignatureHeader(
  header: string | null,
): { ts: string; v1: string } | null {
  if (!header?.trim()) {
    return null;
  }

  const parts: Record<string, string> = {};
  for (const chunk of header.split(",")) {
    const trimmed = chunk.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && value) {
      parts[key] = value;
    }
  }

  if (!parts.ts || !parts.v1) {
    return null;
  }

  return { ts: parts.ts, v1: parts.v1 };
}

/**
 * Manifest oficial MP:
 * `id:{data.id};request-id:{x-request-id};ts:{ts};`
 * Omite pares ausentes. IDs alfanuméricos → lowercase.
 */
export function buildMercadoPagoManifest(input: {
  dataId?: string | null;
  requestId?: string | null;
  ts: string;
}): string {
  const segments: string[] = [];

  const rawId = input.dataId?.trim();
  if (rawId) {
    const id = /^[A-Za-z0-9]+$/.test(rawId) ? rawId.toLowerCase() : rawId;
    segments.push(`id:${id}`);
  }

  const requestId = input.requestId?.trim();
  if (requestId) {
    segments.push(`request-id:${requestId}`);
  }

  segments.push(`ts:${input.ts}`);
  return `${segments.join(";")};`;
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const left = Buffer.from(a, "utf8");
    const right = Buffer.from(b, "utf8");
    if (left.length !== right.length) {
      return false;
    }
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export type WebhookSignatureCheck =
  | { ok: true; mode: "verified" | "skipped_no_secret" | "skipped_unsigned" }
  | { ok: false; reason: string };

/**
 * Verifica `x-signature` según docs de Mercado Pago.
 * - Sin secret: skip (salvo prod+strict vía caller).
 * - Con secret + header: HMAC obligatorio.
 * - Con secret sin header: skip o fail según `strict`.
 */
export function verifyMercadoPagoWebhookSignature(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret?: string | null;
  strict?: boolean;
  maxSkewMs?: number;
}): WebhookSignatureCheck {
  const secret = input.secret ?? getMercadoPagoWebhookSecret();
  const strict = input.strict ?? isMercadoPagoWebhookStrict();

  if (!secret) {
    return { ok: true, mode: "skipped_no_secret" };
  }

  const parsed = parseMercadoPagoSignatureHeader(input.xSignature);
  if (!parsed) {
    if (strict) {
      return { ok: false, reason: "missing_signature" };
    }
    return { ok: true, mode: "skipped_unsigned" };
  }

  const tsNum = Number(parsed.ts);
  if (Number.isFinite(tsNum)) {
    const tsMs = tsNum < 1e12 ? tsNum * 1000 : tsNum;
    const skew = input.maxSkewMs ?? 10 * 60 * 1000;
    if (Math.abs(Date.now() - tsMs) > skew) {
      return { ok: false, reason: "timestamp_skew" };
    }
  }

  const manifest = buildMercadoPagoManifest({
    dataId: input.dataId,
    requestId: input.xRequestId,
    ts: parsed.ts,
  });

  const expected = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  if (!safeEqualHex(expected, parsed.v1)) {
    return { ok: false, reason: "invalid_signature" };
  }

  return { ok: true, mode: "verified" };
}

/** data.id desde query (preferido por MP) o body. */
export function extractMercadoPagoDataId(
  url: URL,
  body?: Record<string, unknown> | null,
): string | null {
  const fromQuery =
    url.searchParams.get("data.id") ??
    url.searchParams.get("id") ??
    null;
  if (fromQuery?.trim()) {
    return fromQuery.trim();
  }

  const data = body?.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const id = (data as { id?: unknown }).id;
    if (id !== undefined && id !== null && String(id).trim()) {
      return String(id).trim();
    }
  }

  return null;
}
