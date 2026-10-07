import { randomBytes } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { erasedEmailFor, erasedSlugFor } from "@/lib/account/status";

/**
 * Borrado definitivo pedido por la pareja ("derecho al olvido").
 *
 * Distinto de la baja lógica del admin: acá SÍ se anonimizan datos y se borran filas hijas
 * y archivos. Lo que queda es un "tombstone" mínimo:
 * - users: status=deleted, erasedAt, email/nombre/clave anonimizados, legacyWpUserId
 *   (para que la migración de WordPress no la vuelva a crear).
 * - bodas: slug `eliminada-<id>`, offline, JSON vacíos salvo `misc.wp_post_id`.
 * - payments / confirmed_gifts: montos y estados (obligación contable) sin datos personales.
 */

export interface EraseAccountDeps {
  /** Borra un archivo subido (local o Blob). Nunca debe lanzar. */
  deleteFile(url: string): Promise<void>;
  /** Borra la carpeta `public/uploads/<subdir>` (o el prefijo en Blob). Nunca debe lanzar. */
  deleteFolder(subdir: string): Promise<void>;
  now?: () => Date;
  logError?: (scope: string, error: unknown) => void;
}

export interface EraseAccountResult {
  ok: boolean;
  error?: "not_found" | "already_erased";
  bodaId?: string | null;
  filesRequested?: number;
}

const ERASED_REASON = "self_erased";

/** Medios de WordPress rehosteados: compartidos entre bodas (dedupe por sha256). Nunca se borran acá. */
export function isSharedMigratedMedia(url: string): boolean {
  return /(^|\/)uploads\/migrated\//.test(url);
}

export function isEraseableUploadUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const url = value.trim();
  if (!url || isSharedMigratedMedia(url)) return false;
  if (url.startsWith("/uploads/")) return !url.includes("..");
  return /^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(url);
}

/** Junta URLs de uploads dentro de cualquier JSON (banner, misc, options…). */
export function collectUploadUrls(value: unknown, into = new Set<string>()): Set<string> {
  if (isEraseableUploadUrl(value)) {
    into.add(value.trim());
  } else if (Array.isArray(value)) {
    for (const item of value) collectUploadUrls(item, into);
  } else if (value && typeof value === "object" && !(value instanceof Date)) {
    for (const item of Object.values(value as Record<string, unknown>)) collectUploadUrls(item, into);
  }
  return into;
}

function wpPostIdOnly(misc: unknown): Prisma.InputJsonObject {
  if (misc && typeof misc === "object" && !Array.isArray(misc)) {
    const id = Number((misc as Record<string, unknown>).wp_post_id);
    if (Number.isFinite(id) && id > 0) return { wp_post_id: id };
  }
  return {};
}

function withoutPersonalMetadata(metadata: unknown): Prisma.InputJsonObject {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  const copy: Record<string, Prisma.InputJsonValue> = {
    ...(metadata as Record<string, Prisma.InputJsonValue>),
  };
  for (const key of ["user_email", "payer_email", "email", "payer_name", "name", "phone"]) {
    delete copy[key];
  }
  return copy;
}

/** Hash imposible de verificar: no es bcrypt ni ningún formato WP, ninguna clave coincide. */
function unusablePasswordHash(): string {
  return `!erased$${randomBytes(24).toString("hex")}`;
}

export async function eraseAccount(
  db: PrismaClient,
  input: { userId: string },
  deps: EraseAccountDeps,
): Promise<EraseAccountResult> {
  const now = deps.now?.() ?? new Date();
  const log = deps.logError ?? ((scope: string, error: unknown) => console.error(scope, error));

  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, erasedAt: true },
  });
  if (!user) return { ok: false, error: "not_found" };
  if (user.erasedAt) return { ok: false, error: "already_erased" };

  const boda = await db.boda.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      slug: true,
      banner: true,
      options: true,
      misc: true,
      featuredImageUrl: true,
    },
  });

  // 1) Juntar archivos antes de vaciar las filas.
  const urls = new Set<string>();
  if (boda) {
    collectUploadUrls([boda.banner, boda.options, boda.misc, boda.featuredImageUrl], urls);
    const [pictures, gifts, confirmed] = await Promise.all([
      db.picture.findMany({ where: { bodaId: boda.id }, select: { url: true } }),
      db.gift.findMany({ where: { bodaId: boda.id }, select: { imageUrl: true } }),
      db.confirmedGift.findMany({ where: { bodaId: boda.id }, select: { voucherUrl: true } }),
    ]);
    collectUploadUrls(pictures.map((p) => p.url), urls);
    collectUploadUrls(gifts.map((g) => g.imageUrl), urls);
    collectUploadUrls(confirmed.map((c) => c.voucherUrl), urls);
  }

  const anonymizedEmail = erasedEmailFor(user.id);
  const originalEmail = user.email.trim().toLowerCase();

  // 2) Anonimizar y borrar en una transacción.
  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        status: "deleted",
        statusChangedAt: now,
        statusReason: ERASED_REASON,
        deletedAt: now,
        erasedAt: now,
        email: anonymizedEmail,
        name: null,
        passwordHash: unusablePasswordHash(),
        legacyPasswordHash: null,
        sessionVersion: { increment: 1 },
        // legacyWpUserId se conserva a propósito (tombstone para la migración WP).
      },
    });
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await tx.verificationCode.deleteMany({ where: { userId: user.id } });

    if (boda) {
      const bodaId = boda.id;
      await tx.gift.deleteMany({ where: { bodaId } });
      await tx.picture.deleteMany({ where: { bodaId } });
      await tx.scheduleItem.deleteMany({ where: { bodaId } });
      await tx.faqItem.deleteMany({ where: { bodaId } });
      await tx.rsvpGuest.deleteMany({ where: { bodaId } });
      await tx.notification.deleteMany({ where: { bodaId } });
      await tx.rating.deleteMany({ where: { bodaId } });

      await tx.confirmedGift.updateMany({
        where: { bodaId },
        data: {
          participants: "",
          email: null,
          phone: null,
          dedication: null,
          voucherUrl: null,
        },
      });

      const payments = await tx.payment.findMany({
        where: { bodaId },
        select: { id: true, metadata: true },
      });
      for (const payment of payments) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { payerEmail: null, metadata: withoutPersonalMetadata(payment.metadata) },
        });
      }

      await tx.boda.update({
        where: { id: bodaId },
        data: {
          slug: erasedSlugFor(bodaId),
          title: "Cuenta eliminada",
          isOnline: false,
          couple: {},
          event: {},
          banner: {},
          options: {},
          misc: wpPostIdOnly(boda.misc),
          giftsListTitle: null,
          featuredImageUrl: null,
        },
      });
    }

    // Emails ya enviados/encolados a esa dirección: sin destinatario ni contenido.
    await tx.emailLog.updateMany({
      where: { toAddress: originalEmail },
      data: {
        toAddress: anonymizedEmail,
        replyTo: null,
        subject: "[eliminado]",
        contentEncrypted: null,
      },
    });
    await tx.emailLog.updateMany({
      where: { replyTo: originalEmail },
      data: { replyTo: null },
    });

    await tx.adminAuditLog.create({
      data: {
        actorUserId: user.id,
        actorEmail: anonymizedEmail,
        action: "account.self_deleted",
        entity: "user",
        entityId: user.id,
        metadata: { bodaId: boda?.id ?? null, files: urls.size },
        ipHash: null,
      },
    });
  });

  // 3) Archivos (fuera de la transacción; si falla alguno, se registra y se sigue).
  for (const url of urls) {
    try {
      await deps.deleteFile(url);
    } catch (error) {
      log("[eraseAccount] deleteFile", error);
    }
  }
  if (boda?.slug) {
    try {
      await deps.deleteFolder(`bodas/${boda.slug}`);
    } catch (error) {
      log("[eraseAccount] deleteFolder", error);
    }
  }

  return { ok: true, bodaId: boda?.id ?? null, filesRequested: urls.size };
}