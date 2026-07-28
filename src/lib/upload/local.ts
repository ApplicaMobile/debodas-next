import { put, del } from "@vercel/blob";
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

function hasExpectedSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (mimeType === "image/gif") {
    const signature = buffer.subarray(0, 6).toString("ascii");
    return signature === "GIF87a" || signature === "GIF89a";
  }
  if (mimeType === "application/pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  return false;
}

function assertFileSignature(buffer: Buffer, mimeType: string): void {
  if (!hasExpectedSignature(buffer, mimeType)) {
    throw new Error(
      "El contenido del archivo no coincide con el formato declarado.",
    );
  }
}

export function usesCloudStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function isManagedUpload(url: string): boolean {
  return (
    url.startsWith("/uploads/") ||
    url.includes(".public.blob.vercel-storage.com") ||
    url.includes("blob.vercel-storage.com")
  );
}

/** @deprecated use isManagedUpload */
export function isLocalUpload(url: string): boolean {
  return url.startsWith("/uploads/");
}

export function getUploadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "No se pudo subir la imagen.";
}

async function saveToLocal(
  buffer: Buffer,
  safeSubdir: string,
  filename: string,
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", safeSubdir);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${safeSubdir}/${filename}`.replace(/\/+/g, "/");
}

async function saveToBlob(
  buffer: Buffer,
  safeSubdir: string,
  filename: string,
  contentType: string,
): Promise<string> {
  const pathname = `uploads/${safeSubdir}/${filename}`.replace(/\/+/g, "/");
  const blob = await put(pathname, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
  return blob.url;
}

async function persistFile(
  buffer: Buffer,
  safeSubdir: string,
  filename: string,
  contentType: string,
): Promise<string> {
  if (usesCloudStorage()) {
    return saveToBlob(buffer, safeSubdir, filename, contentType);
  }
  return saveToLocal(buffer, safeSubdir, filename);
}

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
  const buffer = Buffer.from(await file.arrayBuffer());
  assertFileSignature(buffer, file.type);

  return persistFile(buffer, safeSubdir, filename, file.type);
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
  const buffer = Buffer.from(await file.arrayBuffer());
  assertFileSignature(buffer, file.type);

  return persistFile(buffer, safeSubdir, filename, file.type);
}

export async function putUploadedBuffer(input: {
  buffer: Buffer;
  subdir: string;
  filename: string;
  contentType: string;
}): Promise<string> {
  const safeSubdir = input.subdir.replace(/[^a-zA-Z0-9/_-]/g, "");
  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "");
  return persistFile(
    input.buffer,
    safeSubdir,
    safeName,
    input.contentType,
  );
}

export async function deleteLocalUpload(url: string): Promise<void> {
  if (!isManagedUpload(url)) {
    return;
  }

  if (url.startsWith("/uploads/")) {
    const relativePath = url.replace(/^\/+/, "");
    const filePath = path.join(process.cwd(), "public", relativePath);
    try {
      await unlink(filePath);
    } catch {
      // ignore missing file
    }
    return;
  }

  if (usesCloudStorage()) {
    try {
      await del(url);
    } catch {
      // ignore
    }
  }
}
