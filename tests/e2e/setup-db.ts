import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import mysql from "mysql2/promise";

config({ path: ".env.e2e", override: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL E2E no configurada");

const parsed = new URL(databaseUrl);
const databaseName = parsed.pathname.replace(/^\/+/, "");
if (!databaseName.endsWith("_e2e")) {
  throw new Error(
    `Reset abortado: la base "${databaseName}" no termina en _e2e`,
  );
}

async function main() {
  const connection = await mysql.createConnection({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  });

  await connection.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
  await connection.query(
    `CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.end();

  for (const args of [
    ["prisma", "db", "push", "--skip-generate"],
    ["tsx", "prisma/seed-e2e.ts"],
  ]) {
    const result = spawnSync(`npx ${args.join(" ")}`, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
      shell: true,
    });
    if (result.status !== 0) {
      throw new Error(
        `Falló: npx ${args.join(" ")}${result.error ? ` (${result.error.message})` : ""}`,
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
