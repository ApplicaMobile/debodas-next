import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { footerLegalLinks, footerLinks } from "@/data/home";
import { socialLinks } from "@/data/social";
import { t, type MessageKey } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";

const FOOTER_LABELS: Record<string, MessageKey> = {
  "/": "footer.home",
  "/#planes": "footer.plans",
  "/#themes": "footer.themes",
  "/quienes-somos": "footer.about",
  "/bodas/demo": "footer.demo",
  "/registro": "footer.register",
  "/contacto": "footer.contact",
};

const LEGAL_LABELS: Record<string, MessageKey> = {
  "/terminos": "footer.terms",
  "/privacidad": "footer.privacy",
  "/contacto": "footer.contact",
};

export async function SiteFooter() {
  const { messages } = await getDictionary();

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
            {t(messages, "footer.blurb")}
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-white">
                  {FOOTER_LABELS[link.href]
                    ? t(messages, FOOTER_LABELS[link.href])
                    : link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-start md:items-end">
          <p className="text-xs uppercase tracking-[0.2em] text-white/55">
            {t(messages, "footer.social")}
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
            {t(messages, "footer.createSite")}
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-5 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} DeBodas. {t(messages, "footer.rights")}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <LanguageSwitcher variant="onDark" />
            <nav className="flex flex-wrap gap-x-4 gap-y-2">
              {footerLegalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition hover:text-white"
                >
                  {LEGAL_LABELS[link.href]
                    ? t(messages, LEGAL_LABELS[link.href])
                    : link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
