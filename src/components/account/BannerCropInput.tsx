"use client";

import { useEffect, useId, useRef, useState } from "react";

const OUTPUT_WIDTH = 1400;
const OUTPUT_HEIGHT = 500;
const RATIO = OUTPUT_WIDTH / OUTPUT_HEIGHT;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

interface BannerCropInputProps {
  name: string;
  label: string;
  hint?: string;
}

function cropRect(
  width: number,
  height: number,
  zoom: number,
  panX: number,
  panY: number,
) {
  const imgRatio = width / height;
  let baseW: number;
  let baseH: number;
  if (imgRatio > RATIO) {
    baseH = height;
    baseW = baseH * RATIO;
  } else {
    baseW = width;
    baseH = baseW / RATIO;
  }
  const cropW = Math.max(1, baseW / zoom);
  const cropH = Math.max(1, baseH / zoom);
  const maxX = Math.max(0, width - cropW);
  const maxY = Math.max(0, height - cropH);
  return {
    x: maxX * panX,
    y: maxY * panY,
    cropW,
    cropH,
  };
}

export function BannerCropInput({ name, label, hint }: BannerCropInputProps) {
  const inputId = useId();
  const pickRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0.5);
  const [panY, setPanY] = useState(0.5);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = previewRef.current;
    if (!image || !canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const { x, y, cropW, cropH } = cropRect(
      image.naturalWidth,
      image.naturalHeight,
      zoom,
      panX,
      panY,
    );
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image,
      x,
      y,
      cropW,
      cropH,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    canvas.toBlob(
      (blob) => {
        if (!blob || !hiddenRef.current) {
          return;
        }
        const file = new File([blob], "banner.jpg", { type: "image/jpeg" });
        const transfer = new DataTransfer();
        transfer.items.add(file);
        hiddenRef.current.files = transfer.files;
      },
      "image/jpeg",
      0.9,
    );
  }, [zoom, panX, panY, fileName]);

  function onPick(file: File | null) {
    if (!file) {
      imageRef.current = null;
      setFileName(null);
      setError(null);
      if (hiddenRef.current) {
        hiddenRef.current.value = "";
      }
      return;
    }
    if (!file.type.startsWith("image/") || file.size > MAX_FILE_BYTES) {
      setError(
        file.size > MAX_FILE_BYTES
          ? "El archivo supera el límite de 5 MB."
          : "El formato del archivo no está permitido.",
      );
      setFileName(null);
      imageRef.current = null;
      if (pickRef.current) {
        pickRef.current.value = "";
      }
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      imageRef.current = image;
      setZoom(1);
      setPanX(0.5);
      setPanY(0.5);
      setFileName(file.name);
      setError(null);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("No se pudo leer la imagen.");
    };
    image.src = url;
  }

  return (
    <div className="space-y-2">
      <input ref={hiddenRef} type="file" name={name} className="hidden" />
      <label htmlFor={inputId} className="block type-label text-text-primary">
        {label}
      </label>
      <input
        id={inputId}
        ref={pickRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="focus-ring block w-full cursor-pointer rounded-md border border-dashed border-border-strong bg-surface-muted p-3 type-body-sm text-text-secondary file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-action-secondary-bg file:px-4 file:py-2 file:type-button-sm file:text-action-secondary-fg hover:file:bg-action-secondary-bg-hover"
        onChange={(event) => onPick(event.target.files?.[0] ?? null)}
      />
      {hint ? <p className="type-body-sm text-text-secondary">{hint}</p> : null}
      {error ? (
        <p role="alert" className="type-body-sm font-medium text-status-error-fg">
          {error}
        </p>
      ) : null}
      {fileName ? (
        <div className="space-y-3 pt-2">
          <canvas
            ref={previewRef}
            width={OUTPUT_WIDTH}
            height={OUTPUT_HEIGHT}
            className="w-full rounded-md border border-border-subtle bg-surface-muted"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate type-caption text-text-secondary">
              Recorte 1400×500 · {fileName}
            </p>
            <button
              type="button"
              onClick={() => {
                if (pickRef.current) {
                  pickRef.current.value = "";
                }
                onPick(null);
              }}
              className="focus-ring shrink-0 rounded-sm type-button-sm text-text-secondary hover:text-text-primary hover:underline"
            >
              Quitar
            </button>
          </div>
          <label className="block type-caption font-semibold text-text-secondary">
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="mt-1 w-full accent-action-primary-bg"
            />
          </label>
          <label className="block type-caption font-semibold text-text-secondary">
            Horizontal
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={panX}
              onChange={(event) => setPanX(Number(event.target.value))}
              className="mt-1 w-full accent-action-primary-bg"
            />
          </label>
          <label className="block type-caption font-semibold text-text-secondary">
            Vertical
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={panY}
              onChange={(event) => setPanY(Number(event.target.value))}
              className="mt-1 w-full accent-action-primary-bg"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
