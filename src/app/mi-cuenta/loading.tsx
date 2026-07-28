import { ListSkeleton } from "@/components/ui/Skeleton";

export default function MiCuentaLoading() {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm sm:rounded-3xl">
        <div className="bg-[#06263a] px-4 py-6 sm:px-8 sm:py-8">
          <div className="h-3 w-16 animate-pulse rounded bg-white/20" />
          <div className="mt-3 h-8 w-48 animate-pulse rounded bg-white/25" />
          <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-white/15" />
        </div>
        <div className="grid gap-px bg-stone-100 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-4 sm:p-5">
              <div className="h-3 w-16 animate-pulse rounded bg-stone-200" />
              <div className="mt-2 h-5 w-24 animate-pulse rounded bg-stone-200" />
            </div>
          ))}
        </div>
      </div>
      <ListSkeleton rows={3} />
    </div>
  );
}
