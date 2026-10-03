import { ListSkeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-md bg-surface-brand motion-reduce:animate-none" />
        <div className="min-w-0 flex-1">
          <div className="h-3 w-24 animate-pulse rounded-sm bg-surface-brand motion-reduce:animate-none" />
          <div className="mt-3 h-8 w-56 max-w-full animate-pulse rounded-sm bg-surface-brand motion-reduce:animate-none" />
          <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-sm bg-surface-brand motion-reduce:animate-none" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-md bg-surface-default p-4 shadow-elevation-1 sm:p-5"
          >
            <div className="h-3 w-24 animate-pulse rounded-sm bg-surface-disabled motion-reduce:animate-none" />
            <div className="mt-3 h-7 w-16 animate-pulse rounded-sm bg-surface-disabled motion-reduce:animate-none" />
          </div>
        ))}
      </div>
      <ListSkeleton rows={3} />
    </div>
  );
}
