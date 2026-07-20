import Link from "next/link";
import Image from "next/image";
import { footerLinks } from "@/data/home";
import { socialLinks } from "@/data/social";

export function SiteFooter() {
  return (
    <footer className="bg-[#06263a] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold tracking-wide">DEBODAS</h3>
          <ul className="mt-5 space-y-2 text-sm text-white/80">
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
          <p className="text-sm uppercase tracking-widest text-white/70">
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
          <Link href="/" className="mt-8">
            <Image
              src="/assets/img/logo-white.svg"
              alt="DeBodas"
              width={160}
              height={48}
              className="h-10 w-auto"
            />
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} DeBodas. Todos los derechos reservados.</p>
          <p>Micrositios de boda · Lista de regalos · RSVP</p>
        </div>
      </div>
    </footer>
  );
}
