"use client";

export default function AdminError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="font-serif text-2xl font-semibold text-stone-800">
        No pudimos cargar esta sección
      </h2>
      <p className="mt-2 text-sm text-stone-600">
        Revisá la conexión e intentá nuevamente.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 min-h-11 rounded-full bg-[#06263a] px-5 py-2 text-sm font-semibold text-white"
      >
        Reintentar
      </button>
    </div>
  );
}
