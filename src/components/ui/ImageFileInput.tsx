"use client";

import { useEffect, useId, useRef, useState } from "react";

interface ImageFileInputProps {
  name: string;
  label: string;
  hint?: string;
  accept?: string;
  /** `dropzone`: zona táctil grande (ideal para móvil / comprobantes) */
  variant?: "default" | "dropzone";
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export function ImageFileInput({
  name,
  label,
  hint,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  variant = "default",
}: ImageFileInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function applyFile(file: File | null) {
    if (!file) {
      setPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      setFileName(null);
      setIsPdf(false);
      return;
    }

    setFileName(file.name);
    setIsPdf(file.type === "application/pdf");

    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      if (!isImageFile(file)) {
        return null;
      }
      return URL.createObjectURL(file);
    });
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    applyFile(event.target.files?.[0] ?? null);
  }

  function handleClear() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    applyFile(null);
  }

  if (variant === "dropzone") {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-stone-700">{label}</p>
        {hint ? <p className="text-sm text-stone-500">{hint}</p> : null}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          name={name}
          accept={accept}
          onChange={handleChange}
          className="sr-only"
        />

        <label
          htmlFor={inputId}
          className="flex min-h-[7.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center transition hover:border-[#556B2F] hover:bg-[#556B2F]/5"
        >
          {fileName ? (
            <>
              <span className="text-sm font-semibold text-stone-800">
                {fileName}
              </span>
              <span className="text-xs text-stone-500">
                Tocá para cambiar el archivo
              </span>
            </>
          ) : (
            <>
              <span className="rounded-full bg-[#556B2F] px-4 py-2 text-sm font-semibold text-white">
                Elegir archivo
              </span>
              <span className="text-sm text-stone-600">
                O tocá acá para subir el comprobante
              </span>
            </>
          )}
        </label>

        {fileName ? (
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm text-stone-600">
              {isPdf ? "PDF listo para enviar" : "Archivo seleccionado"}
            </p>
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 text-sm font-medium text-stone-500 hover:text-stone-800"
            >
              Quitar
            </button>
          </div>
        ) : null}

        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Vista previa del comprobante"
            className="h-36 w-full rounded-xl object-cover"
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-stone-700" htmlFor={inputId}>
        {label}
      </label>
      {hint ? <p className="text-sm text-stone-500">{hint}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          name={name}
          accept={accept}
          onChange={handleChange}
          className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-full file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-stone-700 hover:file:bg-stone-200"
        />
        {fileName ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-stone-500 hover:text-stone-700"
          >
            Quitar
          </button>
        ) : null}
      </div>

      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Vista previa"
          className="h-32 w-full rounded-xl object-cover sm:max-w-xs"
        />
      ) : null}
    </div>
  );
}
