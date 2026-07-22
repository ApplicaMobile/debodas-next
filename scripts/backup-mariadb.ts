/**
 * Backup lógico de MariaDB/MySQL vía mysqldump.
 *
 * Uso:
 *   npm run db:backup
 *
 * Variables:
 *   DATABASE_URL (requerida)
 *   BACKUP_DIR (opcional, default: ./backups)
 *   MYSQLDUMP_PATH (opcional, default: C:\xampp\mysql\bin\mysqldump.exe en Windows)
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

function resolveDumpBinary(): string {
  const configured = process.env.MYSQLDUMP_PATH?.trim();
  if (configured) return configured;
  if (process.platform === "win32") {
    return "C:\\xampp\\mysql\\bin\\mysqldump.exe";
  }
  return "mysqldump";
}

function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL no configurada");
  }

  const parsed = new URL(databaseUrl);
  const databaseName = parsed.pathname.replace(/^\/+/, "");
  if (!databaseName) {
    throw new Error("DATABASE_URL sin nombre de base");
  }

  const backupDir = path.resolve(
    process.env.BACKUP_DIR?.trim() || path.join(process.cwd(), "backups"),
  );
  mkdirSync(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outFile = path.join(backupDir, `${databaseName}-${stamp}.sql`);
  const dumpBin = resolveDumpBinary();

  if (process.platform === "win32" && !existsSync(dumpBin)) {
    throw new Error(
      `No se encontró mysqldump en ${dumpBin}. Definí MYSQLDUMP_PATH.`,
    );
  }

  const args = [
    `--host=${parsed.hostname}`,
    `--port=${parsed.port || "3306"}`,
    `--user=${decodeURIComponent(parsed.username || "root")}`,
    "--single-transaction",
    "--routines",
    "--triggers",
    "--result-file",
    outFile,
    databaseName,
  ];

  const password = decodeURIComponent(parsed.password || "");
  const result = spawnSync(dumpBin, args, {
    env: {
      ...process.env,
      ...(password ? { MYSQL_PWD: password } : {}),
    },
    encoding: "utf8",
  });

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || "mysqldump falló");
    process.exitCode = 1;
    return;
  }

  console.log(`Backup OK: ${outFile}`);
}

main();
