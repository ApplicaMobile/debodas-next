import { createHash, randomBytes } from "crypto";

const ITOA64 =
  "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function encode64(input: Buffer, count: number): string {
  let output = "";
  let i = 0;
  do {
    let value = input[i++];
    output += ITOA64[value & 0x3f];
    if (i < count) {
      value |= input[i] << 8;
    }
    output += ITOA64[(value >> 6) & 0x3f];
    if (i++ >= count) {
      break;
    }
    if (i < count) {
      value |= input[i] << 16;
    }
    output += ITOA64[(value >> 12) & 0x3f];
    if (i++ >= count) {
      break;
    }
    output += ITOA64[(value >> 18) & 0x3f];
  } while (i < count);
  return output;
}

function md5Binary(data: Buffer): Buffer {
  return createHash("md5").update(data).digest();
}

/** Verifica hashes portables WordPress `$P$` / `$H$` (phpass). */
export function verifyPhpass(password: string, storedHash: string): boolean {
  const hash = storedHash.trim();
  if (!hash.startsWith("$P$") && !hash.startsWith("$H$")) {
    return false;
  }
  if (hash.length !== 34) {
    return false;
  }
  const countLog2 = ITOA64.indexOf(hash[3] ?? "");
  if (countLog2 < 7 || countLog2 > 30) {
    return false;
  }
  const count = 1 << countLog2;
  const salt = hash.slice(4, 12);
  if (salt.length !== 8) {
    return false;
  }

  let checksum = md5Binary(Buffer.concat([Buffer.from(salt), Buffer.from(password)]));
  for (let i = 0; i < count; i += 1) {
    checksum = md5Binary(Buffer.concat([checksum, Buffer.from(password)]));
  }
  const encoded = hash.slice(0, 12) + encode64(checksum, 16);
  return encoded === hash;
}

export function isPhpassHash(hash: string): boolean {
  const trimmed = hash.trim();
  return trimmed.startsWith("$P$") || trimmed.startsWith("$H$");
}

/** Hash portable `$P$` (phpass), para tests y verificación round-trip. */
export function hashPhpass(password: string, countLog2 = 8): string {
  if (countLog2 < 7 || countLog2 > 30) {
    throw new Error("countLog2 inválido");
  }
  let salt = "";
  const raw = randomBytes(8);
  for (let i = 0; i < 8; i += 1) {
    salt += ITOA64[raw[i]! % 64];
  }
  const count = 1 << countLog2;
  let checksum = md5Binary(
    Buffer.concat([Buffer.from(salt), Buffer.from(password)]),
  );
  for (let i = 0; i < count; i += 1) {
    checksum = md5Binary(Buffer.concat([checksum, Buffer.from(password)]));
  }
  return `$P$${ITOA64[countLog2]}${salt}${encode64(checksum, 16)}`;
}
