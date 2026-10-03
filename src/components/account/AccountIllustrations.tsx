import type { SVGProps } from "react";

/**
 * Ilustraciones livianas (SVG inline) para el panel de la pareja.
 * Usan solo variables de color del sistema de diseño y son decorativas
 * (aria-hidden): el texto de al lado transmite la información.
 */
type IllustrationProps = SVGProps<SVGSVGElement>;

const c = {
  crema50: "var(--color-crema-50)",
  crema100: "var(--color-crema-100)",
  crema200: "var(--color-crema-200)",
  crema300: "var(--color-crema-300)",
  crema400: "var(--color-crema-400)",
  crema700: "var(--color-crema-700)",
  navy: "var(--color-navy-700)",
  oro: "var(--color-oro-400)",
  oroSoft: "var(--color-oro-200)",
  verde: "var(--color-verde-500)",
  white: "var(--color-neutral-0)",
};

function Base({ children, viewBox = "0 0 160 120", ...props }: IllustrationProps) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

function Sprig({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <path d="M0 0c6-10 14-16 24-18" stroke={c.crema700} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="8" cy="-8" rx="5" ry="2.5" transform="rotate(-40 8 -8)" fill={c.verde} opacity=".55" />
      <ellipse cx="15" cy="-13" rx="5" ry="2.5" transform="rotate(-25 15 -13)" fill={c.verde} opacity=".45" />
      <ellipse cx="6" cy="-1" rx="4.5" ry="2.2" transform="rotate(20 6 -1)" fill={c.verde} opacity=".4" />
    </g>
  );
}

/** Anillos entrelazados con ramitas: saludo del inicio. */
export function IllustrationRings(props: IllustrationProps) {
  return (
    <Base {...props}>
      <circle cx="80" cy="62" r="50" fill={c.crema100} />
      <Sprig x={40} y={92} />
      <Sprig x={120} y={92} flip />
      <circle cx="66" cy="66" r="22" stroke={c.oro} strokeWidth="6" />
      <circle cx="94" cy="66" r="22" stroke={c.crema700} strokeWidth="6" />
      <path d="M94 44l-5-6 5-7 5 7z" fill={c.white} stroke={c.crema700} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="40" cy="30" r="2.5" fill={c.oro} />
      <circle cx="124" cy="26" r="2" fill={c.crema400} />
      <circle cx="130" cy="44" r="1.5" fill={c.oro} />
    </Base>
  );
}

/** Sobre con corazón: compartir e invitar. */
export function IllustrationEnvelope(props: IllustrationProps) {
  return (
    <Base {...props}>
      <circle cx="80" cy="62" r="50" fill={c.crema100} />
      <rect x="38" y="40" width="84" height="56" rx="6" fill={c.white} stroke={c.crema400} strokeWidth="2" />
      <path d="M40 44l40 28 40-28" stroke={c.crema400} strokeWidth="2" strokeLinejoin="round" />
      <path d="M80 70c-5-6-14-3-12 4 1 4 12 11 12 11s11-7 12-11c2-7-7-10-12-4z" fill={c.oro} />
      <path d="M120 24l4 4M128 22v6M134 28h-6" stroke={c.crema700} strokeWidth="1.5" strokeLinecap="round" />
    </Base>
  );
}

/** Caja de regalo con moño. */
export function IllustrationGift(props: IllustrationProps) {
  return (
    <Base {...props}>
      <circle cx="80" cy="62" r="50" fill={c.crema100} />
      <rect x="50" y="56" width="60" height="42" rx="4" fill={c.white} stroke={c.crema400} strokeWidth="2" />
      <rect x="44" y="44" width="72" height="14" rx="3" fill={c.crema300} />
      <rect x="75" y="44" width="10" height="54" fill={c.oro} />
      <path d="M80 44c-6-12-22-12-20-2 1 5 20 2 20 2zM80 44c6-12 22-12 20-2-1 5-20 2-20 2z" fill={c.oroSoft} stroke={c.oro} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="36" cy="34" r="2" fill={c.crema700} />
      <circle cx="126" cy="38" r="2.5" fill={c.oro} />
    </Base>
  );
}

/** Dos siluetas con corazón: invitados. */
export function IllustrationGuests(props: IllustrationProps) {
  return (
    <Base {...props}>
      <circle cx="80" cy="62" r="50" fill={c.crema100} />
      <circle cx="62" cy="50" r="12" fill={c.crema300} />
      <path d="M38 98c0-16 10-26 24-26s24 10 24 26z" fill={c.crema300} />
      <circle cx="98" cy="50" r="12" fill={c.crema400} />
      <path d="M74 98c0-16 10-26 24-26s24 10 24 26z" fill={c.crema400} />
      <path d="M80 30c-3-4-9-2-8 2 1 3 8 7 8 7s7-4 8-7c1-4-5-6-8-2z" fill={c.oro} />
    </Base>
  );
}

/** Ventana de navegador con paleta: tema del micrositio. */
export function IllustrationMicrosite(props: IllustrationProps) {
  return (
    <Base {...props}>
      <circle cx="80" cy="62" r="50" fill={c.crema100} />
      <rect x="32" y="30" width="96" height="66" rx="6" fill={c.white} stroke={c.crema400} strokeWidth="2" />
      <path d="M32 42h96" stroke={c.crema400} strokeWidth="2" />
      <circle cx="40" cy="36" r="2" fill={c.crema400} />
      <circle cx="47" cy="36" r="2" fill={c.crema400} />
      <rect x="42" y="50" width="76" height="18" rx="3" fill={c.crema200} />
      <rect x="56" y="74" width="48" height="4" rx="2" fill={c.crema300} />
      <rect x="64" y="82" width="32" height="4" rx="2" fill={c.crema300} />
      <circle cx="118" cy="92" r="14" fill={c.crema50} stroke={c.crema700} strokeWidth="2" />
      <circle cx="113" cy="88" r="2.5" fill={c.oro} />
      <circle cx="121" cy="86" r="2.5" fill={c.verde} />
      <circle cx="123" cy="95" r="2.5" fill={c.navy} />
    </Base>
  );
}

/** Calendario con corazón: cuenta regresiva / fecha. */
export function IllustrationCalendar(props: IllustrationProps) {
  return (
    <Base {...props}>
      <circle cx="80" cy="62" r="50" fill={c.crema100} />
      <rect x="44" y="34" width="72" height="64" rx="6" fill={c.white} stroke={c.crema400} strokeWidth="2" />
      <path d="M44 50h72" stroke={c.crema400} strokeWidth="2" />
      <rect x="44" y="34" width="72" height="16" rx="6" fill={c.crema300} />
      <path d="M60 28v12M100 28v12" stroke={c.crema700} strokeWidth="3" strokeLinecap="round" />
      <path d="M80 70c-5-6-14-3-12 4 1 4 12 11 12 11s11-7 12-11c2-7-7-10-12-4z" fill={c.oro} />
    </Base>
  );
}

/** Fotos apiladas: portada y galería. */
export function IllustrationPhotos(props: IllustrationProps) {
  return (
    <Base {...props}>
      <circle cx="80" cy="62" r="50" fill={c.crema100} />
      <rect x="40" y="38" width="62" height="48" rx="4" transform="rotate(-8 71 62)" fill={c.crema200} stroke={c.crema400} strokeWidth="2" />
      <rect x="58" y="40" width="64" height="50" rx="4" fill={c.white} stroke={c.crema400} strokeWidth="2" />
      <rect x="64" y="46" width="52" height="32" rx="2" fill={c.crema100} />
      <circle cx="76" cy="56" r="4" fill={c.oro} />
      <path d="M64 78l16-14 10 8 10-10 16 16z" fill={c.verde} opacity=".55" />
      <circle cx="132" cy="34" r="2.5" fill={c.oro} />
      <circle cx="30" cy="44" r="2" fill={c.crema700} />
    </Base>
  );
}

/** Globos de diálogo con signo de pregunta: preguntas frecuentes. */
export function IllustrationQuestions(props: IllustrationProps) {
  return (
    <Base {...props}>
      <circle cx="80" cy="62" r="50" fill={c.crema100} />
      <path d="M40 40h52a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H58l-12 10v-10h-6a6 6 0 0 1-6-6V46a6 6 0 0 1 6-6z" fill={c.white} stroke={c.crema400} strokeWidth="2" strokeLinejoin="round" />
      <path d="M58 52a8 8 0 1 1 10 8c-2 1-2 2-2 4M66 70h.01" stroke={c.crema700} strokeWidth="3" strokeLinecap="round" />
      <path d="M104 58h16a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6h-2v8l-10-8h-4a6 6 0 0 1-6-6V64a6 6 0 0 1 6-6z" fill={c.crema300} />
      <circle cx="106" cy="73" r="2" fill={c.white} />
      <circle cx="113" cy="73" r="2" fill={c.white} />
      <circle cx="120" cy="73" r="2" fill={c.white} />
    </Base>
  );
}

/** Percha con moño: dress code. */
export function IllustrationHanger(props: IllustrationProps) {
  return (
    <Base {...props}>
      <circle cx="80" cy="62" r="50" fill={c.crema100} />
      <path d="M80 40v-4a6 6 0 1 1 6-6" stroke={c.crema700} strokeWidth="3" strokeLinecap="round" />
      <path d="M80 40 36 74c-3 2-1 6 2 6h84c3 0 5-4 2-6z" fill={c.white} stroke={c.crema400} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M70 90l10-6 10 6-10 6z" fill={c.oro} />
      <path d="M70 90v8l10-2 10 2v-8" fill={c.oroSoft} />
      <circle cx="122" cy="36" r="2.5" fill={c.oro} />
      <circle cx="38" cy="42" r="2" fill={c.crema700} />
    </Base>
  );
}

/** Campana con destellos: notificaciones. */
export function IllustrationBell(props: IllustrationProps) {
  return (
    <Base {...props}>
      <circle cx="80" cy="62" r="50" fill={c.crema100} />
      <path d="M56 78c4-4 6-10 6-22a18 18 0 0 1 36 0c0 12 2 18 6 22z" fill={c.white} stroke={c.crema400} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M52 80h56" stroke={c.crema700} strokeWidth="3" strokeLinecap="round" />
      <path d="M72 88a8 8 0 0 0 16 0" fill={c.oro} />
      <circle cx="80" cy="36" r="3" fill={c.crema700} />
      <path d="M116 38l6-4M118 50h7M40 50h-7M44 38l-6-4" stroke={c.oro} strokeWidth="2" strokeLinecap="round" />
    </Base>
  );
}
