import Link from "next/link";

export default function BodaNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold">Boda no encontrada</h1>
      <p className="mt-3 text-stone-600">
        No existe una boda publicada con ese slug en la API.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
