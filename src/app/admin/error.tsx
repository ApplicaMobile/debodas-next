"use client";

import { Alert, Button } from "@/components/ui";

export default function AdminError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <Alert
      tone="error"
      title="No pudimos cargar esta sección"
      action={
        <Button variant="secundario" size="sm" onClick={reset}>
          Reintentar
        </Button>
      }
    >
      Revisá la conexión e intentá nuevamente.
    </Alert>
  );
}
