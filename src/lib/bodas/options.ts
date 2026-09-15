export function optionEnabled(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

export function parseBodaOptions(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as Record<string, unknown>;
}

export function allowsFreeGiftAmount(options: unknown): boolean {
  return optionEnabled(parseBodaOptions(options).free_mount);
}

export function hidesGiftList(options: unknown): boolean {
  return optionEnabled(parseBodaOptions(options).hide_gifts_list);
}
