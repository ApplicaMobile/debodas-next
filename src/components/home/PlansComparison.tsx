import { Badge, IconCheck, IconChevronDown, IconX } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PlanFeatureRow } from "@/lib/plans/comparison";

export interface PlansComparisonColumn {
  id: string;
  name: string;
  price: string;
  recommended?: boolean;
  rows: PlanFeatureRow[];
}

interface PlansComparisonProps {
  columns: PlansComparisonColumn[];
  labels: {
    show: string;
    hide: string;
    intro: string;
    caption: string;
    notIncluded: string;
    recommended: string;
  };
}

function FeatureCell({ row, notIncluded }: { row: PlanFeatureRow; notIncluded: string }) {
  const included = row.included !== false;
  return (
    <span className="flex items-start gap-3">
      {included ? (
        <IconCheck size={20} className="mt-[3px] shrink-0 text-status-success-fg" />
      ) : (
        <IconX size={20} className="mt-[3px] shrink-0 text-text-tertiary" />
      )}
      <span className={cn("type-body", included ? "text-text-primary" : "text-text-tertiary")}>
        {!included ? <span className="sr-only">{notIncluded} </span> : null}
        {row.label}
        {row.note ? <span className="text-text-secondary"> · {row.note}</span> : null}
      </span>
    </span>
  );
}

/**
 * Comparación completa de planes (las mismas filas que /mi-cuenta/plan, de lib/plans/comparison.ts)
 * en un bloque desplegable. Sin JS: <details> nativo.
 */
export function PlansComparison({ columns, labels }: PlansComparisonProps) {
  const rowCount = Math.max(0, ...columns.map((column) => column.rows.length));
  const rowIndexes = Array.from({ length: rowCount }, (_, index) => index);

  return (
    <details id="comparar-planes" className="group mx-auto mt-10 max-w-5xl">
      <summary className="focus-ring mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center justify-center gap-2 rounded-full px-4 text-center type-button text-text-primary underline decoration-1 underline-offset-4 hover:decoration-2 [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">{labels.show}</span>
        <span className="hidden group-open:inline">{labels.hide}</span>
        <IconChevronDown size={20} className="shrink-0 transition-transform group-open:rotate-180" />
      </summary>

      <div className="mt-6 rounded-md border border-border-subtle bg-surface-default p-4 shadow-elevation-1 sm:p-8">
        <p className="mx-auto max-w-3xl text-center type-body-sm text-text-secondary">{labels.intro}</p>

        {/* Desktop: tabla con las filas alineadas entre planes. */}
        <table className="mt-8 hidden w-full table-fixed border-collapse text-left md:table">
          <caption className="sr-only">{labels.caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.id} scope="col" className="px-4 pb-4 align-bottom">
                  {column.recommended ? (
                    <Badge tone="recomendado" className="mb-2">{labels.recommended}</Badge>
                  ) : null}
                  <span className="block type-h4 text-text-primary">{column.name}</span>
                  <span className="mt-1 block type-body font-semibold tabular-nums text-text-secondary">
                    {column.price}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowIndexes.map((index) => (
              <tr key={index} className="border-t border-border-subtle">
                {columns.map((column) => {
                  const row = column.rows[index];
                  return (
                    <td key={column.id} className="px-4 py-3 align-top">
                      {row ? <FeatureCell row={row} notIncluded={labels.notIncluded} /> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile: un bloque por plan. */}
        <div className="mt-6 grid gap-6 md:hidden">
          {columns.map((column) => (
            <section key={column.id} aria-label={column.name} className="border-t border-border-subtle pt-5 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="type-h4 text-text-primary">{column.name}</h3>
                {column.recommended ? <Badge tone="recomendado">{labels.recommended}</Badge> : null}
              </div>
              <p className="mt-1 type-body font-semibold tabular-nums text-text-secondary">{column.price}</p>
              <ul className="mt-4 flex flex-col gap-3" role="list">
                {column.rows.map((row) => (
                  <li key={row.label}>
                    <FeatureCell row={row} notIncluded={labels.notIncluded} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </details>
  );
}
