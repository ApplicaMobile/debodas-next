import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import type { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  isManagedUpload,
  putUploadedBuffer,
  resolveSafeLocalUploadPath,
} from "@/lib/upload/local";
import { resolveFromUploadsDir } from "@/lib/wp-import/rehost-source";
import {
  MAX_MEDIA_URL_LENGTH,
  normalizeMediaUrl,
  replaceHttpUrlsAsync,
} from "@/lib/wp-import/media-map";

/** Límite por archivo para la migración (más alto que el de uploads de usuarios). */
export const DEFAULT_REHOST_MAX_BYTES = 25 * 1024 * 1024;

export function rehostMaxBytesFromEnv(env: NodeJS.ProcessEnv = process.env): number {
  const mb = Number(env.WP_REHOST_MAX_MB);
  return Number.isFinite(mb) && mb > 0 ? Math.round(mb * 1024 * 1024) : DEFAULT_REHOST_MAX_BYTES;
}

type MediaKind = { ext: string; contentType: string };

const KIND_BY_EXT: Record<string, MediaKind> = {
  jpg: { ext: "jpg", contentType: "image/jpeg" },
  jpeg: { ext: "jpg", contentType: "image/jpeg" },
  png: { ext: "png", contentType: "image/png" },
  webp: { ext: "webp", contentType: "image/webp" },
  gif: { ext: "gif", contentType: "image/gif" },
  pdf: { ext: "pdf", contentType: "application/pdf" },
  heic: { ext: "heic", contentType: "image/heic" },
  heif: { ext: "heic", contentType: "image/heif" },
};

const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"]);

/** Detecta el tipo real por los primeros bytes; si no, por la extensión de la URL. */
export function sniffMediaKind(buffer: Buffer, url: string): MediaKind {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return KIND_BY_EXT.jpg;
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return KIND_BY_EXT.png;
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return KIND_BY_EXT.webp;
  const gif = buffer.subarray(0, 6).toString("ascii");
  if (gif === "GIF87a" || gif === "GIF89a") return KIND_BY_EXT.gif;
  if (buffer.subarray(0, 5).toString("ascii") === "%PDF-") return KIND_BY_EXT.pdf;
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp" && HEIC_BRANDS.has(buffer.subarray(8, 12).toString("ascii"))) {
    return KIND_BY_EXT.heic;
  }
  const ext = normalizeMediaUrl(url).split(".").pop()?.toLowerCase() ?? "";
  return KIND_BY_EXT[ext] ?? { ext: "bin", contentType: "application/octet-stream" };
}

export function shouldRehostUrl(
  url: string | null | undefined,
  hosts: string[],
): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim();
  if (isManagedUpload(trimmed)) return false;
  if (trimmed.startsWith("/")) return false;
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    if (hosts.length === 0) return true;
    return hosts.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    );
  } catch {
    return false;
  }
}

type SharpLike = (input: Buffer) => { rotate(): { jpeg(o: { quality: number }): { toBuffer(): Promise<Buffer> } } };

/** `sharp` no es dependencia directa del repo: se carga solo si está instalado. */
export async function loadOptionalSharp(): Promise<SharpLike | null> {
  try {
    const moduleName = "sharp";
    const mod = (await import(/* webpackIgnore: true */ moduleName)) as { default?: SharpLike } & SharpLike;
    return (mod.default ?? mod) as SharpLike;
  } catch {
    return null;
  }
}

export type StoreFn = (input: {
  buffer: Buffer;
  subdir: string;
  filename: string;
  contentType: string;
}) => Promise<string>;

/** Caché compartida entre bodas de una misma corrida (dedupe en memoria). */
export interface RehostSession {
  byUrl: Map<string, string>;
  sharp?: SharpLike | null;
}

export function createRehostSession(): RehostSession {
  return { byUrl: new Map() };
}

export interface RehostOptions {
  dryRun?: boolean;
  hosts?: string[];
  fromUploadsDir?: string | null;
  client?: PrismaClient;
  /** Tamaño máximo por archivo (por defecto 25 MB o WP_REHOST_MAX_MB). */
  maxBytes?: number;
  /** Convertir HEIC a JPG con sharp si está disponible (por defecto true). */
  convertHeic?: boolean;
  session?: RehostSession;
  /** Inyectables para tests. */
  store?: StoreFn;
  fetchImpl?: typeof fetch;
  sharpLoader?: () => Promise<SharpLike | null>;
  /** ¿Sigue existiendo el archivo ya copiado? (por defecto mira el disco para /uploads/…). */
  fileExists?: (newPath: string) => boolean;
}

export interface RehostResult {
  updated: number;
  failed: number;
  uploaded: number;
  reused: number;
  heicConverted: number;
  heicUnconverted: number;
  errors: Array<{ url: string; error: string }>;
}

const DEFAULT_HOSTS = ["debodas.com.ar", "test.debodas.com.ar"];

function storedFileExists(newPath: string): boolean {
  if (newPath.startsWith("/uploads/")) {
    const abs = resolveSafeLocalUploadPath(newPath);
    return Boolean(abs && existsSync(abs));
  }
  return true; // Blob / URL absoluta: asumimos que sigue ahí.
}

async function fetchRemote(
  url: string,
  maxBytes: number,
  fetchImpl: typeof fetch,
): Promise<Buffer> {
  const res = await fetchImpl(url, {
    headers: { "User-Agent": "DeBodas-rehost/1.0" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > maxBytes) {
    throw new Error(`Archivo de ${declared} bytes supera el límite de ${maxBytes}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > maxBytes) {
    throw new Error(`Archivo de ${buffer.length} bytes supera el límite de ${maxBytes}`);
  }
  return buffer;
}

/**
 * Copia los medios de WordPress de una boda a `public/uploads/migrated/media/…`
 * (o Vercel Blob) y reescribe las URLs en Prisma. Re-ejecutable:
 * - `legacy_media.original_url` evita volver a bajar lo ya copiado;
 * - el nombre es el sha256 del contenido, así una misma imagen se guarda una sola vez.
 * Cubre imagen destacada, banner, regalos, galería, comprobantes y, dentro de
 * `misc`, tarjeta_pagos, invitations y dress_code (cualquier URL de wp-content/uploads).
 */
export async function rehostBodaImages(
  bodaId: string,
  options: RehostOptions = {},
): Promise<RehostResult> {
  const db = options.client ?? prisma;
  const hosts = options.hosts ?? DEFAULT_HOSTS;
  const dryRun = Boolean(options.dryRun);
  const fromUploadsDir = options.fromUploadsDir ?? null;
  const maxBytes = options.maxBytes ?? rehostMaxBytesFromEnv();
  const convertHeic = options.convertHeic !== false;
  const session = options.session ?? createRehostSession();
  const store = options.store ?? putUploadedBuffer;
  const fetchImpl = options.fetchImpl ?? fetch;
  const fileExists = options.fileExists ?? storedFileExists;
  const result: RehostResult = {
    updated: 0,
    failed: 0,
    uploaded: 0,
    reused: 0,
    heicConverted: 0,
    heicUnconverted: 0,
    errors: [],
  };

  async function getSharp(): Promise<SharpLike | null> {
    if (session.sharp === undefined) {
      session.sharp = await (options.sharpLoader ?? loadOptionalSharp)();
    }
    return session.sharp;
  }

  async function resolveUrl(source: string, wpAttachmentId?: number | null): Promise<string | null> {
    const key = normalizeMediaUrl(source);
    const cached = session.byUrl.get(key);
    if (cached) return dryRun ? null : cached;
    try {
      const indexable = key.length <= MAX_MEDIA_URL_LENGTH;
      if (indexable) {
        const known = await db.legacyMedia.findUnique({ where: { originalUrl: key } });
        if (known && fileExists(known.newPath)) {
          session.byUrl.set(key, known.newPath);
          result.reused += 1;
          return dryRun ? null : known.newPath;
        }
      }

      const localPath = fromUploadsDir ? resolveFromUploadsDir(source, fromUploadsDir) : null;
      let buffer: Buffer;
      if (localPath) {
        buffer = readFileSync(localPath);
        if (buffer.length > maxBytes) {
          throw new Error(`Archivo de ${buffer.length} bytes supera el límite de ${maxBytes}`);
        }
      } else {
        buffer = await fetchRemote(source, maxBytes, fetchImpl);
      }
      if (buffer.length === 0) throw new Error("Archivo vacío");

      let kind = sniffMediaKind(buffer, source);
      if (kind.ext === "heic") {
        const sharp = convertHeic ? await getSharp() : null;
        let converted: Buffer | null = null;
        let why = "sharp no disponible";
        if (sharp) {
          try {
            converted = await sharp(buffer).rotate().jpeg({ quality: 85 }).toBuffer();
          } catch (error) {
            // Los binarios precompilados de sharp suelen no traer el decoder HEVC de iPhone.
            why = `sharp no pudo decodificarlo (${error instanceof Error ? error.message : String(error)})`;
          }
        }
        if (converted) {
          buffer = converted;
          kind = KIND_BY_EXT.jpg;
          result.heicConverted += 1;
        } else {
          result.heicUnconverted += 1;
          result.errors.push({ url: source, error: `HEIC sin convertir (${why}): se copió tal cual` });
        }
      }

      const sha256 = createHash("sha256").update(buffer).digest("hex");
      let newPath: string | null = null;
      const sameContent = await db.legacyMedia.findFirst({ where: { sha256 }, select: { newPath: true } });
      if (sameContent && fileExists(sameContent.newPath)) {
        newPath = sameContent.newPath;
        result.reused += 1;
      } else if (dryRun) {
        newPath = `/uploads/migrated/media/${sha256.slice(0, 2)}/${sha256}.${kind.ext}`;
        result.uploaded += 1;
      } else {
        newPath = await store({
          buffer,
          subdir: `migrated/media/${sha256.slice(0, 2)}`,
          filename: `${sha256}.${kind.ext}`,
          contentType: kind.contentType,
        });
        result.uploaded += 1;
      }

      if (!dryRun && indexable) {
        const data = {
          sha256,
          newPath,
          bytes: buffer.length,
          contentType: kind.contentType,
          ...(wpAttachmentId ? { wpAttachmentId } : {}),
        };
        await db.legacyMedia.upsert({
          where: { originalUrl: key },
          create: { originalUrl: key, ...data },
          update: data,
        });
      } else if (!indexable) {
        result.errors.push({ url: source.slice(0, 120), error: "URL demasiado larga para legacy_media (no se registra)" });
      }
      session.byUrl.set(key, newPath);
      return dryRun ? null : newPath;
    } catch (error) {
      result.failed += 1;
      result.errors.push({ url: source, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /** Para JSON: solo URLs de wp-content/uploads en hosts permitidos. */
  async function resolveJsonUrl(url: string): Promise<string | null> {
    if (!url.includes("/wp-content/uploads/") || !shouldRehostUrl(url, hosts)) return null;
    return resolveUrl(url);
  }

  const boda = await db.boda.findUnique({
    where: { id: bodaId },
    select: { id: true, featuredImageUrl: true, banner: true, misc: true, updatedAt: true },
  });
  if (!boda) {
    return { ...result, failed: 1, errors: [{ url: "", error: `No existe la boda ${bodaId}` }] };
  }

  // ---- Boda: destacada, banner y misc (invitaciones, dress code, comprobantes) ----
  const bannerRaw = (boda.banner ?? {}) as Record<string, unknown>;
  const bannerImage = bannerRaw.image as { url?: string; id?: string | number } | undefined;
  const bannerImageId = Number(bannerImage?.id ?? 0) || null;
  if (bannerImage?.url && shouldRehostUrl(bannerImage.url, hosts)) {
    await resolveUrl(bannerImage.url, bannerImageId); // registra el attachment id
  }
  // Después del banner, así el attachment id del banner queda registrado.
  let featured = boda.featuredImageUrl;
  if (shouldRehostUrl(featured, hosts)) {
    const next = await resolveUrl(featured!);
    if (next) featured = next;
  }
  const banner = await replaceHttpUrlsAsync(bannerRaw, async (url) =>
    shouldRehostUrl(url, hosts) && url.includes("/wp-content/") ? resolveUrl(url) : null,
  );
  const miscRaw =
    boda.misc && typeof boda.misc === "object" && !Array.isArray(boda.misc)
      ? (boda.misc as Record<string, unknown>)
      : {};
  const misc = await replaceHttpUrlsAsync(miscRaw, resolveJsonUrl);

  const bodaDirty =
    featured !== boda.featuredImageUrl ||
    JSON.stringify(banner) !== JSON.stringify(bannerRaw) ||
    JSON.stringify(misc) !== JSON.stringify(miscRaw);
  if (bodaDirty && !dryRun) {
    await db.boda.update({
      where: { id: boda.id },
      data: {
        featuredImageUrl: featured,
        banner: banner as Prisma.InputJsonValue,
        misc: misc as Prisma.InputJsonValue,
        // El rehost no es una edición de la pareja: conservamos updatedAt (modo --changed).
        updatedAt: boda.updatedAt,
      },
    });
    result.updated += 1;
  }

  const gifts = await db.gift.findMany({ where: { bodaId }, select: { id: true, imageUrl: true, updatedAt: true } });
  for (const gift of gifts) {
    if (!shouldRehostUrl(gift.imageUrl, hosts)) continue;
    const next = await resolveUrl(gift.imageUrl!);
    if (next && next !== gift.imageUrl) {
      await db.gift.update({ where: { id: gift.id }, data: { imageUrl: next, updatedAt: gift.updatedAt } });
      result.updated += 1;
    }
  }

  const pictures = await db.picture.findMany({ where: { bodaId }, select: { id: true, url: true } });
  for (const picture of pictures) {
    if (!shouldRehostUrl(picture.url, hosts)) continue;
    const next = await resolveUrl(picture.url);
    if (next && next !== picture.url) {
      await db.picture.update({ where: { id: picture.id }, data: { url: next } });
      result.updated += 1;
    }
  }

  const vouchers = await db.confirmedGift.findMany({
    where: { bodaId },
    select: { id: true, voucherUrl: true, updatedAt: true },
  });
  for (const voucher of vouchers) {
    if (!shouldRehostUrl(voucher.voucherUrl, hosts)) continue;
    const next = await resolveUrl(voucher.voucherUrl!);
    if (next && next !== voucher.voucherUrl) {
      await db.confirmedGift.update({ where: { id: voucher.id }, data: { voucherUrl: next, updatedAt: voucher.updatedAt } });
      result.updated += 1;
    }
  }

  return result;
}
