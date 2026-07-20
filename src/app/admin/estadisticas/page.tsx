import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  BARS_FILTER_OPTIONS,
  PIES_FILTER_OPTIONS,
  loadWeddingStats,
  type BarsFilter,
  type PiesFilter,
} from "@/lib/admin/stats";
import {
  AltasActivosChart,
  NamedBarChart,
  NamedPieChart,
} from "@/components/admin/StatsCharts";

interface PageProps {
  searchParams: Promise<{
    barras?: string;
    tortas?: string;
    fecha_inicio_barras?: string;
    fecha_fin_barras?: string;
    fecha_inicio_tortas?: string;
    fecha_fin_tortas?: string;
  }>;
}

function asBarsFilter(value: string | undefined): BarsFilter {
  const allowed = BARS_FILTER_OPTIONS.map((o) => o.value);
  if (value && (allowed as string[]).includes(value)) {
    return value as BarsFilter;
  }
  return "15_dias";
}

function asPiesFilter(value: string | undefined): PiesFilter {
  const allowed = PIES_FILTER_OPTIONS.map((o) => o.value);
  if (value && (allowed as string[]).includes(value)) {
    return value as PiesFilter;
  }
  return "total";
}

function barsTitle(filter: BarsFilter, granularity: "day" | "month"): string {
  const period =
    BARS_FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? filter;
  const mode = granularity === "day" ? "días" : "meses";
  return `Gráfico principal: ${period} — Altas vs Activos (${mode})`;
}

export default async function AdminEstadisticasPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;

  const barsFilter = asBarsFilter(params.barras);
  const piesFilter = asPiesFilter(params.tortas);
  const barsStart = params.fecha_inicio_barras ?? null;
  const barsEnd = params.fecha_fin_barras ?? null;
  const piesStart = params.fecha_inicio_tortas ?? null;
  const piesEnd = params.fecha_fin_tortas ?? null;

  const stats = await loadWeddingStats({
    barsFilter,
    piesFilter,
    barsStart,
    barsEnd,
    piesStart,
    piesEnd,
  });

  const piesPeriod =
    PIES_FILTER_OPTIONS.find((o) => o.value === piesFilter)?.label ?? "Total";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Estadísticas de bodas
        </h2>
        <p className="mt-2 text-stone-600">
          Altas, micrositios activos, fuentes de registro y distribución de
          planes.
        </p>
        <p className="mt-3 text-sm text-stone-500">
          Micrositios online creados este mes:{" "}
          <span className="font-semibold text-stone-800">
            {stats.onlineThisMonth}
          </span>
        </p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <form method="get" className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-stone-800">
              Gráficos de barras
            </label>
            <p className="text-xs text-stone-500">
              Controla Altas vs Activos, fuentes y planes del período.
            </p>
            <select
              name="barras"
              defaultValue={barsFilter}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            >
              {BARS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-stone-500">
                  Desde (personalizado)
                </label>
                <input
                  type="date"
                  name="fecha_inicio_barras"
                  defaultValue={barsStart ?? ""}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-stone-500">
                  Hasta (personalizado)
                </label>
                <input
                  type="date"
                  name="fecha_fin_barras"
                  defaultValue={barsEnd ?? ""}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-stone-800">
              Gráficos de torta
            </label>
            <p className="text-xs text-stone-500">
              Distribuciones acumuladas (fuentes, planes, online/offline).
            </p>
            <select
              name="tortas"
              defaultValue={piesFilter}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            >
              {PIES_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-stone-500">
                  Desde (personalizado)
                </label>
                <input
                  type="date"
                  name="fecha_inicio_tortas"
                  defaultValue={piesStart ?? ""}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-stone-500">
                  Hasta (personalizado)
                </label>
                <input
                  type="date"
                  name="fecha_fin_tortas"
                  defaultValue={piesEnd ?? ""}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-[#06263a] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Aplicar filtros
            </button>
            <Link
              href="/admin/estadisticas"
              className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700"
            >
              Restablecer
            </Link>
          </div>
        </form>
      </section>

      <AltasActivosChart
        data={stats.series}
        title={barsTitle(barsFilter, stats.barsRange.granularity)}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <NamedBarChart
          data={stats.sourceBars}
          title="¿Cómo nos conocieron? — período de barras"
        />
        <NamedBarChart
          data={stats.planBars}
          title="Distribución de planes — período de barras"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <NamedPieChart
          data={stats.sourcePies}
          title={`¿Cómo nos conocieron? — ${piesPeriod}`}
        />
        <NamedPieChart
          data={stats.planPies}
          title={`Distribución de planes — ${piesPeriod}`}
        />
        <NamedPieChart
          data={stats.statusPies}
          title={`Estado del micrositio — ${piesPeriod}`}
        />
      </div>
    </div>
  );
}
