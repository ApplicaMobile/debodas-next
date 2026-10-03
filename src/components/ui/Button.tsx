import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./icons";

export type ButtonVariant = "primario" | "secundario" | "fantasma" | "peligro";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonOwnProps {
  /** Primario (navy) = 1 acción principal por vista. Secundario (beige) = apoyo. Fantasma = terciaria. Peligro = destructiva. */
  variant?: ButtonVariant;
  /** sm 36px (solo tablas / alta densidad), md 48px, lg 56px. */
  size?: ButtonSize;
  /** Muestra spinner, bloquea la acción y anuncia "Cargando…". */
  loading?: boolean;
  /** Texto alternativo mientras carga (p. ej. "Redirigiendo a MercadoPago…"). */
  loadingLabel?: string;
  /** Ícono decorativo (se oculta a lectores de pantalla). */
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  fullWidth?: boolean;
  /** Solo para la guía de estilos: fuerza visualmente un estado. */
  demoState?: "hover" | "pressed" | "focus";
  children: ReactNode;
}

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> & {
  href?: undefined;
};
type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps | "href"> & {
  /** Con `href` el botón se renderiza como `next/link`. */
  href: string;
  disabled?: boolean;
};

export type ButtonProps = ButtonOwnProps & (NativeButtonProps | LinkProps);

const base =
  "focus-ring relative inline-flex select-none items-center justify-center rounded-full text-center no-underline transition-colors duration-150 motion-reduce:transition-none";

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 gap-2 px-4 py-2 type-button-sm",
  md: "min-h-12 gap-2 px-6 py-3 type-button",
  lg: "min-h-14 gap-3 px-8 py-4 type-button",
};

const iconSizes: Record<ButtonSize, number> = { sm: 16, md: 20, lg: 20 };

const variants: Record<ButtonVariant, string> = {
  primario:
    "bg-action-primary-bg text-action-primary-fg hover:bg-action-primary-bg-hover active:bg-action-primary-bg-pressed data-[demo-state=hover]:bg-action-primary-bg-hover data-[demo-state=pressed]:bg-action-primary-bg-pressed",
  secundario:
    "bg-action-secondary-bg text-action-secondary-fg hover:bg-action-secondary-bg-hover active:bg-action-secondary-bg-pressed data-[demo-state=hover]:bg-action-secondary-bg-hover data-[demo-state=pressed]:bg-action-secondary-bg-pressed",
  fantasma:
    "bg-transparent text-action-ghost-fg hover:bg-action-ghost-bg-hover active:bg-action-ghost-bg-pressed data-[demo-state=hover]:bg-action-ghost-bg-hover data-[demo-state=pressed]:bg-action-ghost-bg-pressed",
  peligro:
    "bg-action-danger-bg text-action-danger-fg hover:bg-action-danger-bg-hover active:bg-action-danger-bg-pressed data-[demo-state=hover]:bg-action-danger-bg-hover data-[demo-state=pressed]:bg-action-danger-bg-pressed",
};

const disabledStyles: Record<ButtonVariant, string> = {
  primario: "cursor-not-allowed bg-action-disabled-bg text-action-disabled-fg",
  secundario: "cursor-not-allowed bg-action-disabled-bg text-action-disabled-fg",
  peligro: "cursor-not-allowed bg-action-disabled-bg text-action-disabled-fg",
  fantasma: "cursor-not-allowed bg-transparent text-text-disabled",
};

export function buttonClasses({
  variant = "primario",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}) {
  return cn(
    base,
    sizes[size],
    disabled ? disabledStyles[variant] : variants[variant],
    loading && "cursor-progress",
    fullWidth ? "w-full whitespace-normal" : "whitespace-nowrap",
    className,
  );
}

export function Button(props: ButtonProps) {
  const {
    variant = "primario",
    size = "md",
    loading = false,
    loadingLabel,
    icon,
    iconPosition = "start",
    fullWidth = false,
    demoState,
    className,
    children,
    ...rest
  } = props;

  const isDisabled = Boolean(rest.disabled);
  const classes = buttonClasses({ variant, size, disabled: isDisabled, loading, fullWidth, className });
  const iconSize = iconSizes[size];

  const content = (
    <>
      {loading ? (
        <Spinner size={iconSize} />
      ) : icon && iconPosition === "start" ? (
        <span aria-hidden="true" className="inline-flex shrink-0">{icon}</span>
      ) : null}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
      {loading && !loadingLabel ? <span className="sr-only">Cargando…</span> : null}
      {!loading && icon && iconPosition === "end" ? (
        <span aria-hidden="true" className="inline-flex shrink-0">{icon}</span>
      ) : null}
    </>
  );

  const demo = {
    "data-demo-state": demoState,
    "data-demo-focus": demoState === "focus" ? "" : undefined,
  };

  if (typeof rest.href === "string") {
    const { href, disabled, ...anchorProps } = rest as LinkProps;
    if (disabled || loading) {
      // Un link deshabilitado no navega: se renderiza sin href y se anuncia como deshabilitado.
      return (
        <a
          {...anchorProps}
          {...demo}
          role="link"
          aria-disabled="true"
          aria-busy={loading || undefined}
          className={classes}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} {...anchorProps} {...demo} className={classes}>
        {content}
      </Link>
    );
  }

  const { type = "button", disabled, onClick, ...buttonProps } = rest as NativeButtonProps;
  return (
    <button
      {...buttonProps}
      {...demo}
      type={type}
      // Mientras carga se bloquea (evita doble envío) pero conserva el color de la variante.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
      className={classes}
    >
      {content}
    </button>
  );
}
