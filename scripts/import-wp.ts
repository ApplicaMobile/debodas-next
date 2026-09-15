/**
 * CLI: dump WP (mismas tablas wp_*) → Prisma.
 *
 *   npm run db:import-wp -- --dry-run
 *   npm run db:import-wp -- --limit=5
 *   npm run db:import-wp -- --slug=cande-y-marcelo-20260822
 */
import { config } from "dotenv";
import { prisma } from "../src/lib/db/prisma";
import { runCliImport } from "../src/lib/wp-import/engine";

config({ path: ".env.local" });
config();

function parseArgs(argv: string[]) {
  let dryRun = false;
  let limit: number | null = null;
  let slug: string | null = null;
  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg.startsWith("--limit=")) limit = Number(arg.slice("--limit=".length));
    else if (arg.startsWith("--slug=")) slug = arg.slice("--slug=".length).trim();
  }
  return { dryRun, limit, slug };
}

runCliImport(parseArgs(process.argv.slice(2)))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
});
