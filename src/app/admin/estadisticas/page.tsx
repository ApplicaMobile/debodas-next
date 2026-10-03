import {
  AccountFieldGroup,
  AccountFormActions,
  AccountPageBody,
  AccountPageHeader,
  AccountSection,
} from "@/components/account/AccountPage";
import { Button, Input, Select } from "@/components/ui";
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
    <AccountPageBody>
      <AccountPageHeader
        href="/admin/estadisticas"
        area="Panel admin"
        section="Sistema"
        title="Estadísticas de bodas"
        description="Altas, micrositios activos, fuentes de registro y distribución de planes."
        meta={
          <span className="type-body-sm text-text-secondary">
            Micrositios online creados este mes:{" "}
            <strong className="font-semibold tabular-nums text-text-primary">
              {stats.onlineThisMonth}
            </strong>
          </span>
        }
      />

      <AccountSection
        id="estadisticas-filtros"
        title="Períodos"
        description="Elegí un período predefinido o un rango personalizado para cada tipo de gráfico."
      >
        <form method="get">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <AccountFieldGroup
              title="Gráficos de barras"
              description="Controla Altas vs Activos, fuentes y planes del período."
            >
              <Select
                id="barras"
                name="barras"
                label="Período"
                defaultValue={barsFilter}
                options={BARS_FILTER_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="fecha_inicio_barras"
                  type="date"
                  name="fecha_inicio_barras"
                  label="Desde (personalizado)"
                  defaultValue={barsStart ?? ""}
                />
                <Input
                  id="fecha_fin_barras"
                  type="date"
                  name="fecha_fin_barras"
                  label="Hasta (personalizado)"
                  defaultValue={barsEnd ?? ""}
                />
              </div>
            </AccountFieldGroup>

            <AccountFieldGroup
              title="Gráficos de torta"
              description="Distribuciones acumuladas (fuentes, planes, online/offline)."
              className="lg:border-t-0 lg:pt-0"
            >
              <Select
                id="tortas"
                name="tortas"
                label="Período"
                defaultValue={piesFilter}
                options={PIES_FILTER_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="fecha_inicio_tortas"
                  type="date"
                  name="fecha_inicio_tortas"
                  label="Desde (personalizado)"
                  defaultValue={piesStart ?? ""}
                />
                <Input
                  id="fecha_fin_tortas"
                  type="date"
                  name="fecha_fin_tortas"
                  label="Hasta (personalizado)"
                  defaultValue={piesEnd ?? ""}
                />
              </div>
            </AccountFieldGroup>
          </div>

          <AccountFormActions>
            <Button href="/admin/estadisticas" variant="fantasma">
              Restablecer
            </Button>
            <Button type="submit">Aplicar filtros</Button>
          </AccountFormActions>
        </form>
      </AccountSection>

      <AltasActivosChart
        data={stats.series}
        title={barsTitle(barsFilter, stats.barsRange.granularity)}
      />

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        <NamedBarChart
          data={stats.sourceBars}
          title="¿Cómo nos conocieron? — período de barras"
        />
        <NamedBarChart
          data={stats.planBars}
          title="Distribución de planes — período de barras"
        />
      </div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 2xl:grid-cols-3">
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
    </AccountPageBody>
  );
}
