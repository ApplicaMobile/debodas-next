import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./icons";

/**
 * Botón / enlace de solo ícono para acciones de filas (tablas y listas).
 *
 * - Área táctil de 44×44px y anillo de foco visible.
 * - `label` es obligatorio: es el nombre accesible (`aria-label`) y el texto del
 *   tooltip, que aparece al pasar el mouse o al enfocar con teclado.
 * - Variantes: `neutral` (por defecto), `primary` (acción principal de la fila)
 *   y `danger` (eliminar; acompañar con confirmación).
 * - Las acciones de texto de la página (CTAs, envío de formularios) siguen
 *   usando `Button`.
 */
export type IconButtonVariant = "neutral" | "primary" | "danger";
export type IconTooltipPlacement = "top" | "bottom";
export type IconTooltipAlign = "center" | "start" | "end";

interface IconActionOwnProps {
  /** Nombre accesible (aria-label) y texto del tooltip. */
  label: string;
  /** Ícono de `@/components/ui/icons` (20px por defecto). */
  icon: ReactNode;
  variant?: IconButtonVariant;
  /**
   * Texto visible del tooltip si debe ser más corto que el nombre accesible
   * (p. ej. label "Ver sitio (se abre en otra pestaña)", tooltip "Ver sitio").
   * `false` lo oculta.
   */
  tooltip?: string | false;
  tooltipPlacement?: IconTooltipPlacement;
  /** Alineación horizontal del tooltip respecto del botón. */
  tooltipAlign?: IconTooltipAlign;
  className?: string;
}

const base =
  "focus-ring group/icon-action relative inline-flex size-11 shrink-0 select-none items-center justify-center rounded-full border transition-colors duration-150 motion-reduce:transition-none";

const variants: Record<IconButtonVariant, string> = {
  neutral:
    "border-border-default bg-surface-default text-text-primary hover:border-border-strong hover:bg-surface-muted active:bg-action-ghost-bg-pressed",
  primary:
    "border-transparent bg-action-primary-bg text-action-primary-fg hover:bg-action-primary-bg-hover active:bg-action-primary-bg-pressed",
  danger:
    "border-border-default bg-surface-default text-status-error-fg hover:border-status-error-border hover:bg-status-error-bg active:bg-status-error-bg",
};

const disabledClass =
  "cursor-not-allowed border-transparent bg-action-disabled-bg text-action-disabled-fg";

export function iconButtonClasses({
  variant = "neutral",
  disabled = false,
  loading = false,
  className,
}: {
  variant?: IconButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return cn(
    base,
    disabled && !loading ? disabledClass : variants[variant],
    loading && "cursor-progress",
    className,
  );
}

function IconTooltip({
  text,
  placement = "top",
  align = "center",
}: {
  text: string;
  placement?: IconTooltipPlacement;
  align?: IconTooltipAlign;
}) {
  return (
    <span
      aria-hidden="true"
      data-icon-tooltip=""
      className={cn(
        "pointer-events-none invisible absolute z-30 whitespace-nowrap rounded-sm bg-surface-inverse px-2 py-1 type-caption font-semibold text-text-inverse opacity-0 shadow-elevation-2 transition-opacity duration-150 motion-reduce:transition-none",
        "group-hover/icon-action:visible group-hover/icon-action:opacity-100 group-focus-visible/icon-action:visible group-focus-visible/icon-action:opacity-100",
        placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "start" && "left-0",
        align === "end" && "right-0",
      )}
    >
      {text}
    </span>
  );
}

function IconContent({
  icon,
  loading,
}: {
  icon: ReactNode;
  loading?: boolean;
}) {
  return (
    <span aria-hidden="true" className="inline-flex shrink-0">
      {loading ? <Spinner size={20} /> : icon}
    </span>
  );
}

export type IconButtonProps = IconActionOwnProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof IconActionOwnProps | "children" | "aria-label"
  > & {
    /** Muestra spinner y bloquea la acción. */
    loading?: boolean;
  };

export function IconButton({
  label,
  icon,
  variant = "neutral",
  tooltip,
  tooltipPlacement,
  tooltipAlign,
  className,
  loading = false,
  type = "button",
  disabled,
  ...rest
}: IconButtonProps) {
  const tooltipText = tooltip === false ? null : (tooltip ?? label);
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      data-icon-action=""
      className={iconButtonClasses({ variant, disabled, loading, className })}
    >
      <IconContent icon={icon} loading={loading} />
      {tooltipText ? (
        <IconTooltip
          text={tooltipText}
          placement={tooltipPlacement}
          align={tooltipAlign}
        />
      ) : null}
    </button>
  );
}

export type IconLinkProps = IconActionOwnProps &
  Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof IconActionOwnProps | "children" | "aria-label" | "href"
  > & {
    href: string;
    /** Abre en otra pestaña (target _blank + rel noopener noreferrer). */
    newTab?: boolean;
  };

const externalHref = /^(https?:|mailto:|tel:|\/\/)/i;

export function IconLink({
  label,
  icon,
  variant = "neutral",
  tooltip,
  tooltipPlacement,
  tooltipAlign,
  className,
  href,
  newTab = false,
  ...rest
}: IconLinkProps) {
  const tooltipText = tooltip === false ? null : (tooltip ?? label);
  const props = {
    ...rest,
    "aria-label": label,
    "data-icon-action": "",
    className: iconButtonClasses({ variant, className }),
    ...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {}),
  };
  const content = (
    <>
      <IconContent icon={icon} />
      {tooltipText ? (
        <IconTooltip
          text={tooltipText}
          placement={tooltipPlacement}
          align={tooltipAlign}
        />
      ) : null}
    </>
  );

  // Archivos y sitios externos (o en otra pestaña) van con <a>: sin prefetch de Next.
  if (newTab || externalHref.test(href)) {
    return (
      <a href={href} {...props}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} {...props}>
      {content}
    </Link>
  );
}
