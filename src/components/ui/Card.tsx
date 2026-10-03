import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CardTone = "default" | "muted" | "brand" | "inverse";
export type CardPadding = "none" | "sm" | "md" | "lg";
export type CardElevation = 0 | 1 | 2 | 3;

export type CardProps = HTMLAttributes<HTMLElement> & {
  /** Elemento semántico: section, article, li, div… */
  as?: ElementType;
  tone?: CardTone;
  padding?: CardPadding;
  elevation?: CardElevation;
  bordered?: boolean;
  children: ReactNode;
};

const tones: Record<CardTone, string> = {
  default: "bg-surface-default text-text-primary",
  muted: "bg-surface-muted text-text-primary",
  brand: "bg-surface-brand text-text-on-brand",
  inverse: "bg-surface-inverse text-text-inverse",
};

// Mobile primero: un poco menos de padding en pantallas chicas.
const paddings: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-4 sm:p-6",
  lg: "p-6 sm:p-8",
};

const elevations: Record<CardElevation, string> = {
  0: "",
  1: "shadow-elevation-1",
  2: "shadow-elevation-2",
  3: "shadow-elevation-3",
};

/** Contenedor base (radius/md). Reemplaza el repetido `rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8`. */
export function Card({
  as: Component = "div",
  tone = "default",
  padding = "md",
  elevation = 1,
  bordered = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Component
      {...props}
      className={cn(
        "rounded-md",
        tones[tone],
        paddings[padding],
        elevations[elevation],
        bordered && (tone === "inverse" ? "border border-border-inverse" : "border border-border-subtle"),
        className,
      )}
    >
      {children}
    </Component>
  );
}
