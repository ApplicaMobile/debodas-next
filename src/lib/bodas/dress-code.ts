export interface DressCodeColor {
  hex: string;
  name: string;
}

export interface DressCodeContent {
  caballeros: string;
  damas: string;
  colors: DressCodeColor[];
}

const EMPTY: DressCodeContent = {
  caballeros: "",
  damas: "",
  colors: [],
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

export function getDressCode(
  misc: Record<string, unknown> | null | undefined,
): DressCodeContent {
  const raw = misc?.dress_code;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY, colors: [] };
  }

  const data = raw as Record<string, unknown>;
  const colorsRaw = Array.isArray(data.colors) ? data.colors : [];
  const colors = colorsRaw
    .map(normalizeDressCodeColor)
    .filter((c): c is DressCodeColor => c !== null);

  return {
    caballeros: String(data.caballeros ?? "").trim(),
    damas: String(data.damas ?? "").trim(),
    colors,
  };
}

export function hasDressCodeContent(dressCode: DressCodeContent): boolean {
  return Boolean(
    dressCode.caballeros || dressCode.damas || dressCode.colors.length,
  );
}

export function parseDressCodeFromForm(formData: FormData): DressCodeContent {
  const colors: DressCodeColor[] = [];
  for (let i = 0; i < 12; i++) {
    const hex = String(formData.get(`color_hex_${i}`) ?? "").trim();
    const name = String(formData.get(`color_name_${i}`) ?? "").trim();
    if (!hex) {
      continue;
    }
    const normalized = hex.startsWith("#") ? hex : `#${hex}`;
    if (!isHexColor(normalized)) {
      continue;
    }
    colors.push({ hex: normalized, name: name || normalized });
  }

  return {
    caballeros: String(formData.get("caballeros") ?? "").trim(),
    damas: String(formData.get("damas") ?? "").trim(),
    colors,
  };
}
