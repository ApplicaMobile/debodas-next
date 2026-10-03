// Genera src/styles/tokens.css a partir de src/tokens/tokens.json.
// Uso: node scripts/build-tokens.mjs
import { readFileSync, writeFileSync } from "node:fs";

const t = JSON.parse(readFileSync(new URL("../src/tokens/tokens.json", import.meta.url)));
const kebab = (s) => s.replace(/\//g, "-");
const rem = (px) => `${+(px / 16).toFixed(4)}rem`;
const L = [];
const p = (s = "") => L.push(s);

p("/*");
p(" * debodas — Design tokens (Tailwind CSS v4)");
p(" * ARCHIVO GENERADO por scripts/build-tokens.mjs desde src/tokens/tokens.json. No editar a mano.");
p(" * Fuente de verdad: variables de Figma (Primitivos, Color, Espaciado y radios) + estilos de texto/elevación.");
p(" *");
p(" * Uso: en globals.css, después de `@import \"tailwindcss\";` agregar `@import \"../styles/tokens.css\";`");
p(" * Clases resultantes: bg-surface-default, text-text-primary, border-border-strong, bg-action-primary-bg,");
p(" * text-h1, type-h1, p-6, rounded-md, shadow-elevation-1, etc.");
p(" */");
p();
p("@theme static {");
p("  /* ---------- Color · Primitivos (colección Figma \"Primitivos\") ---------- */");
for (const [fam, steps] of Object.entries(t.primitives)) {
  for (const [k, hex] of Object.entries(steps)) p(`  --color-${fam}-${k}: ${hex};`);
  p();
}
p("  /* ---------- Color · Semánticos (colección Figma \"Color\", modo Light) ---------- */");
for (const [name, ref] of t.semantic) p(`  --color-${kebab(name)}: var(--color-${kebab(ref)});`);
p();
p("  /* Compatibilidad con las utilidades existentes de la app (bg-background / text-foreground) */");
p("  --color-background: var(--color-bg-canvas);");
p("  --color-foreground: var(--color-text-primary);");
p();
p("  /* ---------- Espaciado (base 4px; Tailwind multiplica --spacing) ---------- */");
p("  --spacing: 0.25rem;");
for (const [k, v] of Object.entries(t.spacing)) p(`  --spacing-${k}: ${v === 0 ? "0px" : rem(v)}; /* ${v}px */`);
p();
p("  /* ---------- Radios: sm (chicos), md (contenedores e inputs), full (pill) ---------- */");
for (const [k, v] of Object.entries(t.radius)) p(`  --radius-${k}: ${k === "full" ? "9999px" : rem(v)}; /* ${v}px */`);
p();
p("  /* ---------- Elevación: sombras tintadas con navy/700 (nunca negro puro) ---------- */");
for (const [k, s] of Object.entries(t.shadows)) {
  const layers = s.layers
    .map(([x, y, b, sp, a]) => `${x}px ${y}px ${b}px ${sp}px color-mix(in srgb, var(--color-navy-700) ${a}%, transparent)`)
    .join(", ");
  p(`  --shadow-${k}: ${layers}; /* ${s.uso} */`);
}
p();
p("  /* ---------- Escala tipográfica (13 estilos de texto de Figma) ---------- */");
p("  /* text-<token> aplica tamaño + interlineado + tracking + peso. type-<token> suma familia y mayúsculas. */");
for (const s of t.typography) {
  p(`  --text-${s.token}: ${rem(s.size)}; /* ${s.figma} · ${s.size}/${s.lineHeight} */`);
  p(`  --text-${s.token}--line-height: ${rem(s.lineHeight)};`);
  if (s.tracking) p(`  --text-${s.token}--letter-spacing: ${s.tracking}em;`);
  p(`  --text-${s.token}--font-weight: ${s.weight};`);
}
p("}");
p();
p("/* Familias: next/font define --font-montserrat y --font-playfair en <html>. */");
p("@theme inline {");
p("  --font-sans: var(--font-montserrat), \"Montserrat\", ui-sans-serif, system-ui, sans-serif;");
p("  --font-serif: var(--font-playfair), \"Playfair Display\", Georgia, serif;");
p("}");
p();
p("/* Estilos de texto completos (equivalen 1:1 a los estilos de Figma) */");
for (const s of t.typography) {
  p(`@utility type-${s.token} {`);
  p(`  font-family: var(--font-${s.family});`);
  p(`  font-size: var(--text-${s.token});`);
  p(`  line-height: var(--text-${s.token}--line-height);`);
  p(`  font-weight: var(--text-${s.token}--font-weight);`);
  if (s.tracking) p(`  letter-spacing: var(--text-${s.token}--letter-spacing);`);
  if (s.uppercase) p("  text-transform: uppercase;");
  p("}");
}
p();
p("/* Anillo de foco de Figma: 2px offset blanco + 2px azul (focus/ring). El outline mantiene el foco visible");
p("   en modo de alto contraste de Windows. data-demo-focus solo se usa en la guía de estilos. */");
p("@utility focus-ring {");
p("  &:focus-visible, &[data-demo-focus] {");
p("    outline: 2px solid var(--color-focus-ring);");
p("    outline-offset: 2px;");
p("    box-shadow: 0 0 0 2px var(--color-focus-offset);");
p("  }");
p("}");
p();
p("/* Alias de compatibilidad: nombres viejos de globals.css y codeSyntax de los primitivos en Figma */");
p(":root {");
p("  --background: var(--color-bg-canvas); /* antes #ebebeb */");
p("  --foreground: var(--color-text-primary); /* antes #2d2d2d */");
p("  --debodas-accent: var(--color-crema-300); /* #e6dac7 · SOLO fondo */");
p("  --debodas-accent-hover: var(--color-crema-400); /* #d4c4a8 */");
p("  --debodas-accent-fg: var(--color-crema-900); /* #3f3a32 */");
p("  --debodas-accent-text: var(--color-crema-700); /* #6f5f47 */");
p("  --debodas-green: var(--color-verde-500); /* #6cc39e · decorativo, no para texto */");
p("  --debodas-cream: var(--color-crema-300); /* antes #ded4c5 (sin uso) */");
p("  --debodas-dark: var(--color-navy-700); /* #06263a */");
for (const [fam, steps] of Object.entries(t.primitives))
  for (const k of Object.keys(steps)) p(`  --debodas-${fam}-${k}: var(--color-${fam}-${k});`);
p("}");
p();
p("/* Foco global (reemplaza el outline navy de 3px de la app; nadie debería usar outline-none sin reemplazo) */");
p("@layer base {");
p("  :where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {");
p("    outline: 2px solid var(--color-focus-ring);");
p("    outline-offset: 2px;");
p("  }");
p("}");
writeFileSync(new URL("../src/styles/tokens.css", import.meta.url), L.join("\n") + "\n");
console.log("tokens.css generado:", L.length, "líneas");
