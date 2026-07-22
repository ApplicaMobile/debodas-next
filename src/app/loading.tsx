export default function RootLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-[#EBEBEB] px-4 py-10 sm:px-6"
    >
      <span className="sr-only">Cargando…</span>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-14 animate-pulse rounded-2xl bg-white/80" />
        <div className="h-[50vh] animate-pulse rounded-3xl bg-white/70" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-40 animate-pulse rounded-3xl bg-white/70" />
          <div className="h-40 animate-pulse rounded-3xl bg-white/70" />
          <div className="h-40 animate-pulse rounded-3xl bg-white/70" />
        </div>
      </div>
    </div>
  );
}
