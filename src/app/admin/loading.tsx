export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando">
      <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <div className="h-7 w-40 animate-pulse rounded bg-stone-200" />
        <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-stone-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="h-3 w-24 animate-pulse rounded bg-stone-200" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-stone-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
