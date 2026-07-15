export interface DressCodeColor {
  hex: string;
  name: string;
}

export interface DressCodeContent {
  caballeros: string;
  damas: string;
  colors_damas: DressCodeColor[];
  colors_caballeros: DressCodeColor[];
}

const EMPTY: DressCodeContent = {
  caballeros: "",
  damas: "",
  colors_damas: [],
  colors_caballeros: [],
};

function isHexColor(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value);
}

export function normalizeDressCodeColor(
  raw: unknown,
): DressCodeColor | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const hex = String(item.hex ?? "").trim();
  const name = String(item.name ?? "").trim();
  if (!hex || !isHexColor(hex)) {
    return null;
  }
  return { hex, name: name || hex };
}

function parseColorList(raw: unknown): DressCodeColor[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map(normalizeDressCodeColor)
    .filter((c): c is DressCodeColor => c !== null);
}

export function getDressCode(
  misc: Record<string, unknown> | null | undefined,
): DressCodeContent {
  const raw = misc?.dress_code;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ...EMPTY,
      colors_damas: [],
      colors_caballeros: [],
    };
  }

  const data = raw as Record<string, unknown>;

  // Compat: `colors` antiguo → damas
  const colorsDamas = parseColorList(
    data.colors_damas ?? data.colors,
  );
  const colorsCaballeros = parseColorList(data.colors_caballeros);

  return {
    caballeros: String(data.caballeros ?? "").trim(),
    damas: String(data.damas ?? "").trim(),
    colors_damas: colorsDamas,
    colors_caballeros: colorsCaballeros,
  };
}

export function hasDressCodeContent(dressCode: DressCodeContent): boolean {
  return Boolean(
    dressCode.caballeros ||
      dressCode.damas ||
      dressCode.colors_damas.length ||
      dressCode.colors_caballeros.length,
  );
}

function parseColorsFromForm(
  formData: FormData,
  prefix: "damas" | "caballeros",
): DressCodeColor[] {
  const colors: DressCodeColor[] = [];
  for (let i = 0; i < 12; i++) {
    const hex = String(formData.get(`${prefix}_color_hex_${i}`) ?? "").trim();
    const name = String(
      formData.get(`${prefix}_color_name_${i}`) ?? "",
    ).trim();
    if (!hex) {
      continue;
    }
    const normalized = hex.startsWith("#") ? hex : `#${hex}`;
    if (!isHexColor(normalized)) {
      continue;
    }
    colors.push({ hex: normalized, name: name || normalized });
  }
  return colors;
}

export function parseDressCodeFromForm(formData: FormData): DressCodeContent {
  return {
    caballeros: String(formData.get("caballeros") ?? "").trim(),
    damas: String(formData.get("damas") ?? "").trim(),
    colors_damas: parseColorsFromForm(formData, "damas"),
    colors_caballeros: parseColorsFromForm(formData, "caballeros"),
  };
}
