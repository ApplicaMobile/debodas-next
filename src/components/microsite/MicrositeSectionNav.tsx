"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useMicrositeTheme } from "@/components/themes/ThemeProvider";
import type { MicrositeNavItem } from "@/components/themes/microsite-nav-items";

interface MicrositeSectionNavProps {
  coupleName: string;
  /** Mismos items que la navegación del banner (buildMicrositeNavItems). */
  items: MicrositeNavItem[];
  /** id del banner: la barra aparece cuando el banner sale de pantalla. */
  bannerId?: string;
}

/** Una sección queda activa cuando su borde superior entra en el primer tercio de la pantalla. */
const ACTIVE_VIEWPORT_RATIO = 0.35;

/**
 * Barra fija de secciones con RSVP siempre visible. Aparece al pasar el banner y
 * usa solo variables del tema (colores, fuentes, radios). No se muestra en vista embebida.
 */
export function MicrositeSectionNav({
  coupleName,
  items,
  bannerId = "inicio",
}: MicrositeSectionNavProps) {
  const t = useTranslations();
  const { theme, embedded } = useMicrositeTheme();
  const navRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [offset, setOffset] = useState(0);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const hrefKey = items.map((item) => item.href).join("|");

  // Los anchors (#regalos, #rsvp…) dejan lugar para la barra al hacer scroll.
  useEffect(() => {
    if (embedded) return;
    const nav = navRef.current;
    const root = nav?.closest<HTMLElement>(".microsite-theme");
    if (!nav || !root) return;
    const apply = () =>
      root.style.setProperty(
        "--microsite-sticky-offset",
        `${offset + nav.offsetHeight}px`,
      );
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(nav);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--microsite-sticky-offset");
    };
  }, [embedded, offset]);

  // Visibilidad (banner fuera de pantalla), sección activa y lugar para el ThemeSwitcher
  // (demo / dev): mientras se ve, la barra se ubica debajo.
  useEffect(() => {
    if (embedded) return;
    const banner = document.getElementById(bannerId);
    const switcher = document.querySelector<HTMLElement>("[data-theme-switcher]");
    const sections = hrefKey
      .split("|")
      .map((href) => document.getElementById(href.slice(1)))
      .filter((node): node is HTMLElement => node !== null);
    let frame = 0;

    const update = () => {
      frame = 0;
      const top = switcher
        ? Math.max(0, Math.round(switcher.getBoundingClientRect().bottom))
        : 0;
      setOffset(top);
      const line = top + (navRef.current?.offsetHeight ?? 0);
      const bannerBottom = banner ? banner.getBoundingClientRect().bottom : 0;
      setVisible(bannerBottom <= line);

      const activeLine = line + window.innerHeight * ACTIVE_VIEWPORT_RATIO;
      let current: string | null = null;
      let currentTop = -Infinity;
      for (const section of sections) {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop <= activeLine && sectionTop > currentTop) {
          current = `#${section.id}`;
          currentTop = sectionTop;
        }
      }
      setActiveHref(current);
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [embedded, bannerId, hrefKey]);

  // En mobile la fila de links se desplaza para que la sección activa quede a la vista.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !activeHref) return;
    const link = scroller.querySelector<HTMLElement>(
      `[data-href="${activeHref}"]`,
    );
    if (!link) return;
    const left =
      link.offsetLeft - scroller.clientWidth / 2 + link.offsetWidth / 2;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    scroller.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" });
  }, [activeHref]);

  if (embedded || items.length === 0) {
    return null;
  }

  const sectionItems = items.filter((item) => !item.primary);
  const primary = items.find((item) => item.primary);
  const linkClass = (href: string) =>
    `microsite-section-nav__link${
      activeHref === href ? " microsite-section-nav__link--active" : ""
    }`;

  return (
    <nav
      ref={navRef}
      aria-label={t("microsite.stickyNavAria")}
      className={`microsite-section-nav${
        visible ? " microsite-section-nav--visible" : ""
      }`}
      style={{ top: offset }}
      inert={!visible}
    >
      <div className="microsite-section-nav__inner">
        <span
          className={`microsite-section-nav__names${
            theme.headingUppercase
              ? " microsite-section-nav__names--uppercase"
              : ""
          }`}
        >
          {coupleName}
        </span>
        <div ref={scrollerRef} className="microsite-section-nav__links">
          <a
            href={`#${bannerId}`}
            data-href={`#${bannerId}`}
            className={linkClass(`#${bannerId}`)}
          >
            {t("microsite.home")}
          </a>
          {sectionItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-href={item.href}
              className={linkClass(item.href)}
              aria-current={activeHref === item.href ? "location" : undefined}
            >
              {item.label}
            </a>
          ))}
        </div>
        {primary ? (
          <a
            href={primary.href}
            className="microsite-section-nav__cta"
            aria-current={activeHref === primary.href ? "location" : undefined}
          >
            {primary.label}
          </a>
        ) : null}
      </div>
    </nav>
  );
}
