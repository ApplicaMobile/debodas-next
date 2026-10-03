"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import type { NamedCount, SeriesPoint } from "@/lib/admin/stats";

// Paleta de gráficos del sistema de diseño (tokens --color-chart-*).
const CHART_COLORS = Array.from(
  { length: 8 },
  (_, index) => `var(--color-chart-${index + 1})`,
);
const ALTAS_COLOR = CHART_COLORS[0];
const ACTIVOS_COLOR = CHART_COLORS[1];
const BAR_COLORS = CHART_COLORS;
const PIE_COLORS = CHART_COLORS;
const GRID_COLOR = "var(--color-chart-grid)";
const AXIS_TICK = { fontSize: 12, fill: "var(--color-chart-axis)" };

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card as="section" padding="md">
      <h3 className="type-h4 text-text-primary">{title}</h3>
      {children}
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="mt-4 flex h-64 items-center justify-center rounded-md border border-dashed border-border-default bg-surface-muted type-body-sm text-text-secondary">
      {message}
    </div>
  );
}

export function AltasActivosChart({
  data,
  title,
}: {
  data: SeriesPoint[];
  title: string;
}) {
  const hasData = data.some((d) => d.altas > 0 || d.activos > 0);

  return (
    <ChartCard title={title}>
      {!hasData ? (
        <EmptyChart message="Sin altas en este período." />
      ) : (
        <div className="mt-4 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis
                dataKey="label"
                tick={AXIS_TICK}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={AXIS_TICK}
              />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="altas" name="Altas" fill={ALTAS_COLOR} radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="activos"
                name="Activos"
                fill={ACTIVOS_COLOR}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

export function NamedBarChart({
  data,
  title,
  color = BAR_COLORS[0],
}: {
  data: NamedCount[];
  title: string;
  color?: string;
}) {
  const chartData = data.map((d) => ({ name: d.label, value: d.count }));

  return (
    <ChartCard title={title}>
      {chartData.length === 0 ? (
        <EmptyChart message="Sin datos en este período." />
      ) : (
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={AXIS_TICK}
              />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="value" name="Cantidad" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={BAR_COLORS[index % BAR_COLORS.length] ?? color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

export function NamedPieChart({
  data,
  title,
}: {
  data: NamedCount[];
  title: string;
}) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({ name: d.label, value: d.count }));

  return (
    <ChartCard title={title}>
      {chartData.length === 0 ? (
        <EmptyChart message="Sin datos." />
      ) : (
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`pie-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
