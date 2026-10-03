import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "./Badge";
import { Button, type ButtonVariant } from "./Button";
import { IconCheck, IconX } from "./icons";

export interface PlanFeature {
  label: string;
  /** false = no incluido (se muestra tachado visualmente y anunciado). Por defecto true. */
  included?: boolean;
  /** Aclaración corta, p. ej. "hasta 40". */
  note?: string;
}

export interface PlanCardCta {
  label: string;
  href?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  /** Texto debajo del botón (motivo de deshabilitado, medio de pago, etc.). */
  helper?: ReactNode;
}

export interface PlanCardProps {
  name: string;
  /** Precio en ARS. 0 = gratis. null = "Consultar". */
  price: number | null;
  priceNote?: string;
  description?: string;
  features: PlanFeature[];
  /** Variante destacada: borde dorado, elevación 2 y badge "Recomendado". */
  recommended?: boolean;
  recommendedLabel?: string;
  /** Plan activo de la pareja: reemplaza el CTA por un estado. */
  current?: boolean;
  cta?: PlanCardCta;
  /** Nivel del título (por defecto h3). */
  headingLevel?: "h2" | "h3" | "h4";
  className?: string;
  /** Contenido extra al pie (p. ej. un formulario con server action). */
  footer?: ReactNode;
}

export function formatArs(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PlanCard({
  name,
  price,
  priceNote,
  description,
  features,
  recommended = false,
  recommendedLabel = "Recomendado",
  current = false,
  cta,
  headingLevel: Heading = "h3",
  className,
  footer,
}: PlanCardProps) {
  const priceText = price === null ? "Consultar" : price === 0 ? formatArs(0) : formatArs(price);
  const titleId = `plan-${name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "")}`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "relative flex h-full min-w-0 flex-col rounded-md bg-surface-default p-6 sm:p-8",
        recommended
          ? "border-2 border-border-accent shadow-elevation-2"
          : current
            ? "border-2 border-action-primary-bg shadow-elevation-1"
            : "border border-border-subtle shadow-elevation-1",
        className,
      )}
    >
      <div className="flex min-h-7 flex-wrap items-center gap-2">
        {recommended ? <Badge tone="recomendado">{recommendedLabel}</Badge> : null}
        {current ? (
          <Badge tone="aprobado">Tu plan actual</Badge>
        ) : null}
      </div>

      <Heading id={titleId} className="mt-4 type-h3 text-text-primary">
        {name}
      </Heading>
      {description ? <p className="mt-2 type-body-sm text-text-secondary lg:min-h-11">{description}</p> : null}

      <p className="mt-6 flex flex-col">
        <span className="sr-only">Precio: </span>
        <span className="type-h1 text-text-primary tabular-nums">{priceText}</span>
        {priceNote ? <span className="mt-1 type-body-sm text-text-secondary">{priceNote}</span> : null}
      </p>

      <hr className="my-6 border-border-subtle" />

      <p className="type-overline text-text-accent">Qué incluye</p>
      <ul className="mt-4 flex flex-col gap-3" role="list">
        {features.map((f) => {
          const included = f.included !== false;
          return (
            <li key={f.label} className="flex items-start gap-3">
              {included ? (
                <IconCheck size={20} className="mt-[3px] shrink-0 text-status-success-fg" />
              ) : (
                <IconX size={20} className="mt-[3px] shrink-0 text-text-tertiary" />
              )}
              <span className={cn("type-body", included ? "text-text-primary" : "text-text-tertiary")}>
                {!included ? <span className="sr-only">No incluido: </span> : null}
                {f.label}
                {f.note ? <span className="text-text-secondary"> · {f.note}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-8">
        {current ? (
          <p className="rounded-md bg-surface-muted px-4 py-3 text-center type-label text-text-primary">
            Este es tu plan activo
          </p>
        ) : cta ? (
          <>
            {cta.href && !cta.disabled ? (
              <Button
                variant={cta.variant ?? (recommended ? "primario" : "secundario")}
                size="lg"
                fullWidth
                href={cta.href}
                loading={cta.loading}
                loadingLabel={cta.loadingLabel}
                aria-describedby={cta.helper ? `${titleId}-cta-ayuda` : undefined}
              >
                {cta.label}
              </Button>
            ) : (
              <Button
                variant={cta.variant ?? (recommended ? "primario" : "secundario")}
                size="lg"
                fullWidth
                type="submit"
                disabled={cta.disabled}
                loading={cta.loading}
                loadingLabel={cta.loadingLabel}
                aria-describedby={cta.helper ? `${titleId}-cta-ayuda` : undefined}
              >
                {cta.label}
              </Button>
            )}
            {cta.helper ? (
              <p id={`${titleId}-cta-ayuda`} className="mt-3 text-center type-body-sm text-text-secondary">
                {cta.helper}
              </p>
            ) : null}
          </>
        ) : null}
        {footer}
      </div>
    </article>
  );
}
