import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface MarketingSectionHeaderProps {
  /** Texto corto en mayúsculas sobre el título. */
  eyebrow: ReactNode;
  title: ReactNode;
  /** Bajada opcional debajo del título. */
  lead?: ReactNode;
  /** center (por defecto) o left para secciones en dos columnas. */
  align?: "center" | "left";
  /** light sobre fondos claros, dark sobre navy. */
  tone?: "light" | "dark";
  /** id del h2 (para aria-labelledby de la sección). */
  titleId?: string;
  className?: string;
  /** Contenido extra al final del bloque (p. ej. una píldora o un link). */
  children?: ReactNode;
}

const tones = {
  light: {
    eyebrow: "text-text-secondary",
    title: "text-text-primary",
    lead: "text-text-secondary",
  },
  dark: {
    eyebrow: "text-white/60",
    title: "text-white",
    lead: "text-white/75",
  },
} as const;

/**
 * Encabezado de sección de la home: eyebrow + h2 (Playfair) + bajada.
 * Sin hooks: sirve en Server y Client Components.
 */
export function MarketingSectionHeader({
  eyebrow,
  title,
  lead,
  align = "center",
  tone = "light",
  titleId,
  className,
  children,
}: MarketingSectionHeaderProps) {
  const colors = tones[tone];
  const centered = align === "center";

  return (
    <div className={cn(centered ? "mx-auto max-w-2xl text-center" : "max-w-xl text-left", className)}>
      <p className={cn("type-overline", colors.eyebrow)}>{eyebrow}</p>
      <h2 id={titleId} className={cn("mt-3 type-h3 sm:type-h2", colors.title)}>
        {title}
      </h2>
      {lead ? (
        <p className={cn("mt-4 type-body sm:type-body-lg", colors.lead)}>{lead}</p>
      ) : null}
      {children}
    </div>
  );
}
