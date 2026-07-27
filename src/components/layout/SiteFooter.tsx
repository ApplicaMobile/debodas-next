import Link from "next/link";
import Image from "next/image";
import { footerLegalLinks, footerLinks } from "@/data/home";
import { socialLinks } from "@/data/social";

export function SiteFooter() {
  return (
    <footer className="bg-[#06263a] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.2fr_1fr]">
        <div>
          <Link href="/" className="inline-block">
            <Image
              src="/assets/img/logo-white.svg"
              alt="DeBodas"
              width={160}
              height={48}
              className="h-10 w-auto"
            />
          </Link>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Micrositios de boda, RSVP y lista de regalos en un solo link para
            tus invitados.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-start md:items-end">
          <p className="text-xs uppercase tracking-[0.2em] text-white/55">
            Redes sociales
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
            <a
              href={socialLinks.instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white"
            >
              {socialLinks.instagram.label}
            </a>
            <a
              href={socialLinks.facebook.href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white"
            >
              {socialLinks.facebook.label}
            </a>
          </div>
          <Link
            href="/registro"
            className="mt-8 inline-flex rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-[#d4c4a8]"
          >
            Crear mi sitio
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-5 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} DeBodas. Todos los derechos
            reservados.
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2">
            {footerLegalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
