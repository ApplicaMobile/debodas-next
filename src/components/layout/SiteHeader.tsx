import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { getViewer } from "@/lib/auth/viewer";
import { t } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-locale";

export async function SiteHeader({
  transparent = false,
}: {
  transparent?: boolean;
}) {
  const [{ messages }, viewer] = await Promise.all([getDictionary(), getViewer()]);
  const isAdmin = viewer.isAdmin;
  const session = viewer.session;
  const links = isAdmin
    ? [
        { label: t(messages, "header.adminHome"), href: "/" },
        { label: t(messages, "header.adminSummary"), href: "/admin" },
        { label: t(messages, "header.adminWeddings"), href: "/admin/bodas" },
        { label: t(messages, "header.adminMigration"), href: "/admin/migracion" },
      ]
    : [
        { label: t(messages, "header.plans"), href: "/#planes" },
        { label: t(messages, "header.themes"), href: "/#themes" },
        { label: t(messages, "header.about"), href: "/quienes-somos" },
        { label: t(messages, "header.demo"), href: "/bodas/demo" },
      ];
  const accountHref = isAdmin ? "/" : session ? "/mi-cuenta" : "/login";
  const accountLabel = isAdmin
    ? t(messages, "header.adminHome")
    : session
      ? t(messages, "header.account")
      : t(messages, "header.login");
  const primaryHref = isAdmin ? "/admin" : session ? "/mi-cuenta" : "/registro";
  const primaryLabel = isAdmin
    ? t(messages, "header.goPanel")
    : session
      ? t(messages, "header.goPanel")
      : t(messages, "header.createSite");
  const switcherVariant = transparent ? "onDark" : "onLight";

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
          aria-label={t(messages, "header.navAria")}
          className="hidden items-center gap-8 md:flex"
        >
          {links.map((link) => (
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
          <LanguageSwitcher compact variant={switcherVariant} />
          <Link
            href={accountHref}
            className={`hidden text-sm font-medium sm:inline ${
              transparent ? "text-white/90 hover:text-white" : "text-stone-700"
            }`}
          >
            {accountLabel}
          </Link>
          <Link
            href={primaryHref}
            className="hidden min-h-11 items-center rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-[#d4c4a8] sm:inline-flex"
          >
            {primaryLabel}
          </Link>
          <details className="group relative md:hidden">
            <summary
              aria-label={t(messages, "header.menuAria")}
              className={`flex min-h-11 cursor-pointer list-none items-center rounded-full px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden ${
                transparent
                  ? "border border-white/50 text-white"
                  : "border border-stone-300 bg-white text-stone-800"
              }`}
            >
              {t(messages, "header.menu")}
            </summary>
            <nav
              aria-label={t(messages, "header.navAria")}
              className="absolute right-0 mt-2 flex min-w-52 flex-col rounded-2xl border border-stone-200 bg-white p-2 text-stone-800 shadow-xl"
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center rounded-xl px-4 text-sm font-medium hover:bg-stone-50"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={accountHref}
                className="flex min-h-11 items-center rounded-xl px-4 text-sm font-medium hover:bg-stone-50"
              >
                {accountLabel}
              </Link>
              <Link
                href={primaryHref}
                className="flex min-h-11 items-center rounded-xl bg-[#e6dac7] px-4 text-sm font-semibold text-stone-800"
              >
                {primaryLabel}
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
