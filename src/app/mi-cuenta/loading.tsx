export default function MiCuentaLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-4"
    >
      <span className="sr-only">Cargando tu panel…</span>
      <div className="h-28 animate-pulse rounded-3xl bg-white/80" />
      <div className="h-56 animate-pulse rounded-3xl bg-white/70" />
      <div className="h-40 animate-pulse rounded-3xl bg-white/70" />
    </div>
  );
}
