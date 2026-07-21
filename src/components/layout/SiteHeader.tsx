import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { label: "Planes", href: "/#planes" },
  { label: "Temas", href: "/#themes" },
  { label: "Demo", href: "/bodas/demo" },
];

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  return (
    <header
      className={`absolute inset-x-0 top-0 z-50 ${
        transparent
          ? "bg-gradient-to-b from-black/55 via-black/25 to-transparent"
          : "border-b border-black/5 bg-white/92 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={transparent ? "/assets/img/logo-white.svg" : "/assets/img/logo.svg"}
            alt="DeBodas"
            width={140}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-8 md:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition ${
                transparent
                  ? "text-white/90 hover:text-white"
                  : "text-stone-700 hover:text-stone-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className={`hidden text-sm font-medium sm:inline ${
              transparent ? "text-white/90 hover:text-white" : "text-stone-700"
            }`}
          >
            Ingresar
          </Link>
          <Link
            href="/registro"
            className="hidden min-h-11 items-center rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-[#d4c4a8] sm:inline-flex"
          >
            Crear sitio
          </Link>
          <details className="group relative md:hidden">
            <summary
              aria-label="Abrir menú de navegación"
              className={`flex min-h-11 cursor-pointer list-none items-center rounded-full px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden ${
                transparent
                  ? "border border-white/50 text-white"
                  : "border border-stone-300 bg-white text-stone-800"
              }`}
            >
              Menú
            </summary>
            <nav
              aria-label="Navegación móvil"
              className="absolute right-0 mt-2 flex min-w-52 flex-col rounded-2xl border border-stone-200 bg-white p-2 text-stone-800 shadow-xl"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center rounded-xl px-4 text-sm font-medium hover:bg-stone-50"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="flex min-h-11 items-center rounded-xl px-4 text-sm font-medium hover:bg-stone-50"
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="flex min-h-11 items-center rounded-xl bg-[#e6dac7] px-4 text-sm font-semibold text-stone-800"
              >
                Crear sitio
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
