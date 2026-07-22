import Link from "next/link";

export default function BodaNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
        404
      </p>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-stone-800">
        No encontramos esta boda
      </h1>
      <p className="mt-3 text-stone-600">
        El link puede estar mal escrito o el micrositio todavía no está
        publicado. Si sos de la pareja, ingresá a tu cuenta para revisar el
        enlace.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Volver al inicio
        </Link>
        <Link
          href="/login"
          className="inline-flex rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700"
        >
          Ir a mi cuenta
        </Link>
      </div>
    </main>
  );
}
