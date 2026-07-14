"use client";

import { useEffect, useRef, useState } from "react";

interface ImageFileInputProps {
  name: string;
  label: string;
  hint?: string;
  accept?: string;
}

export function ImageFileInput({
  name,
  label,
  hint,
  accept = "image/jpeg,image/png,image/webp,image/gif",
}: ImageFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPreviewUrl(null);
      setFileName(null);
      return;
    }

    setFileName(file.name);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(file);
    });
  }

  function handleClear() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    setFileName(null);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-stone-700">{label}</label>
      {hint ? <p className="text-sm text-stone-500">{hint}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
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
