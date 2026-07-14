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

        <nav className="hidden items-center gap-8 md:flex">
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
            className="rounded-full bg-[#556B2F] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#465A27]"
          >
            Crear sitio
          </Link>
        </div>
      </div>
    </header>
  );
}
