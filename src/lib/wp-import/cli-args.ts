import type { WpImportMode } from "@/lib/wp-import/types";

export interface WpImportCliArgs {
  dryRun: boolean;
  mode: WpImportMode;
  ids: number[] | null;
  limit: number | null;
  slug: string | null;
  force: boolean;
  logDir: string | null;
  skipRatings: boolean;
}

export class CliArgsError extends Error {}

/**
 * Parsea los flags de `npm run db:import-wp -- …`.
 *
 *   --dry-run            no escribe nada; reporte por consola + JSONL
 *   --only-new           (por defecto) solo bodas que no están en Next
 *   --changed            re-importa si cambió en WP y no se editó en Next
 *   --overwrite          DESTRUCTIVO: reemplaza siempre (solo staging)
 *   --force              permite --overwrite con NODE_ENV=production
 *   --ids=1,2,3          solo esos post IDs de WP
 *   --limit=N            como máximo N bodas
 *   --slug=x             una boda por slug
 *   --log-dir=/ruta      dónde escribir el JSONL (por defecto, tmp del sistema)
 *   --skip-ratings       no importar calificaciones
 */
export function parseWpImportArgs(
  argv: string[],
  env: { NODE_ENV?: string } = process.env,
): WpImportCliArgs {
  const args: WpImportCliArgs = {
    dryRun: false,
    mode: "only-new",
    ids: null,
    limit: null,
    slug: null,
    force: false,
    logDir: null,
    skipRatings: false,
  };
  const modes = new Set<WpImportMode>();
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--only-new") modes.add("only-new");
    else if (arg === "--changed") modes.add("changed");
    else if (arg === "--overwrite") modes.add("overwrite");
    else if (arg === "--force") args.force = true;
    else if (arg === "--skip-ratings") args.skipRatings = true;
    else if (arg.startsWith("--limit=")) {
      const n = Number(arg.slice("--limit=".length));
      if (!Number.isInteger(n) || n <= 0) throw new CliArgsError(`--limit inválido: ${arg}`);
      args.limit = n;
    } else if (arg.startsWith("--ids=")) {
      const ids = arg
        .slice("--ids=".length)
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((n) => Number.isInteger(n) && n > 0);
      if (ids.length === 0) throw new CliArgsError(`--ids vacío o inválido: ${arg}`);
      args.ids = [...new Set(ids)];
    } else if (arg.startsWith("--slug=")) {
      args.slug = arg.slice("--slug=".length).trim() || null;
    } else if (arg.startsWith("--log-dir=")) {
      args.logDir = arg.slice("--log-dir=".length).trim() || null;
    } else {
      throw new CliArgsError(`Flag desconocido: ${arg}`);
    }
  }
  if (modes.size > 1) {
    throw new CliArgsError("Usá un solo modo: --only-new, --changed o --overwrite.");
  }
  args.mode = [...modes][0] ?? "only-new";
  if (args.mode === "overwrite" && env.NODE_ENV === "production" && !args.force && !args.dryRun) {
    throw new CliArgsError(
      "--overwrite es destructivo y está bloqueado con NODE_ENV=production. Si de verdad querés, agregá --force.",
    );
  }
  return args;
}
