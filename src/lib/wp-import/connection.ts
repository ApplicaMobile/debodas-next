import mysql from "mysql2/promise";

const DEFAULT_PREFIX = "wp_";

export function wpTablePrefix(): string {
  const raw = (process.env.WP_TABLE_PREFIX ?? DEFAULT_PREFIX).trim() || DEFAULT_PREFIX;
  if (!/^[a-zA-Z0-9_]+$/.test(raw)) {
    throw new Error("WP_TABLE_PREFIX inválido.");
  }
  return raw;
}

export function wpDatabaseUrl(): string {
  const url =
    process.env.WP_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "";
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL (o WP_DATABASE_URL). Las tablas wp_* viven en la misma MySQL.",
    );
  }
  return url;
}

export function mysqlConfigFromUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username || "root"),
    password: decodeURIComponent(parsed.password || ""),
    database: parsed.pathname.replace(/^\//, ""),
    charset: "utf8mb4" as const,
  };
}

export async function openWpConnection(): Promise<mysql.Connection> {
  const conn = await mysql.createConnection(mysqlConfigFromUrl(wpDatabaseUrl()));
  await conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
  return conn;
}

export async function wpTablesAvailable(
  conn: mysql.Connection,
): Promise<boolean> {
  const prefix = wpTablePrefix();
  try {
    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      `SHOW TABLES LIKE ?`,
      [`${prefix}posts`],
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}
