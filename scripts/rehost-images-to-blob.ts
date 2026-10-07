/**
 * Rehostea los medios migrados desde WordPress (URLs externas) a disco
 * (`public/uploads/migrated/media/`) o Vercel Blob si hay BLOB_READ_WRITE_TOKEN.
 * Re-ejecutable: dedupe global por sha256 del contenido + tabla legacy_media.
 *
 * Uso:
 *   npm run db:rehost-blob -- --dry-run
 *   npm run db:rehost-blob -- --limit=20                 # como máximo 20 bodas
 *   npm run db:rehost-blob -- --boda=slug-de-la-boda
 *   npm run db:rehost-blob -- --hosts=debodas.com.ar,test.debodas.com.ar
 *   npm run db:rehost-blob -- --from-uploads-dir=/path/a/wp-content/uploads
 *   npm run db:rehost-blob -- --max-mb=25                # límite por archivo (o WP_REHOST_MAX_MB)
 *   npm run db:rehost-blob -- --no-heic-convert
 *
 * Requiere DATABASE_URL en .env.local.
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { usesCloudStorage } from "../src/lib/upload/local";
import {
  createRehostSession,
  loadOptionalSharp,
  rehostBodaImages,
  rehostMaxBytesFromEnv,
} from "../src/lib/wp-import/rehost";

config({ path: ".env.local" });
config();

const prisma = new PrismaClient();

function parseArgs(argv: string[]) {
  const get = (name: string) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3).trim();
  const limit = Number(get("limit"));
  const maxMb = Number(get("max-mb"));
  return {
    dryRun: argv.includes("--dry-run"),
    convertHeic: !argv.includes("--no-heic-convert"),
    limit: Number.isInteger(limit) && limit > 0 ? limit : undefined,
    boda: get("boda") || null,
    hosts: (get("hosts") ?? "debodas.com.ar,test.debodas.com.ar")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
    fromUploadsDir: get("from-uploads-dir") || null,
    maxBytes: Number.isFinite(maxMb) && maxMb > 0 ? Math.round(maxMb * 1024 * 1024) : rehostMaxBytesFromEnv(),
  };
}

async function countPendingWpUrls(): Promise<Record<string, number>> {
  const like = "%wp-content/uploads%";
  const [pictures, gifts, vouchers, featured] = await Promise.all([
    prisma.picture.count({ where: { url: { contains: "wp-content/uploads" } } }),
    prisma.gift.count({ where: { imageUrl: { contains: "wp-content/uploads" } } }),
    prisma.confirmedGift.count({ where: { voucherUrl: { contains: "wp-content/uploads" } } }),
    prisma.boda.count({ where: { featuredImageUrl: { contains: "wp-content/uploads" } } }),
  ]);
  const json = await prisma.$queryRaw<Array<{ banner: bigint; misc: bigint }>>`
    SELECT
      SUM(CAST(banner AS CHAR) LIKE ${like}) AS banner,
      SUM(CAST(misc AS CHAR) LIKE ${like}) AS misc
    FROM bodas`;
  return {
    pictures,
    gifts,
    vouchers,
    featured,
    bannerJson: Number(json[0]?.banner ?? 0),
    miscJson: Number(json[0]?.misc ?? 0),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const session = createRehostSession();
  if (args.convertHeic) {
    session.sharp = await loadOptionalSharp();
  }
  console.log(
    `[rehost] destino=${usesCloudStorage() ? "vercel-blob" : "public/uploads"} dryRun=${args.dryRun} hosts=${args.hosts.join(",")} maxMB=${(args.maxBytes / 1024 / 1024).toFixed(0)} heic=${args.convertHeic ? (session.sharp ? "sharp" : "sin sharp (se copian tal cual)") : "off"}${args.fromUploadsDir ? ` uploadsDir=${args.fromUploadsDir}` : ""}`,
  );

  const bodas = await prisma.boda.findMany({
    where: args.boda ? { slug: args.boda } : undefined,
    select: { id: true, slug: true },
    orderBy: { createdAt: "asc" },
    take: args.limit,
  });

  const totals = { bodas: 0, updated: 0, failed: 0, uploaded: 0, reused: 0, heicConverted: 0, heicUnconverted: 0 };
  for (const boda of bodas) {
    const r = await rehostBodaImages(boda.id, {
      client: prisma,
      dryRun: args.dryRun,
      hosts: args.hosts,
      fromUploadsDir: args.fromUploadsDir,
      maxBytes: args.maxBytes,
      convertHeic: args.convertHeic,
      session,
    });
    totals.bodas += 1;
    totals.updated += r.updated;
    totals.failed += r.failed;
    totals.uploaded += r.uploaded;
    totals.reused += r.reused;
    totals.heicConverted += r.heicConverted;
    totals.heicUnconverted += r.heicUnconverted;
    if (r.uploaded || r.updated || r.failed) {
      console.log(`[boda] ${boda.slug}: nuevos=${r.uploaded} reusados=${r.reused} filas=${r.updated} fallas=${r.failed}`);
    }
    for (const e of r.errors) {
      console.error(`  [fail] ${e.url} → ${e.error}`);
    }
  }

  console.log(`[rehost] ${JSON.stringify(totals)}`);
  console.log(`[report] URLs wp-content/uploads pendientes: ${JSON.stringify(await countPendingWpUrls())}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
