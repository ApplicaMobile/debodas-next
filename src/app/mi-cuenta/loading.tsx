import { ListSkeleton } from "@/components/ui/Skeleton";

export default function MiCuentaLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <div className="overflow-hidden rounded-md bg-surface-default shadow-elevation-1">
        <div className="bg-surface-muted px-4 py-6 sm:px-8 sm:py-8">
          <div className="h-3 w-16 animate-pulse rounded-sm bg-surface-brand motion-reduce:animate-none" />
          <div className="mt-3 h-8 w-48 animate-pulse rounded-sm bg-surface-brand motion-reduce:animate-none" />
          <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded-sm bg-surface-brand motion-reduce:animate-none" />
        </div>
        <div className="grid gap-px bg-border-subtle sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface-default p-4 sm:p-5">
              <div className="h-3 w-16 animate-pulse rounded-sm bg-surface-disabled motion-reduce:animate-none" />
              <div className="mt-2 h-5 w-24 animate-pulse rounded-sm bg-surface-disabled motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
      <ListSkeleton rows={3} />
    </div>
  );
}
