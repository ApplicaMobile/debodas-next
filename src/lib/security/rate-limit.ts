import { createHmac, randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";

type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

function hashRateLimitKey(key: string): string {
  const secret =
    process.env.RATE_LIMIT_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    (process.env.NODE_ENV === "production" ? "" : "debodas-rate-limit-local");

  if (!secret) {
    throw new Error("RATE_LIMIT_SECRET o AUTH_SECRET no está configurado");
  }

  return createHmac("sha256", secret).update(key).digest("hex");
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const keyHash = hashRateLimitKey(key);
  const resetAt = new Date(now.getTime() + windowMs);

  await prisma.$executeRaw`
    INSERT INTO rate_limit_buckets
      (id, key_hash, count, reset_at, created_at, updated_at)
    VALUES
      (${randomUUID()}, ${keyHash}, 1, ${resetAt}, ${now}, ${now})
    ON DUPLICATE KEY UPDATE
      count = IF(reset_at <= ${now}, 1, count + 1),
      reset_at = IF(reset_at <= ${now}, ${resetAt}, reset_at),
      updated_at = ${now}
  `;

  const bucket = await prisma.rateLimitBucket.findUniqueOrThrow({
    where: { keyHash },
  });

  if (Math.random() < 0.01) {
    await prisma.rateLimitBucket
      .deleteMany({ where: { resetAt: { lt: now } } })
      .catch((error) => console.error("[rate-limit cleanup]", error));
  }

  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(
        1,
        Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000),
      ),
    };
  }

  return { ok: true };
}

export function clientIpFromHeaders(headers: Headers): string {
  const cloudflare = headers.get("cf-connecting-ip")?.trim();
  if (cloudflare) {
    return cloudflare;
  }
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
