import { Alert } from "@/components/ui";
import { usesCloudStorage } from "@/lib/upload/local";

/** Aviso solo en desarrollo local cuando los uploads van a disco. */
export function LocalUploadsNotice() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  if (usesCloudStorage()) {
    return null;
  }

  return (
    <Alert tone="pendiente" title="Modo desarrollo">
      Los archivos se guardan en <code className="type-caption">/uploads</code>{" "}
      (disco local). En producción configurá{" "}
      <code className="type-caption">BLOB_READ_WRITE_TOKEN</code> para Vercel Blob.
    </Alert>
  );
}
