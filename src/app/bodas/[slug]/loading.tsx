export default function BodaLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-[#f7f4ef] px-4 py-8"
    >
      <span className="sr-only">Cargando micrositio…</span>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-[42vh] animate-pulse rounded-3xl bg-white/80" />
        <div className="h-28 animate-pulse rounded-3xl bg-white/70" />
        <div className="h-48 animate-pulse rounded-3xl bg-white/70" />
        <div className="h-48 animate-pulse rounded-3xl bg-white/70" />
      </div>
    </div>
  );
}
