import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ChoiceTileProps {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  /** Vista previa arriba (imagen, muestra de tipografía…). */
  media?: ReactNode;
  title: ReactNode;
  /** Línea secundaria (plan requerido, descripción). */
  subtitle?: ReactNode;
  /** Badge de estado a la derecha del título (Aplicado, Guardando…). */
  status?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Opción seleccionable en forma de card (temas, tipografías). Botón nativo con aria-pressed. */
export function ChoiceTile({
  selected,
  disabled = false,
  onSelect,
  media,
  title,
  subtitle,
  status,
  children,
  className,
}: ChoiceTileProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "focus-ring group flex h-full w-full flex-col overflow-hidden rounded-md border bg-surface-default text-left transition-[border-color,box-shadow] motion-reduce:transition-none",
        selected
          ? "border-border-accent shadow-elevation-2 ring-2 ring-border-accent"
          : "border-border-subtle hover:border-border-strong hover:shadow-elevation-1",
        disabled && "cursor-not-allowed opacity-60 hover:border-border-subtle hover:shadow-none",
        className,
      )}
    >
      {media}
      <span className="flex w-full flex-1 flex-col gap-1 p-4">
        <span className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <span className="min-w-0 type-label text-text-primary">{title}</span>
          {status ? <span className="shrink-0">{status}</span> : null}
        </span>
        {children}
        {subtitle ? (
          <span className="type-caption text-text-secondary">{subtitle}</span>
        ) : null}
      </span>
    </button>
  );
}
