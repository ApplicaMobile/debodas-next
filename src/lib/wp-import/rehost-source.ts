import { existsSync } from "fs";
import path from "path";

/** Extrae el path relativo bajo wp-content/uploads desde una URL o path. */
export function uploadsRelativePathFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(/\/wp-content\/uploads\/(.+?)(?:\?|#|$)/i);
  if (!match?.[1]) {
    return null;
  }
  const relative = decodeURIComponent(match[1]).replace(/\\/g, "/");
  if (!relative || relative.includes("..")) {
    return null;
  }
  return relative;
}

/** Resuelve un archivo local si existe bajo `uploadsDir` (copia SFTP de WP). */
export function resolveFromUploadsDir(
  url: string,
  uploadsDir: string,
): string | null {
  const relative = uploadsRelativePathFromUrl(url);
  if (!relative) {
    return null;
  }
  const root = path.resolve(uploadsDir);
  const absolute = path.resolve(root, relative);
  const rel = path.relative(root, absolute);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }
  return existsSync(absolute) ? absolute : null;
}
