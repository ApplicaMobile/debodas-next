/**
 * CLI: tablas wp_* (WP_DATABASE_URL, o DATABASE_URL) → Prisma. Idempotente vía legacy_map.
 *
 *   npm run db:import-wp -- --dry-run                 # reporte sin escribir nada
 *   npm run db:import-wp                              # = --only-new (por defecto): solo bodas nuevas
 *   npm run db:import-wp -- --changed                 # re-importa si cambió en WP y NO se editó en Next
 *   npm run db:import-wp -- --ids=123,456 --limit=10
 *   npm run db:import-wp -- --slug=cande-y-marcelo-20260822
 *   npm run db:import-wp -- --overwrite               # DESTRUCTIVO, solo staging (con NODE_ENV=production exige --force)
 *   npm run db:import-wp -- --log-dir=./backups/wp-import-logs
 *
 * Cada corrida deja un JSONL y un reporte JSON (por defecto en el tmp del sistema)
 * y, si no es dry-run, una fila en admin_audit_logs.
 */
import { config } from "dotenv";
import { prisma } from "../src/lib/db/prisma";
import { CliArgsError, parseWpImportArgs } from "../src/lib/wp-import/cli-args";
import { runCliImport } from "../src/lib/wp-import/engine";

config({ path: ".env.local" });
config();

async function main() {
  let args;
  try {
    args = parseWpImportArgs(process.argv.slice(2));
  } catch (error) {
    if (error instanceof CliArgsError) {
      console.error(error.message);
      process.exitCode = 2;
      return;
    }
    throw error;
  }
  const summary = await runCliImport(args);
  if (summary && summary.failed.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
