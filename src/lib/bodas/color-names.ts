/** Paleta de nombres en español para sugerir al elegir un hex en dress code. */

const NAMED_COLORS: Array<{ name: string; hex: string }> = [
  { name: "Blanco", hex: "#FFFFFF" },
  { name: "Marfil", hex: "#FFFFF0" },
  { name: "Crema", hex: "#FFFDD0" },
  { name: "Champagne", hex: "#C4A484" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Arena", hex: "#C2B280" },
  { name: "Taupe", hex: "#8B7355" },
  { name: "Camel", hex: "#C19A6B" },
  { name: "Marrón", hex: "#5C4033" },
  { name: "Chocolate", hex: "#3D2B1F" },
  { name: "Negro", hex: "#1C1C1C" },
  { name: "Gris", hex: "#808080" },
  { name: "Gris claro", hex: "#D3D3D3" },
  { name: "Gris oscuro", hex: "#4A4A4A" },
  { name: "Plata", hex: "#C0C0C0" },
  { name: "Dorado", hex: "#D4AF37" },
  { name: "Mostaza", hex: "#E1AD01" },
  { name: "Amarillo", hex: "#F4D35E" },
  { name: "Durazno", hex: "#FFCBA4" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Salmón", hex: "#FA8072" },
  { name: "Terracota", hex: "#E2725B" },
  { name: "Rojo", hex: "#C0392B" },
  { name: "Bordó", hex: "#800020" },
  { name: "Rosa", hex: "#F4C2C2" },
  { name: "Rosa viejo", hex: "#C08081" },
  { name: "Fucsia", hex: "#FF00AA" },
  { name: "Lila", hex: "#C8A2C8" },
  { name: "Lavanda", hex: "#E6E6FA" },
  { name: "Violeta", hex: "#7B68EE" },
  { name: "Morado", hex: "#6B3FA0" },
  { name: "Azul cielo", hex: "#87CEEB" },
  { name: "Celeste", hex: "#AAD4E8" },
  { name: "Azul", hex: "#31488C" },
  { name: "Azul marino", hex: "#1B2A4A" },
  { name: "Azul petróleo", hex: "#0E4D64" },
  { name: "Verde menta", hex: "#98D8C8" },
  { name: "Verde sage", hex: "#9CAF88" },
  { name: "Oliva", hex: "#808000" },
  { name: "Verde", hex: "#2E8B57" },
  { name: "Verde oscuro", hex: "#2F4F4F" },
  { name: "Esmeralda", hex: "#046307" },
  { name: "Turquesa", hex: "#40E0D0" },
];

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9A-Fa-f]{6}$/.test(full)) {
    return null;
  }
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

/** Nombre sugerido en español para un hex (el más cercano de la paleta). */
export function suggestColorName(hex: string): string {
  const rgb = parseHexRgb(hex);
  if (!rgb) {
    return hex.trim() || "Color";
  }

  let bestName = NAMED_COLORS[0].name;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const entry of NAMED_COLORS) {
    const entryRgb = parseHexRgb(entry.hex);
    if (!entryRgb) continue;
    const distance = colorDistance(rgb, entryRgb);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestName = entry.name;
    }
  }

  return bestName;
}

const KNOWN_NAMES = new Set(
  NAMED_COLORS.map((entry) => entry.name.toLowerCase()),
);

/** True si el nombre es vacío, igual al hex, o un nombre sugerido (auto-reemplazable). */
export function isAutoColorName(name: string, hex: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;
  if (trimmed.toLowerCase() === hex.trim().toLowerCase()) return true;
  if (KNOWN_NAMES.has(trimmed.toLowerCase())) return true;
  return trimmed === suggestColorName(hex);
}
