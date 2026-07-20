import { usesCloudStorage } from "@/lib/upload/local";

/** Aviso en paneles de cuenta cuando los archivos van a disco local. */
export function LocalUploadsNotice() {
  if (usesCloudStorage()) {
    return null;
  }

  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Los archivos se guardan en <code className="text-xs">/uploads</code>{" "}
      (disco local). En producción configurá{" "}
      <code className="text-xs">BLOB_READ_WRITE_TOKEN</code> para Vercel Blob.
    </p>
  );
}
