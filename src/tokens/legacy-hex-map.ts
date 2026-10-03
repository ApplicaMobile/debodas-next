/**
 * Mapeo de los hex hardcodeados en TSX de debodas-next (auditoría + recuento con rg) a tokens.
 * `token` = utilidad/variable a usar. `primitivo` = valor equivalente más cercano.
 */
export interface LegacyHex {
  hex: string;
  usos: number;
  primitivo: string;
  token: string;
  nota: string;
}

export const legacyHexMap: LegacyHex[] = [
  { hex: "#e6dac7", usos: 105, primitivo: "crema-300", token: "bg-brand · surface-brand · action-secondary-bg", nota: "Solo como FONDO. Si está como texto/ícono (1,38:1) → text-accent (crema-700)." },
  { hex: "#06263a", usos: 55, primitivo: "navy-700", token: "text-primary · action-primary-bg · surface-inverse", nota: "Exacto." },
  { hex: "#6f5f47", usos: 44, primitivo: "crema-700", token: "text-accent", nota: "Exacto (6,17:1 sobre blanco)." },
  { hex: "#ebebeb", usos: 14, primitivo: "≈ neutral-200", token: "bg-canvas (fondo de página) · surface-disabled", nota: "Cambio intencional: el fondo gris pasa a crema-50. También escrito #EBEBEB." },
  { hex: "#d4c4a8", usos: 11, primitivo: "crema-400", token: "action-secondary-bg-hover · border-default", nota: "Exacto." },
  { hex: "#25d366", usos: 8, primitivo: "whatsapp-500 (extensión)", token: "brand-whatsapp-bg + texto brand-whatsapp-fg", nota: "Con texto blanco da 1,98:1 → usar texto oscuro (neutral-900)." },
  { hex: "#fff", usos: 6, primitivo: "neutral-0", token: "surface-default · text-inverse", nota: "En las banderas de LanguageSwitcher queda literal." },
  { hex: "#c4a484", usos: 6, primitivo: "≈ crema-500", token: "action-secondary-bg-pressed · chart-4", nota: "En DressCodePanel es un color de paleta elegido por la pareja (dato): puede quedar como valor por defecto." },
  { hex: "#0a3550", usos: 5, primitivo: "navy-600", token: "action-primary-bg-hover", nota: "Exacto." },
  { hex: "#f7f3eb", usos: 4, primitivo: "≈ crema-100", token: "bg-subtle · surface-muted", nota: "Uno de los 6 cremas casi iguales." },
  { hex: "#f5f1e8", usos: 4, primitivo: "crema-100", token: "surface-muted", nota: "Exacto." },
  { hex: "#6cc39e", usos: 3, primitivo: "verde-500", token: "verde-500 (decorativo) · status-success-fg para texto/ícono", nota: "2,11:1: nunca como texto." },
  { hex: "#e91e8c", usos: 2, primitivo: "— (sin equivalente)", token: "chart-5", nota: "Magenta de gráficos admin: se reemplaza por la paleta chart-*." },
  { hex: "#e7e5e4", usos: 2, primitivo: "neutral-200", token: "chart-grid · surface-disabled", nota: "Exacto." },
  { hex: "#dd6b20", usos: 2, primitivo: "≈ ambar-600", token: "chart-7", nota: "Gráficos admin." },
  { hex: "#8a6c31", usos: 2, primitivo: "oro-700", token: "accent-strong", nota: "Exacto (estrellas de reseñas)." },
  { hex: "#7eb8da", usos: 2, primitivo: "azul-500", token: "chart-2", nota: "Exacto." },
  { hex: "#78716c", usos: 2, primitivo: "≈ neutral-500", token: "text-tertiary · chart-axis", nota: "neutral-500 (#716A64) sube a 5,3:1." },
  { hex: "#fbf9f5", usos: 1, primitivo: "crema-50", token: "bg-canvas", nota: "Exacto." },
  { hex: "#f7f4ef", usos: 1, primitivo: "≈ crema-50", token: "bg-canvas", nota: "Loading del micrositio." },
  { hex: "#f7f1e8", usos: 1, primitivo: "≈ crema-100", token: "surface-muted", nota: "" },
  { hex: "#f5f1ea", usos: 1, primitivo: "≈ crema-100", token: "surface-muted", nota: "" },
  { hex: "#f4edcc", usos: 1, primitivo: "≈ oro-200", token: "surface-muted (o accent-subtle)", nota: "Fondo amarillento del sidebar: se recomienda crema-100." },
  { hex: "#ba9c5f", usos: 1, primitivo: "≈ oro-500", token: "accent-strong (texto)", nota: "Como texto daba 2,62:1; oro-700 da 4,92:1." },
  { hex: "#805ad5", usos: 1, primitivo: "— (sin equivalente)", token: "chart-6", nota: "Violeta de gráficos." },
  { hex: "#57534e", usos: 1, primitivo: "neutral-600", token: "text-secondary", nota: "Exacto." },
  { hex: "#4a5568", usos: 1, primitivo: "≈ navy-400", token: "chart-8", nota: "Gráficos." },
  { hex: "#2b6cb0", usos: 1, primitivo: "≈ azul-600", token: "chart-2 · text-link", nota: "" },
  { hex: "#1ebe57", usos: 1, primitivo: "whatsapp-600 (extensión)", token: "brand-whatsapp-bg-hover", nota: "Hover del botón WhatsApp." },
  { hex: "#1e3a5f", usos: 1, primitivo: "≈ navy-600", token: "chart-1", nota: "Serie 'altas' en gráficos." },
  { hex: "#128c7e", usos: 1, primitivo: "whatsapp-700 (extensión)", token: "brand-whatsapp-text", nota: "#128c7e da 4,14:1 (no pasa AA); se usa #075E54 (7,6:1)." },
  { hex: "#74acdf", usos: 1, primitivo: "— bandera AR", token: "literal (excepción)", nota: "Colores de banderas: identidad de terceros, no tokens." },
  { hex: "#f6b40e", usos: 1, primitivo: "— bandera AR", token: "literal (excepción)", nota: "" },
  { hex: "#009b3a", usos: 1, primitivo: "— bandera BR", token: "literal (excepción)", nota: "" },
  { hex: "#fedd00", usos: 1, primitivo: "— bandera BR", token: "literal (excepción)", nota: "" },
  { hex: "#002776", usos: 1, primitivo: "— bandera BR", token: "literal (excepción)", nota: "" },
  { hex: "#bf0a30", usos: 1, primitivo: "— bandera US", token: "literal (excepción)", nota: "" },
  { hex: "#002868", usos: 1, primitivo: "— bandera US", token: "literal (excepción)", nota: "" },
];
