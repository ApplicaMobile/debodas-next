import Link from "next/link";

interface PlanUsageMeterProps {
  label: string;
  current: number;
  max: number | null;
  upgradeHref?: string;
}

export function PlanUsageMeter({
  label,
  current,
  max,
  upgradeHref = "/mi-cuenta/plan",
}: PlanUsageMeterProps) {
  if (max === null) {
    return (
      <p className="text-sm text-stone-500">
        {current} {label} · Ilimitado
      </p>
    );
  }

  const pct = Math.min(100, Math.round((current / Math.max(max, 1)) * 100));
  const atLimit = current >= max;
  const nearLimit = !atLimit && pct >= 80;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex justify-between text-xs text-stone-500">
        <span>
          {current} / {max} {label}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full transition-all ${
            atLimit
              ? "bg-amber-500"
              : nearLimit
                ? "bg-amber-400"
                : "bg-[#e6dac7]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {atLimit ? (
        <p className="text-xs text-amber-800">
          Límite alcanzado.{" "}
          <Link href={upgradeHref} className="font-medium underline">
            Mejorá tu plan
          </Link>
        </p>
      ) : nearLimit ? (
        <p className="text-xs text-stone-500">
          Te quedan {max - current}.{" "}
          <Link href={upgradeHref} className="underline">
            Ver planes
          </Link>
        </p>
      ) : null}
    </div>
  );
}
