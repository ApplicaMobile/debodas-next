import { createHash } from "crypto";
import { readFileSync } from "fs";
import { PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  isManagedUpload,
  putUploadedBuffer,
} from "@/lib/upload/local";
import { resolveFromUploadsDir } from "@/lib/wp-import/rehost-source";

type BannerJson = {
  image?: { url?: string; id?: string | number };
  [key: string]: unknown;
};

function extFromContentType(contentType: string, url: string): string {
  const mime = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "application/pdf") return "pdf";
  const fromUrl = url.split("?")[0]?.split(".").pop()?.toLowerCase();
  if (fromUrl && ["jpg", "jpeg", "png", "webp", "gif", "pdf"].includes(fromUrl)) {
    return fromUrl === "jpeg" ? "jpg" : fromUrl;
  }
  return "bin";
}

function contentTypeFromExt(ext: string): string {
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "pdf") return "application/pdf";
  return "application/octet-stream";
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

async function fetchRemote(
  url: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "DeBodas-rehost/1.0" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} al bajar ${url}`);
  }
  const contentType =
    res.headers.get("content-type")?.split(";")[0]?.trim() ||
    contentTypeFromExt(extFromContentType("", url));
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error(`Archivo vacío: ${url}`);
  }
  if (buffer.length > 8 * 1024 * 1024) {
    throw new Error(`Archivo > 8MB: ${url}`);
  }
  return { buffer, contentType };
}

export interface RehostOptions {
  dryRun?: boolean;
  hosts?: string[];
  fromUploadsDir?: string | null;
  client?: PrismaClient;
}

const DEFAULT_HOSTS = ["debodas.com.ar", "test.debodas.com.ar"];

export async function rehostBodaImages(
  bodaId: string,
  options: RehostOptions = {},
): Promise<{ updated: number; failed: number }> {
  const db = options.client ?? prisma;
  const hosts = options.hosts ?? DEFAULT_HOSTS;
  const dryRun = Boolean(options.dryRun);
  const fromUploadsDir = options.fromUploadsDir ?? null;
  const cache = new Map<string, string>();
  let updated = 0;
  let failed = 0;

  async function resolveUrl(source: string): Promise<string | null> {
    const cached = cache.get(source);
    if (cached) return cached;
    try {
      let buffer: Buffer;
      let contentType: string;
      const localPath = fromUploadsDir
        ? resolveFromUploadsDir(source, fromUploadsDir)
        : null;
      if (localPath) {
        buffer = readFileSync(localPath);
        contentType = contentTypeFromExt(extFromContentType("", source));
      } else {
        const remote = await fetchRemote(source);
        buffer = remote.buffer;
        contentType = remote.contentType;
      }
      const ext = extFromContentType(contentType, source);
      const hash = createHash("sha1").update(source).digest("hex").slice(0, 16);
      const filename = `${hash}.${ext}`;
      if (dryRun) {
        cache.set(source, source);
        return source;
      }
      const nextUrl = await putUploadedBuffer({
        buffer,
        subdir: `migrated/${bodaId}`,
        filename,
        contentType: contentTypeFromExt(ext),
      });
      cache.set(source, nextUrl);
      return nextUrl;
    } catch {
      failed += 1;
      return null;
    }
  }

  const boda = await db.boda.findUnique({
    where: { id: bodaId },
    select: { id: true, featuredImageUrl: true, banner: true },
  });
  if (!boda) {
    return { updated: 0, failed: 1 };
  }

  let featured = boda.featuredImageUrl;
  let banner = (boda.banner ?? {}) as BannerJson;
  let dirty = false;

  if (shouldRehostUrl(featured, hosts)) {
    const next = await resolveUrl(featured!);
    if (next && next !== featured && !dryRun) {
      featured = next;
      dirty = true;
    }
  }

  const bannerUrl = banner.image?.url;
  if (shouldRehostUrl(bannerUrl, hosts)) {
    const next = await resolveUrl(bannerUrl!);
    if (next && next !== bannerUrl && !dryRun) {
      banner = { ...banner, image: { ...(banner.image ?? {}), url: next } };
      dirty = true;
      if (featured === bannerUrl) {
        featured = next;
      }
    }
  }

  if (dirty && !dryRun) {
    await db.boda.update({
      where: { id: boda.id },
      data: {
        featuredImageUrl: featured,
        banner: banner as Prisma.InputJsonValue,
      },
    });
    updated += 1;
  }

  const gifts = await db.gift.findMany({
    where: { bodaId },
    select: { id: true, imageUrl: true },
  });
  for (const gift of gifts) {
    if (!shouldRehostUrl(gift.imageUrl, hosts)) continue;
    const next = await resolveUrl(gift.imageUrl!);
    if (next && next !== gift.imageUrl && !dryRun) {
      await db.gift.update({ where: { id: gift.id }, data: { imageUrl: next } });
      updated += 1;
    }
  }

  const pictures = await db.picture.findMany({
    where: { bodaId },
    select: { id: true, url: true },
  });
  for (const picture of pictures) {
    if (!shouldRehostUrl(picture.url, hosts)) continue;
    const next = await resolveUrl(picture.url);
    if (next && next !== picture.url && !dryRun) {
      await db.picture.update({ where: { id: picture.id }, data: { url: next } });
      updated += 1;
    }
  }

  const vouchers = await db.confirmedGift.findMany({
    where: { bodaId },
    select: { id: true, voucherUrl: true },
  });
  for (const voucher of vouchers) {
    if (!shouldRehostUrl(voucher.voucherUrl, hosts)) continue;
    const next = await resolveUrl(voucher.voucherUrl!);
    if (next && next !== voucher.voucherUrl && !dryRun) {
      await db.confirmedGift.update({
        where: { id: voucher.id },
        data: { voucherUrl: next },
      });
      updated += 1;
    }
  }

  const bodaMisc = await db.boda.findUnique({
    where: { id: bodaId },
    select: { misc: true },
  });
  const misc =
    bodaMisc?.misc &&
    typeof bodaMisc.misc === "object" &&
    !Array.isArray(bodaMisc.misc)
      ? { ...(bodaMisc.misc as Record<string, unknown>) }
      : {};
  const pagos = Array.isArray(misc.tarjeta_pagos) ? [...misc.tarjeta_pagos] : [];
  let pagosDirty = false;
  for (let i = 0; i < pagos.length; i += 1) {
    const pago = pagos[i];
    if (!pago || typeof pago !== "object") continue;
    const row = { ...(pago as Record<string, unknown>) };
    const url = String(row.comprobante_url ?? "");
    if (!shouldRehostUrl(url, hosts)) continue;
    const next = await resolveUrl(url);
    if (next && next !== url && !dryRun) {
      row.comprobante_url = next;
      pagos[i] = row;
      pagosDirty = true;
    }
  }
  if (pagosDirty) {
    await db.boda.update({
      where: { id: bodaId },
      data: { misc: { ...misc, tarjeta_pagos: pagos } as Prisma.InputJsonValue },
    });
    updated += 1;
  }

  return { updated, failed };
}
