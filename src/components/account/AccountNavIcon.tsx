import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Íconos de las secciones de /mi-cuenta. Mismo estilo que `@/components/ui/icons`
 * (24×24, trazo redondeado, currentColor). Siempre decorativos: van con texto visible.
 */
const ICONS: Record<string, ReactNode> = {
  // Inicio: casa
  "/mi-cuenta": (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </>
  ),
  // Mi cuenta (datos personales): persona
  "/mi-cuenta/cuenta": (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </>
  ),
  // Notificaciones: campana
  "/mi-cuenta/notificaciones": (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  // Datos de la boda: anillos
  "/mi-cuenta/boda": (
    <>
      <circle cx="9" cy="14.5" r="5.5" />
      <circle cx="15" cy="14.5" r="5.5" />
      <path d="m10 4 2-2 2 2-2 2.5z" />
    </>
  ),
  // Tema: paleta
  "/mi-cuenta/tema": (
    <>
      <path d="M12 3a9 9 0 0 0 0 18c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7h2A4.6 4.6 0 0 0 21 10.6C21 6.4 17 3 12 3Z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="10" cy="7" r="1" />
      <circle cx="15" cy="7.5" r="1" />
    </>
  ),
  // Portada y galería: imagen
  "/mi-cuenta/banner": (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="9.5" r="1.75" />
      <path d="m21 15.5-4.5-4.5L6 20" />
    </>
  ),
  // Cronograma: calendario con reloj
  "/mi-cuenta/cronograma": (
    <>
      <path d="M21 10.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5.5" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <circle cx="17.5" cy="17.5" r="4.5" />
      <path d="M17.5 15.5v2l1.25 1" />
    </>
  ),
  // Dress code: percha
  "/mi-cuenta/dress-code": (
    <>
      <path d="M12 7.5V7a2 2 0 1 1 2-2" />
      <path d="M12 7.5 2.8 14.4A1.5 1.5 0 0 0 3.7 17h16.6a1.5 1.5 0 0 0 .9-2.6Z" />
    </>
  ),
  // Preguntas frecuentes: pregunta
  "/mi-cuenta/faq": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </>
  ),
  // Compartir e invitar: sobre
  "/mi-cuenta/invitar": (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  // Invitados: personas
  "/mi-cuenta/invitados": (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  // Lista de regalos: regalo
  "/mi-cuenta/regalos": (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </>
  ),
  // Regalos recibidos: regalo con tilde
  "/mi-cuenta/regalos-recibidos": (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13H7a2 2 0 0 1-2-2v-7M19 12v1.5" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
      <path d="m15 18.5 2 2 4-4" />
    </>
  ),
  // Métodos de pago: billetera
  "/mi-cuenta/pagos": (
    <>
      <path d="M19 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2" />
      <path d="M3 6v13a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-3" />
    </>
  ),
  // Plan: corona
  "/mi-cuenta/plan": (
    <>
      <path d="M2.5 7.5 7 11l5-7 5 7 4.5-3.5L19 18H5Z" />
      <path d="M5 21h14" />
    </>
  ),
};

export function AccountNavIcon({
  href,
  className = "h-4 w-4",
}: {
  href: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[href] ?? ICONS["/mi-cuenta"]}
    </svg>
  );
}

export type AccountNavIconTone = "neutral" | "whatsapp" | "gift" | "brand";

const iconTones: Record<AccountNavIconTone, string> = {
  neutral: "bg-surface-muted text-text-accent",
  brand: "bg-surface-brand text-text-on-brand",
  whatsapp: "bg-brand-whatsapp-bg text-brand-whatsapp-fg",
  gift: "bg-status-warning-bg text-status-warning-fg",
};

/** Ícono de sección dentro de un cuadrado suave (cards de acciones y encabezados). */
export function AccountNavIconBadge({
  href,
  tone = "neutral",
  size = "md",
  className,
}: {
  href: string;
  tone?: AccountNavIconTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box =
    size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md",
        box,
        iconTones[tone],
        className,
      )}
      aria-hidden="true"
    >
      <AccountNavIcon href={href} className={icon} />
    </span>
  );
}
