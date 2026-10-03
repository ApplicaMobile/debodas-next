import { primitives, semanticHex, cssVar } from "@/tokens";
import { contrastRatio, formatRatio, wcagLevel } from "@/lib/contrast";
import { Section, SubTitle, Spec } from "./Section";

const WHITE = primitives.neutral["0"];
const NAVY = primitives.navy["700"];

const familyNames: Record<string, string> = {
  crema: "Crema (marca)",
  oro: "Oro (acento)",
  navy: "Navy (texto y acción)",
  neutral: "Neutral",
  verde: "Verde (éxito)",
  ambar: "Ámbar (aviso)",
  rojo: "Rojo (error)",
  azul: "Azul (info y foco)",
  whatsapp: "WhatsApp (extensión, no está en Figma)",
};

/** Pares texto/fondo documentados en Figma ("Tokens semánticos y contraste"). */
const pairs: { fg: string; bg: string; uso: string }[] = [
  { fg: "text/primary", bg: "bg/canvas", uso: "Texto principal" },
  { fg: "text/secondary", bg: "bg/canvas", uso: "Descripciones" },
  { fg: "text/tertiary", bg: "surface/default", uso: "Metadatos" },
  { fg: "text/accent", bg: "surface/default", uso: "Acento cálido como texto" },
  { fg: "text/on-brand", bg: "surface/brand", uso: "Texto sobre beige (el beige es FONDO)" },
  { fg: "text/inverse", bg: "surface/inverse", uso: "Texto sobre navy" },
  { fg: "text/accent-on-inverse", bg: "surface/inverse", uso: "Dorado sobre navy" },
  { fg: "text/link", bg: "surface/default", uso: "Links subrayados" },
  { fg: "accent/strong", bg: "surface/default", uso: "Dorado como texto" },
  { fg: "action/primary/fg", bg: "action/primary/bg", uso: "Botón primario" },
  { fg: "action/secondary/fg", bg: "action/secondary/bg", uso: "Botón secundario" },
  { fg: "action/secondary/fg", bg: "action/secondary/bg-pressed", uso: "Secundario presionado" },
  { fg: "action/ghost/fg", bg: "action/ghost/bg-pressed", uso: "Botón fantasma" },
  { fg: "action/danger/fg", bg: "action/danger/bg", uso: "Botón peligro" },
  { fg: "status/success/fg", bg: "status/success/bg", uso: "Aprobado / éxito" },
  { fg: "status/warning/fg", bg: "status/warning/bg", uso: "Pendiente / aviso" },
  { fg: "status/error/fg", bg: "status/error/bg", uso: "Rechazado / error" },
  { fg: "status/info/fg", bg: "status/info/bg", uso: "Información" },
  { fg: "plan/free/fg", bg: "plan/free/bg", uso: "Plan Free" },
  { fg: "plan/basico/fg", bg: "plan/basico/bg", uso: "Plan Básico" },
  { fg: "plan/premium/fg", bg: "plan/premium/bg", uso: "Plan Premium" },
  { fg: "plan/recomendado/fg", bg: "plan/recomendado/bg", uso: "Recomendado" },
  { fg: "brand-whatsapp/fg", bg: "brand-whatsapp/bg", uso: "Botón WhatsApp (extensión)" },
  { fg: "brand-whatsapp/text", bg: "surface/default", uso: "Link WhatsApp (extensión)" },
];

/** Pares de UI (no texto): requieren 3:1. */
const uiPairs: { fg: string; bg: string; uso: string }[] = [
  { fg: "focus/ring", bg: "bg/canvas", uso: "Anillo de foco" },
  { fg: "border/strong", bg: "surface/default", uso: "Borde de inputs" },
];

function LevelTag({ ratio, ui = false }: { ratio: number; ui?: boolean }) {
  const level = ui ? (ratio >= 3 ? "UI ≥ 3:1" : "No pasa") : wcagLevel(ratio);
  const ok = ui ? ratio >= 3 : ratio >= 4.5;
  return (
    <span className={ok ? "type-caption font-semibold text-status-success-fg" : "type-caption font-semibold text-status-error-fg"}>
      {level}
    </span>
  );
}

export function Colors() {
  return (
    <Section
      id="colores"
      overline="Fundamentos"
      title="Color"
      lead={
        <>
          Primitivos (<Spec>--color-crema-300</Spec>, alias <Spec>--debodas-crema-300</Spec>) y semánticos (
          <Spec>--color-text-primary</Spec> → <Spec>text-text-primary</Spec>). En los componentes se usan solo los
          semánticos. Los ratios se calculan con la fórmula WCAG 2.x.
        </>
      }
    >
      <div role="note" className="mb-10 rounded-md border-l-4 border-status-error-border bg-status-error-bg p-4 type-body-sm text-status-error-fg">
        <strong>Prohibido:</strong> el beige de marca <Spec>crema-300 #E6DAC7</Spec> como texto o ícono sobre blanco
        ({formatRatio(contrastRatio(primitives.crema["300"], WHITE))}). Es solo fondo. Para texto cálido usá{" "}
        <Spec>text-accent</Spec> (crema-700) o <Spec>text-on-brand</Spec>.
      </div>

      <SubTitle>Primitivos</SubTitle>
      <div className="flex flex-col gap-8">
        {Object.entries(primitives).map(([fam, steps]) => (
          <div key={fam}>
            <p className="mb-3 type-label text-text-primary">{familyNames[fam] ?? fam}</p>
            <ul role="list" className="grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-3">
              {Object.entries(steps).map(([step, hex]) => {
                const onWhite = contrastRatio(hex, WHITE);
                const onNavy = contrastRatio(hex, NAVY);
                return (
                  <li key={step} className="overflow-hidden rounded-md border border-border-subtle bg-surface-default">
                    <div className="h-16" style={{ backgroundColor: `var(--color-${fam}-${step})` }} aria-hidden="true" />
                    <div className="flex flex-col gap-1 p-2">
                      <span className="type-caption font-semibold text-text-primary">{fam}-{step}</span>
                      <span className="font-mono text-xs text-text-secondary">{hex}</span>
                      <span className="type-caption text-text-secondary" title="Contraste como texto sobre blanco / sobre navy-700">
                        <span className="sr-only">Contraste sobre blanco </span>□ {onWhite.toFixed(2)}
                        <span className="sr-only">, sobre navy </span> ■ {onNavy.toFixed(2)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <p className="type-body-sm text-text-secondary">
          □ = contraste sobre blanco · ■ = contraste sobre navy-700. Valores ≥ 4,5 sirven para texto normal.
        </p>
      </div>

      <SubTitle>Pares semánticos de texto (todos AA)</SubTitle>
      <ul role="list" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pairs.map(({ fg, bg, uso }) => {
          const ratio = contrastRatio(semanticHex(fg), semanticHex(bg));
          return (
            <li key={fg + bg} className="flex overflow-hidden rounded-md border border-border-subtle bg-surface-default">
              <div
                className="flex w-28 shrink-0 items-center justify-center type-h4"
                style={{ backgroundColor: `var(${cssVar(bg)})`, color: `var(${cssVar(fg)})` }}
                aria-hidden="true"
              >
                Aa
              </div>
              <div className="flex min-w-0 flex-col gap-1 p-3">
                <span className="type-caption font-semibold text-text-primary break-words">{fg.replace(/\//g, "-")}</span>
                <span className="type-caption text-text-secondary break-words">sobre {bg.replace(/\//g, "-")}</span>
                <span className="type-caption text-text-secondary">
                  {semanticHex(fg)} / {semanticHex(bg)}
                </span>
                <span className="flex items-center gap-2">
                  <span className="type-label tabular-nums text-text-primary">{formatRatio(ratio)}</span>
                  <LevelTag ratio={ratio} />
                </span>
                <span className="type-caption text-text-secondary">{uso}</span>
              </div>
            </li>
          );
        })}
        {uiPairs.map(({ fg, bg, uso }) => {
          const ratio = contrastRatio(semanticHex(fg), semanticHex(bg));
          return (
            <li key={fg + bg} className="flex overflow-hidden rounded-md border border-border-subtle bg-surface-default">
              <div className="flex w-28 shrink-0 items-center justify-center" style={{ backgroundColor: `var(${cssVar(bg)})` }} aria-hidden="true">
                <span className="size-10 rounded-md border-4" style={{ borderColor: `var(${cssVar(fg)})` }} />
              </div>
              <div className="flex flex-col gap-1 p-3">
                <span className="type-caption font-semibold text-text-primary">{fg.replace(/\//g, "-")}</span>
                <span className="type-caption text-text-secondary">sobre {bg.replace(/\//g, "-")}</span>
                <span className="flex items-center gap-2">
                  <span className="type-label tabular-nums text-text-primary">{formatRatio(ratio)}</span>
                  <LevelTag ratio={ratio} ui />
                </span>
                <span className="type-caption text-text-secondary">{uso} (componente de UI)</span>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
