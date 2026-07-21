export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-4"
    >
      <span className="sr-only">Cargando panel administrativo…</span>
      <div className="h-32 animate-pulse rounded-3xl bg-white/70" />
      <div className="h-64 animate-pulse rounded-3xl bg-white/70" />
    </div>
  );
}
