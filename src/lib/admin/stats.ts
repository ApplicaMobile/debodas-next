import { SITE_SOURCE_OPTIONS } from "@/lib/auth/register";
import { planLabels, normalizePlan } from "@/lib/plans/features";
import { prisma } from "@/lib/db/prisma";

export type BarsFilter =
  | "mes_actual"
  | "5_dias"
  | "15_dias"
  | "6_meses"
  | "12_meses"
  | "personalizado";

export type PiesFilter = "total" | "mes_actual" | "personalizado";

export interface DateRange {
  start: Date;
  end: Date;
  granularity: "day" | "month";
}

export interface SeriesPoint {
  label: string;
  altas: number;
  activos: number;
}

export interface NamedCount {
  key: string;
  label: string;
  count: number;
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;
const MONTH_NAMES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfMonth(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDayLabel(d: Date): string {
  return `${DAY_NAMES[d.getDay()]} ${String(d.getDate()).padStart(2, "0")} ${MONTH_NAMES[d.getMonth()]}`;
}

function formatMonthLabel(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function resolveBarsRange(
  filter: BarsFilter,
  customStart?: string | null,
  customEnd?: string | null,
): DateRange {
  const today = startOfDay(new Date());

  if (filter === "personalizado" && customStart && customEnd) {
    const start = startOfDay(new Date(customStart));
    const end = endOfDay(new Date(customEnd));
    const days =
      Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    return {
      start,
      end,
      granularity: days <= 60 ? "day" : "month",
    };
  }

  if (filter === "mes_actual") {
    return {
      start: startOfMonth(today),
      end: endOfDay(today),
      granularity: "day",
    };
  }

  if (filter === "5_dias" || filter === "15_dias") {
    const days = filter === "5_dias" ? 5 : 15;
    return {
      start: addDays(today, -(days - 1)),
      end: endOfDay(today),
      granularity: "day",
    };
  }

  const months = filter === "6_meses" ? 6 : 12;
  return {
    start: startOfMonth(addMonths(today, -(months - 1))),
    end: endOfDay(today),
    granularity: "month",
  };
}

export function resolvePiesRange(
  filter: PiesFilter,
  customStart?: string | null,
  customEnd?: string | null,
): { start: Date | null; end: Date | null } {
  const today = startOfDay(new Date());

  if (filter === "personalizado" && customStart && customEnd) {
    return {
      start: startOfDay(new Date(customStart)),
      end: endOfDay(new Date(customEnd)),
    };
  }

  if (filter === "mes_actual") {
    return { start: startOfMonth(today), end: endOfDay(today) };
  }

  return { start: null, end: null };
}

function siteSourceLabel(key: string): string {
  const known = SITE_SOURCE_OPTIONS.find((o) => o.value === key);
  if (known) {
    return known.label;
  }
  if (!key || key === "unknown") {
    return "Sin dato";
  }
  return key;
}

function planLabel(plan: string): string {
  const normalized = normalizePlan(plan);
  return planLabels[plan] ?? planLabels[normalized] ?? plan;
}

function bucketKey(date: Date, granularity: "day" | "month"): string {
  return granularity === "day" ? dayKey(date) : monthKey(date);
}

function buildBuckets(range: DateRange): Array<{ key: string; label: string }> {
  const buckets: Array<{ key: string; label: string }> = [];

  if (range.granularity === "day") {
    let cursor = startOfDay(range.start);
    const last = startOfDay(range.end);
    while (cursor <= last) {
      buckets.push({ key: dayKey(cursor), label: formatDayLabel(cursor) });
      cursor = addDays(cursor, 1);
    }
    return buckets;
  }

  let cursor = startOfMonth(range.start);
  const last = startOfMonth(range.end);
  while (cursor <= last) {
    buckets.push({ key: monthKey(cursor), label: formatMonthLabel(cursor) });
    cursor = addMonths(cursor, 1);
  }
  return buckets;
}

type BodaStatRow = {
  createdAt: Date;
  plan: string;
  isOnline: boolean;
  misc: unknown;
};

function extractSiteSource(misc: unknown): string {
  if (!misc || typeof misc !== "object") {
    return "unknown";
  }
  const record = misc as Record<string, unknown>;
  const source = String(record.site_source ?? "").trim();
  if (!source) {
    return "unknown";
  }
  if (source === "other") {
    const other = String(record.site_source_other ?? "").trim();
    return other ? `other:${other}` : "other";
  }
  return source;
}

function inRange(
  date: Date,
  start: Date | null,
  end: Date | null,
): boolean {
  if (start && date < start) {
    return false;
  }
  if (end && date > end) {
    return false;
  }
  return true;
}

export async function loadWeddingStats(input: {
  barsFilter: BarsFilter;
  piesFilter: PiesFilter;
  barsStart?: string | null;
  barsEnd?: string | null;
  piesStart?: string | null;
  piesEnd?: string | null;
}) {
  const barsRange = resolveBarsRange(
    input.barsFilter,
    input.barsStart,
    input.barsEnd,
  );
  const piesRange = resolvePiesRange(
    input.piesFilter,
    input.piesStart,
    input.piesEnd,
  );

  const fetchStartCandidates = [barsRange.start];
  if (piesRange.start) {
    fetchStartCandidates.push(piesRange.start);
  }
  const fetchStart = new Date(
    Math.min(...fetchStartCandidates.map((d) => d.getTime())),
  );

  const where =
    piesRange.start === null
      ? undefined
      : { createdAt: { gte: fetchStart } };

  const rows: BodaStatRow[] = await prisma.boda.findMany({
    where,
    select: {
      createdAt: true,
      plan: true,
      isOnline: true,
      misc: true,
    },
  });

  const buckets = buildBuckets(barsRange);
  const altasMap = new Map<string, number>();
  const activosMap = new Map<string, number>();
  for (const b of buckets) {
    altasMap.set(b.key, 0);
    activosMap.set(b.key, 0);
  }

  const sourceBars = new Map<string, number>();
  const planBars = new Map<string, number>();
  const sourcePies = new Map<string, number>();
  const planPies = new Map<string, number>();
  let onlinePies = 0;
  let offlinePies = 0;
  let onlineThisMonth = 0;

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfDay(new Date());

  for (const row of rows) {
    const created = row.createdAt;
    const key = bucketKey(created, barsRange.granularity);
    const inBars = inRange(created, barsRange.start, barsRange.end);
    const inPies = inRange(created, piesRange.start, piesRange.end);
    const source = extractSiteSource(row.misc);

    if (inBars) {
      if (altasMap.has(key)) {
        altasMap.set(key, (altasMap.get(key) ?? 0) + 1);
      }
      if (row.isOnline && activosMap.has(key)) {
        activosMap.set(key, (activosMap.get(key) ?? 0) + 1);
      }
      sourceBars.set(source, (sourceBars.get(source) ?? 0) + 1);
      planBars.set(row.plan, (planBars.get(row.plan) ?? 0) + 1);
    }

    if (inPies) {
      sourcePies.set(source, (sourcePies.get(source) ?? 0) + 1);
      planPies.set(row.plan, (planPies.get(row.plan) ?? 0) + 1);
      if (row.isOnline) {
        onlinePies += 1;
      } else {
        offlinePies += 1;
      }
    }

    if (
      row.isOnline &&
      inRange(created, monthStart, monthEnd)
    ) {
      onlineThisMonth += 1;
    }
  }

  const series: SeriesPoint[] = buckets.map((b) => ({
    label: b.label,
    altas: altasMap.get(b.key) ?? 0,
    activos: activosMap.get(b.key) ?? 0,
  }));

  const toNamed = (
    map: Map<string, number>,
    labelFn: (key: string) => string,
  ): NamedCount[] =>
    [...map.entries()]
      .map(([key, count]) => ({ key, label: labelFn(key), count }))
      .sort((a, b) => b.count - a.count);

  const sourceLabel = (key: string) => {
    if (key.startsWith("other:")) {
      return `Otro: ${key.slice(6)}`;
    }
    return siteSourceLabel(key === "other" ? "other" : key);
  };

  return {
    barsRange,
    piesRange,
    series,
    sourceBars: toNamed(sourceBars, sourceLabel),
    planBars: toNamed(planBars, planLabel),
    sourcePies: toNamed(sourcePies, sourceLabel),
    planPies: toNamed(planPies, planLabel),
    statusPies: [
      { key: "online", label: "Micrositio Online", count: onlinePies },
      { key: "offline", label: "Micrositio Offline", count: offlinePies },
    ] satisfies NamedCount[],
    onlineThisMonth,
    totals: {
      altasInBars: series.reduce((sum, p) => sum + p.altas, 0),
      activosInBars: series.reduce((sum, p) => sum + p.activos, 0),
      totalBodas: rows.length,
    },
  };
}

export const BARS_FILTER_OPTIONS: Array<{ value: BarsFilter; label: string }> =
  [
    { value: "mes_actual", label: "Mes actual" },
    { value: "5_dias", label: "Últimos 5 días" },
    { value: "15_dias", label: "Últimos 15 días" },
    { value: "6_meses", label: "Últimos 6 meses" },
    { value: "12_meses", label: "Últimos 12 meses" },
    { value: "personalizado", label: "Rango personalizado" },
  ];

export const PIES_FILTER_OPTIONS: Array<{ value: PiesFilter; label: string }> =
  [
    { value: "total", label: "Total (todas las bodas)" },
    { value: "mes_actual", label: "Mes actual" },
    { value: "personalizado", label: "Rango personalizado" },
  ];
