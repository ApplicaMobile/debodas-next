import type { Metadata } from "next";
import { Colors } from "./_guide/Colors";
import { SpacingRadiusShadows, Typography } from "./_guide/Foundations";
import { Buttons, Cards, Feedback, Forms } from "./_guide/Components";
import { PlanExample } from "./_guide/PlanExample";
import { LegacyHex } from "./_guide/LegacyHex";

/**
 * Guía de estilos interna del sistema de diseño.
 * No está enlazada desde la navegación y no se indexa.
 */
export const metadata: Metadata = {
  title: "Sistema de diseño",
  description:
    "Guía de estilos viva de DeBodas: tokens, tipografía y componentes accesibles.",
  robots: { index: false, follow: false },
};

const nav = [
  ["colores", "Color"],
  ["tipografia", "Tipografía"],
  ["espaciado", "Espaciado"],
  ["botones", "Botón"],
  ["formularios", "Formularios"],
  ["badges", "Badges y avisos"],
  ["cards", "Cards"],
  ["plan-ejemplo", "Ejemplo: plan"],
  ["migracion", "Migración"],
] as const;

export default function StyleGuidePage() {
  return (
    <div className="bg-bg-canvas text-text-primary">
      <a
        href="#contenido"
        className="focus-ring sr-only rounded-full bg-action-primary-bg px-6 py-3 type-button text-action-primary-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Saltar al contenido
      </a>
      <header className="bg-surface-inverse text-text-inverse">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-20">
          <p className="type-overline text-text-accent-on-inverse">DeBodas · Guía de estilos viva · v0.1</p>
          <h1 className="mt-3 type-h1 sm:type-display-xl">Sistema de diseño</h1>
          <p className="mt-4 max-w-2xl type-body-lg text-text-inverse-muted">
            Tokens, tipografía y componentes accesibles para el sitio de bodas, la lista de regalos y el RSVP.
            Todo sale de las variables de Figma y cumple WCAG AA.
          </p>
          <nav aria-label="Secciones de la guía" className="mt-8">
            <ul role="list" className="flex flex-wrap gap-2">
              {nav.map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="focus-ring inline-flex min-h-11 items-center rounded-full border border-border-inverse px-4 py-2 type-button-sm text-text-inverse transition-colors hover:bg-action-primary-bg-hover"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="contenido" className="mx-auto max-w-6xl px-4 sm:px-8">
        <Colors />
        <Typography />
        <SpacingRadiusShadows />
        <Buttons />
        <Forms />
        <Feedback />
        <Cards />
        <PlanExample />
        <LegacyHex />
      </main>
      <footer className="border-t border-border-subtle bg-bg-subtle">
        <div className="mx-auto max-w-6xl px-4 py-8 type-body-sm text-text-secondary sm:px-8">
          debodas-design-system · Next.js 16 + Tailwind CSS v4 · Fuente de verdad: variables de Figma.
        </div>
      </footer>
    </div>
  );
}
