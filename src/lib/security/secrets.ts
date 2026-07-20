import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function deriveKey(): Buffer {
  const secret = process.env.AUTH_SECRET ?? "debodas-dev-insecure-secret";
  return createHash("sha256").update(secret).digest();
}

/** Cifra secretos (p.ej. MP access_token). Idempotente si ya está cifrado. */
export function encryptSecret(plain: string): string {
  const value = plain.trim();
  if (!value) {
    return "";
  }
  if (value.startsWith(PREFIX)) {
    return value;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64url")}`;
}

export function decryptSecret(value: string): string {
  const raw = value.trim();
  if (!raw) {
    return "";
  }
  if (!raw.startsWith(PREFIX)) {
    return raw;
  }

  try {
    const payload = Buffer.from(raw.slice(PREFIX.length), "base64url");
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const data = payload.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8",
    );
  } catch (error) {
    console.error("[decryptSecret] failed", error);
    return "";
  }
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith(PREFIX));
}

export function maskSecret(value: string | null | undefined): string {
  if (!value?.trim()) {
    return "";
  }
  return "••••••••••••";
}
