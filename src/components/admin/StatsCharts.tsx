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
import type { NamedCount, SeriesPoint } from "@/lib/admin/stats";

const ALTAS_COLOR = "#1e3a5f";
const ACTIVOS_COLOR = "#7eb8da";
const BAR_COLORS = [
  "#e91e8c",
  "#06263a",
  "#e6dac7",
  "#c4a484",
  "#4a5568",
  "#dd6b20",
  "#2b6cb0",
  "#805ad5",
];
const PIE_COLORS = ["#06263a", "#e91e8c", "#e6dac7", "#c4a484", "#7eb8da", "#dd6b20"];

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-stone-500">
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
    <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-lg font-semibold text-stone-800">{title}</h3>
      {!hasData ? (
        <EmptyChart message="Sin altas en este período." />
      ) : (
        <div className="mt-4 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#78716c" }}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#78716c" }}
              />
              <Tooltip />
              <Legend />
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
    </section>
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
    <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-lg font-semibold text-stone-800">{title}</h3>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 11, fill: "#57534e" }}
              />
              <Tooltip />
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
    </section>
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
    <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-lg font-semibold text-stone-800">{title}</h3>
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
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
