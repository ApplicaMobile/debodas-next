import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isLocalUpload(url: string): boolean {
  return url.startsWith("/uploads/");
}

export function getUploadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "No se pudo subir la imagen.";
}

const ALLOWED_VOUCHER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const VOUCHER_EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export async function saveUploadedVoucher(
  file: File,
  subdir: string,
): Promise<string> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Seleccioná un comprobante válido.");
  }

  if (!ALLOWED_VOUCHER_TYPES.has(file.type)) {
    throw new Error("Formato no permitido. Usá JPG, PNG, WebP o PDF.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("El archivo supera el límite de 5 MB.");
  }

  const ext = VOUCHER_EXT_BY_MIME[file.type];
  const filename = `${randomUUID()}.${ext}`;
  const safeSubdir = subdir.replace(/[^a-zA-Z0-9/_-]/g, "");
  const uploadDir = path.join(process.cwd(), "public", "uploads", safeSubdir);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${safeSubdir}/${filename}`.replace(/\/+/g, "/");
}

export async function saveUploadedImage(
  file: File,
  subdir: string,
): Promise<string> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Seleccioná una imagen válida.");
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Formato no permitido. Usá JPG, PNG, WebP o GIF.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("La imagen supera el límite de 5 MB.");
  }

  const ext = EXT_BY_MIME[file.type];
  const filename = `${randomUUID()}.${ext}`;
  const safeSubdir = subdir.replace(/[^a-zA-Z0-9/_-]/g, "");
  const uploadDir = path.join(process.cwd(), "public", "uploads", safeSubdir);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${safeSubdir}/${filename}`.replace(/\/+/g, "/");
}

export async function deleteLocalUpload(url: string): Promise<void> {
  if (!isLocalUpload(url)) {
    return;
  }

  const relativePath = url.replace(/^\/+/, "");
  const filePath = path.join(process.cwd(), "public", relativePath);

  try {
    await unlink(filePath);
  } catch {
    // El archivo puede no existir si ya fue borrado manualmente.
  }
}
