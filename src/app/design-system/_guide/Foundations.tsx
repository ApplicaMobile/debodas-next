import { radius, shadows, spacing, typography } from "@/tokens";
import { Section, SubTitle, Spec } from "./Section";

// Clases literales para que Tailwind las detecte (no se arman dinámicamente).
const typeClass: Record<string, string> = {
  "display-xl": "type-display-xl",
  h1: "type-h1",
  h2: "type-h2",
  h3: "type-h3",
  h4: "type-h4",
  "body-lg": "type-body-lg",
  body: "type-body",
  "body-sm": "type-body-sm",
  caption: "type-caption",
  label: "type-label",
  button: "type-button",
  "button-sm": "type-button-sm",
  overline: "type-overline",
};
const radiusClass: Record<string, string> = { sm: "rounded-sm", md: "rounded-md", full: "rounded-full" };
const radiusUso: Record<string, string> = {
  sm: "Checkbox, badges de estado, tooltips",
  md: "Cards, inputs, modales",
  full: "Botones (pill), switch, badges de plan",
};
const shadowClass: Record<string, string> = {
  "elevation-1": "shadow-elevation-1",
  "elevation-2": "shadow-elevation-2",
  "elevation-3": "shadow-elevation-3",
};
const spacingUso: Record<string, string> = {
  "1": "Gap ícono–texto",
  "2": "Gap interno chico",
  "3": "Padding vertical de inputs",
  "4": "Padding de botones md, gap de campos",
  "5": "Padding horizontal de botones lg",
  "6": "Padding de cards",
  "8": "Gap entre bloques",
  "10": "Separación de grupos",
  "12": "Separación de secciones (mobile)",
  "16": "Separación de secciones",
  "20": "Márgenes de página desktop",
};

export function Typography() {
  return (
    <Section
      id="tipografia"
      overline="Fundamentos"
      title="Tipografía"
      lead="Playfair Display para lo editorial (display y títulos); Montserrat para leer y operar. Base de 16px y nada por debajo de 12px."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md bg-surface-inverse p-6 text-text-inverse">
          <p className="type-display-xl text-text-accent-on-inverse" aria-hidden="true">Aa</p>
          <p className="mt-2 type-h4">Playfair Display</p>
          <p className="type-body-sm text-text-inverse-muted">Display y títulos · Regular 400, Medium 500 · <Spec>font-serif</Spec></p>
        </div>
        <div className="rounded-md bg-surface-brand p-6 text-text-on-brand">
          <p className="font-sans text-display-xl" aria-hidden="true">Aa</p>
          <p className="mt-2 type-h4 font-sans font-semibold">Montserrat</p>
          <p className="type-body-sm">Cuerpo e interfaz · Regular 400, Medium 500, SemiBold 600 · <Spec>font-sans</Spec></p>
        </div>
      </div>

      <SubTitle>Escala tipográfica (13 estilos)</SubTitle>
      <div className="divide-y divide-border-subtle rounded-md border border-border-subtle bg-surface-default">
        {typography.map((t) => (
          <div key={t.token} className="grid gap-3 p-4 sm:p-6 md:grid-cols-[16rem_1fr] md:items-center md:gap-8">
            <div className="flex flex-col gap-1">
              <span className="type-label text-text-primary">{t.figma}</span>
              <span className="type-caption text-text-secondary">
                {t.family === "serif" ? "Playfair Display" : "Montserrat"} {t.weight} · {t.size}/{t.lineHeight}
                {t.tracking ? ` · ${t.tracking > 0 ? "+" : ""}${+(t.tracking * 100).toFixed(1)}%` : ""}
                {t.uppercase ? " · MAYÚSCULAS" : ""}
              </span>
              <span className="type-caption text-text-secondary">
                <Spec>{typeClass[t.token]}</Spec> · {t.uso}
              </span>
            </div>
            <p className={`${typeClass[t.token]} min-w-0 break-words text-text-primary`}>{t.ejemplo}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 type-body-sm text-text-secondary">
        <Spec>type-*</Spec> aplica familia, tamaño, interlineado, peso, tracking y mayúsculas. <Spec>text-h1</Spec> (sin familia) también existe.
        La escala de Tailwind (<Spec>text-sm</Spec>, <Spec>text-xs</Spec>…) sigue disponible para no romper la app actual.
      </p>
    </Section>
  );
}

export function SpacingRadiusShadows() {
  return (
    <Section
      id="espaciado"
      overline="Fundamentos"
      title="Espaciado, radios y elevación"
      lead="Escala de 4px, tres radios y tres niveles de sombra tintados con navy (nunca negro puro)."
    >
      <SubTitle>Espaciado</SubTitle>
      <ul role="list" className="flex flex-col gap-2 rounded-md border border-border-subtle bg-surface-default p-4 sm:p-6">
        {Object.entries(spacing)
          .filter(([k]) => k !== "0")
          .map(([k, px]) => (
            <li key={k} className="grid grid-cols-[6rem_3rem_1fr] items-center gap-3 sm:grid-cols-[8rem_4rem_6rem_1fr]">
              <span className="type-label text-text-primary">spacing-{k}</span>
              <span className="type-body-sm tabular-nums text-text-secondary">{px}px</span>
              <span className="hidden sm:block">
                <span className="block h-3 rounded-sm bg-accent-default" style={{ width: `var(--spacing-${k})` }} aria-hidden="true" />
              </span>
              <span className="type-body-sm text-text-secondary">{spacingUso[k]}</span>
            </li>
          ))}
      </ul>

      <SubTitle>Radios</SubTitle>
      <ul role="list" className="grid gap-6 sm:grid-cols-3">
        {Object.entries(radius).map(([k, px]) => (
          <li key={k} className="flex flex-col gap-2">
            <div className={`${radiusClass[k]} h-24 border border-border-default bg-surface-brand`} aria-hidden="true" />
            <span className="type-label text-text-primary">radius-{k} · {k === "full" ? "9999px (pill)" : `${px}px`}</span>
            <span className="type-body-sm text-text-secondary"><Spec>{radiusClass[k]}</Spec> · {radiusUso[k]}</span>
          </li>
        ))}
      </ul>

      <SubTitle>Elevación</SubTitle>
      <ul role="list" className="grid gap-6 sm:grid-cols-3">
        {Object.entries(shadows).map(([k, s]) => (
          <li key={k} className={`${shadowClass[k]} rounded-md bg-surface-default p-6`}>
            <p className="type-h4 text-text-primary">{k.replace("elevation-", "Elevación/")}</p>
            <p className="mt-1 type-body-sm text-text-secondary">{s.uso}</p>
            <p className="mt-3 type-caption text-text-secondary"><Spec>{shadowClass[k]}</Spec></p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
