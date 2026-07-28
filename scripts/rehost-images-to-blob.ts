/**
 * Rehostea imágenes migradas desde WordPress (URLs externas) a Vercel Blob
 * o a public/uploads/ si no hay BLOB_READ_WRITE_TOKEN.
 *
 * Uso:
 *   npm run db:rehost-blob -- --dry-run
 *   npm run db:rehost-blob -- --limit=20
 *   npm run db:rehost-blob -- --hosts=debodas.com.ar,test.debodas.com.ar
 *
 * Requiere DATABASE_URL en .env.local.
 * Para cloud: BLOB_READ_WRITE_TOKEN.
 */
import { createHash } from "crypto";
import { config } from "dotenv";
import { PrismaClient, type Prisma } from "@prisma/client";
import {
  isManagedUpload,
  putUploadedBuffer,
  usesCloudStorage,
} from "../src/lib/upload/local";

config({ path: ".env.local" });
config();

const prisma = new PrismaClient();

type BannerJson = {
  image?: { url?: string; id?: string | number };
  title?: string;
  description?: string;
  [key: string]: unknown;
};

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const limitArg = argv.find((a) => a.startsWith("--limit="));
  const hostsArg = argv.find((a) => a.startsWith("--hosts="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
  const hosts = (hostsArg?.split("=")[1] ?? "debodas.com.ar,test.debodas.com.ar")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return { dryRun, limit: Number.isFinite(limit) ? limit : undefined, hosts };
}

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

function shouldRehost(url: string | null | undefined, hosts: string[]): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim();
  if (isManagedUpload(trimmed)) return false;
  if (trimmed.startsWith("/")) return false;
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    if (hosts.length === 0) return true;
    return hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

async function fetchRemote(url: string): Promise<{ buffer: Buffer; contentType: string }> {
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

async function main() {
  const { dryRun, limit, hosts } = parseArgs(process.argv.slice(2));
  const cache = new Map<string, string>();
  let scanned = 0;
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  let updated = 0;

  console.log(
    `[rehost] destino=${usesCloudStorage() ? "vercel-blob" : "public/uploads"} dryRun=${dryRun} hosts=${hosts.join(",")}`,
  );

  async function resolveUrl(source: string, bodaId: string): Promise<string | null> {
    scanned += 1;
    if (limit != null && uploaded + failed >= limit) {
      skipped += 1;
      return null;
    }
    const cached = cache.get(source);
    if (cached) return cached;

    try {
      const { buffer, contentType } = await fetchRemote(source);
      const ext = extFromContentType(contentType, source);
      const hash = createHash("sha1").update(source).digest("hex").slice(0, 16);
      const filename = `${hash}.${ext}`;
      if (dryRun) {
        console.log(`[dry-run] ${source} → uploads/migrated/${bodaId}/${filename}`);
        cache.set(source, source);
        uploaded += 1;
        return source;
      }
      const nextUrl = await putUploadedBuffer({
        buffer,
        subdir: `migrated/${bodaId}`,
        filename,
        contentType: contentTypeFromExt(ext),
      });
      cache.set(source, nextUrl);
      uploaded += 1;
      console.log(`[ok] ${source} → ${nextUrl}`);
      return nextUrl;
    } catch (error) {
      failed += 1;
      console.error(`[fail] ${source}`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  const bodas = await prisma.boda.findMany({
    select: {
      id: true,
      slug: true,
      featuredImageUrl: true,
      banner: true,
    },
  });

  for (const boda of bodas) {
    let featured = boda.featuredImageUrl;
    let banner = (boda.banner ?? {}) as BannerJson;
    let dirty = false;

    if (shouldRehost(featured, hosts)) {
      const next = await resolveUrl(featured!, boda.id);
      if (next && next !== featured && !dryRun) {
        featured = next;
        dirty = true;
      }
    }

    const bannerUrl = banner.image?.url;
    if (shouldRehost(bannerUrl, hosts)) {
      const next = await resolveUrl(bannerUrl!, boda.id);
      if (next && next !== bannerUrl && !dryRun) {
        banner = {
          ...banner,
          image: { ...(banner.image ?? {}), url: next },
        };
        dirty = true;
        if (featured === bannerUrl) {
          featured = next;
        }
      }
    }

    if (dirty && !dryRun) {
      await prisma.boda.update({
        where: { id: boda.id },
        data: {
          featuredImageUrl: featured,
          banner: banner as Prisma.InputJsonValue,
        },
      });
      updated += 1;
    }
  }

  const gifts = await prisma.gift.findMany({
    select: { id: true, bodaId: true, imageUrl: true },
  });
  for (const gift of gifts) {
    if (!shouldRehost(gift.imageUrl, hosts)) continue;
    const next = await resolveUrl(gift.imageUrl!, gift.bodaId);
    if (next && next !== gift.imageUrl && !dryRun) {
      await prisma.gift.update({
        where: { id: gift.id },
        data: { imageUrl: next },
      });
      updated += 1;
    }
  }

  const pictures = await prisma.picture.findMany({
    select: { id: true, bodaId: true, url: true },
  });
  for (const picture of pictures) {
    if (!shouldRehost(picture.url, hosts)) continue;
    const next = await resolveUrl(picture.url, picture.bodaId);
    if (next && next !== picture.url && !dryRun) {
      await prisma.picture.update({
        where: { id: picture.id },
        data: { url: next },
      });
      updated += 1;
    }
  }

  const vouchers = await prisma.confirmedGift.findMany({
    select: { id: true, bodaId: true, voucherUrl: true },
  });
  for (const voucher of vouchers) {
    if (!shouldRehost(voucher.voucherUrl, hosts)) continue;
    const next = await resolveUrl(voucher.voucherUrl!, voucher.bodaId);
    if (next && next !== voucher.voucherUrl && !dryRun) {
      await prisma.confirmedGift.update({
        where: { id: voucher.id },
        data: { voucherUrl: next },
      });
      updated += 1;
    }
  }

  console.log(
    `[rehost] scanned=${scanned} uploaded=${uploaded} updatedRows=${updated} failed=${failed} skipped=${skipped}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
