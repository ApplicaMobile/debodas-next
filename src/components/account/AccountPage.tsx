import type { ReactNode } from "react";
import { AccountNavIconBadge } from "@/components/account/AccountNavIcon";
import { Card, IconTrash } from "@/components/ui";
import { cn } from "@/lib/cn";

/**
 * Piezas compartidas por todas las páginas de /mi-cuenta. Mismo patrón en
 * cada sección: encabezado con ícono + título + una línea de propósito,
 * contenido agrupado en cards con título y ayuda, y acciones del formulario
 * abajo a la derecha (fijas abajo en mobile).
 */

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface AccountPageHeaderProps {
  /** Ruta de la sección: define el ícono (igual que en el menú lateral). */
  href: string;
  /** Texto corto de la sección para la línea superior ("Mi cuenta · …"). */
  section: string;
  title: string;
  /** Una línea: para qué sirve esta sección. */
  description: ReactNode;
  /** Acción principal de la página u otros enlaces (p. ej. "Ver micrositio"). */
  actions?: ReactNode;
  /** Contenido extra bajo la descripción (badges, contadores). */
  meta?: ReactNode;
}

export function AccountPageHeader({
  href,
  section,
  title,
  description,
  actions,
  meta,
}: AccountPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="flex min-w-0 items-start gap-4">
        <AccountNavIconBadge href={href} size="lg" className="mt-1" />
        <div className="min-w-0 max-w-3xl">
          <p className="type-overline text-text-accent">Mi cuenta · {section}</p>
          <h2 className="mt-1 type-h2 text-text-primary">{title}</h2>
          <p className="mt-2 type-body-lg text-text-secondary">{description}</p>
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-3 sm:justify-end">{actions}</div>
      ) : null}
    </header>
  );
}

/** Contenedor vertical de la página: mismo espaciado en todas las secciones. */
export function AccountPageBody({ children }: { children: ReactNode }) {
  return <div className="space-y-6 sm:space-y-8">{children}</div>;
}

interface AccountSectionProps {
  title: ReactNode;
  /** Ayuda corta: qué se configura en este bloque. */
  description?: ReactNode;
  /** Acciones del encabezado del bloque (p. ej. "Agregar"). */
  actions?: ReactNode;
  /** id del título (aria-labelledby). Por defecto se deriva del título. */
  id?: string;
  /** Contador/estado junto al título. */
  badge?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** Card de sección con título, ayuda y contenido. Usar siempre padding "lg". */
export function AccountSection({
  title,
  description,
  actions,
  id,
  badge,
  className,
  children,
}: AccountSectionProps) {
  const headingId =
    id ?? `seccion-${typeof title === "string" ? slugify(title) : "bloque"}`;
  return (
    <Card as="section" padding="lg" aria-labelledby={headingId} className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={headingId} className="type-h4 text-text-primary">
              {title}
            </h3>
            {badge}
          </div>
          {description ? (
            <p className="mt-1 max-w-2xl type-body-sm text-text-secondary">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </Card>
  );
}

/**
 * Grupo de campos relacionados dentro de una AccountSection (separados por
 * una línea). La leyenda real queda para lectores de pantalla y se muestra
 * una línea superior visual (las <legend> no se maquetan bien con flex/grid).
 */
export function AccountFieldGroup({
  title,
  description,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset
      className={cn(
        "min-w-0 border-t border-border-subtle pt-6 first:border-t-0 first:pt-0",
        className,
      )}
    >
      <legend className="sr-only">{title}</legend>
      <p aria-hidden="true" className="type-overline text-text-accent">
        {title}
      </p>
      {description ? (
        <p className="mt-1 type-body-sm text-text-secondary">{description}</p>
      ) : null}
      <div className="mt-4 space-y-5">{children}</div>
    </fieldset>
  );
}

/**
 * Pie de formulario: aviso a la izquierda y botones abajo a la derecha.
 * En mobile queda fijo al pie de la card mientras se completa el formulario.
 * Va siempre como último hijo dentro de una AccountSection.
 */
export function AccountFormActions({
  children,
  alert,
  className,
}: {
  children: ReactNode;
  alert?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-6 -mb-6 mt-6 flex flex-col gap-3 rounded-b-md border-t border-border-subtle bg-surface-default/95 px-6 py-4 backdrop-blur-sm",
        "sm:static sm:mx-0 sm:mb-0 sm:flex-row sm:items-center sm:justify-end sm:rounded-none sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-6 sm:backdrop-blur-none",
        className,
      )}
    >
      {alert ? <div className="min-w-0 sm:flex-1">{alert}</div> : null}
      <div className="flex flex-col-reverse gap-3 sm:shrink-0 sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
        {children}
      </div>
    </div>
  );
}

/** Lista de ítems editables dentro de una sección (cronograma, FAQ, regalos…). */
export function AccountItemList({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul role="list" aria-label={label} className="space-y-3">
      {children}
    </ul>
  );
}

/** Tabla de datos con estilo común (scroll horizontal en mobile). */
export function AccountTable({
  children,
  caption,
  className,
}: {
  children: ReactNode;
  caption?: string;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-md border border-border-subtle", className)}>
      <table className="min-w-full text-left type-body-sm text-text-primary">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export const accountTableHeadClass =
  "bg-surface-muted type-caption font-semibold uppercase tracking-wide text-text-secondary";
export const accountTableThClass = "px-4 py-3 font-semibold";
export const accountTableRowClass = "border-t border-border-subtle align-top";
export const accountTableTdClass = "px-4 py-3";

/**
 * Botón de eliminar para ítems de una lista (va dentro de ConfirmDeleteForm).
 * Discreto pero claramente destructivo: texto + ícono en rojo.
 */
export function AccountDeleteButton({
  children = "Eliminar",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={cn(
        "focus-ring inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 type-button-sm text-status-error-fg transition-colors hover:bg-status-error-bg motion-reduce:transition-none",
        className,
      )}
    >
      <IconTrash size={16} />
      <span>{children}</span>
    </button>
  );
}

/** Fila de una AccountItemList: dato destacado a la izquierda, contenido y acciones. */
export function AccountListItem({
  leading,
  title,
  meta,
  children,
  actions,
  as: Component = "li",
  className,
}: {
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  as?: "li" | "article";
  className?: string;
}) {
  return (
    <Component
      className={cn(
        "flex flex-col gap-3 rounded-md border border-border-subtle bg-surface-default p-4 sm:flex-row sm:items-start sm:gap-4",
        className,
      )}
    >
      {leading ? <div className="shrink-0 sm:w-20">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <p className="type-label text-text-primary">{title}</p>
        {meta ? <div className="mt-1 type-caption text-text-secondary">{meta}</div> : null}
        {children ? <div className="mt-2 type-body-sm text-text-secondary">{children}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2 sm:-mr-2 sm:-mt-1">{actions}</div> : null}
    </Component>
  );
}

/** Enlace "Compartir por WhatsApp" con el color de marca de WhatsApp (se abre en otra pestaña). */
export function AccountWhatsAppLink({
  href,
  onClick,
  size = "md",
  children,
  className,
}: {
  href: string;
  onClick?: () => void;
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-brand-whatsapp-bg text-center text-brand-whatsapp-fg transition-colors hover:bg-brand-whatsapp-bg-hover motion-reduce:transition-none",
        size === "sm" ? "min-h-9 px-4 py-2 type-button-sm" : "min-h-12 px-6 py-3 type-button",
        className,
      )}
    >
      <AccountNavIconInline />
      <span>{children}</span>
    </a>
  );
}

function AccountNavIconInline() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3Z" />
    </svg>
  );
}

/** Control compacto (selects/inputs dentro de tablas y listas densas). */
export const accountCompactControlClass =
  "focus-ring min-h-9 rounded-sm border border-border-strong bg-surface-default px-2 py-1.5 type-body-sm text-text-primary hover:border-text-primary disabled:cursor-not-allowed disabled:bg-surface-disabled";

/** Chip de filtro (aria-pressed) con contador opcional. */
export function AccountFilterChip({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 type-button-sm transition-colors motion-reduce:transition-none",
        active
          ? "border-action-primary-bg bg-action-primary-bg text-action-primary-fg"
          : "border-border-default bg-surface-default text-text-primary hover:bg-surface-muted",
      )}
    >
      {children}
      {count !== undefined ? (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 type-caption font-semibold tabular-nums",
            active ? "bg-surface-default/20" : "bg-surface-muted text-text-secondary",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
