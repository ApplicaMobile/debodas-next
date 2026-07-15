export const SCHEDULE_ICON_KEYS = [
  "anillos",
  "plato",
  "copas",
  "musica",
] as const;

export type ScheduleIconKey = (typeof SCHEDULE_ICON_KEYS)[number];

export const SCHEDULE_ICON_OPTIONS: Array<{
  value: ScheduleIconKey;
  label: string;
}> = [
  { value: "anillos", label: "Ceremonia (anillos)" },
  { value: "plato", label: "Banquete (plato)" },
  { value: "copas", label: "Brindis (copas)" },
  { value: "musica", label: "Fiesta (música)" },
];

const ICON_SET = new Set<string>(SCHEDULE_ICON_KEYS);

/** Temas con SVG propios; el resto usan fallback. */
const THEMES_WITH_OWN_ICONS = new Set(["flores", "hojas", "manantial"]);

const ICONS_FALLBACK: Record<string, string> = {
  base: "hojas",
  marfil: "hojas",
  "mariposas-azules": "hojas",
  "marco-verde": "hojas",
  "marco-blanco": "flores",
  "marco-flores-inferiores": "hojas",
};

export function isScheduleIconKey(value: string): value is ScheduleIconKey {
  return ICON_SET.has(value);
}

export function sanitizeScheduleIcon(
  value: string | null | undefined,
): ScheduleIconKey {
  if (value && isScheduleIconKey(value)) {
    return value;
  }
  return "anillos";
}

export function getScheduleIconsThemeFolder(themeSlug: string): string {
  if (THEMES_WITH_OWN_ICONS.has(themeSlug)) {
    return themeSlug;
  }
  return ICONS_FALLBACK[themeSlug] ?? "hojas";
}

export function getScheduleIconUrl(
  themeSlug: string,
  icon: string | null | undefined,
): string {
  const folder = getScheduleIconsThemeFolder(themeSlug);
  const key = sanitizeScheduleIcon(icon);
  return `/assets/img/themes/${folder}-icon-${key}.svg`;
}

export function scheduleIconLabel(icon: string | null | undefined): string {
  const key = sanitizeScheduleIcon(icon);
  return (
    SCHEDULE_ICON_OPTIONS.find((option) => option.value === key)?.label ??
    "Ceremonia (anillos)"
  );
}
