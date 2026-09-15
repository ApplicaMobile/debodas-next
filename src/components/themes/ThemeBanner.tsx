"use client";

import { useMicrositeTheme } from "./ThemeProvider";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface ThemeBannerProps {
  coupleName: string;
  eventDate: string;
  eventPlace: string;
  bannerPhotoUrl?: string | null;
  showGallery?: boolean;
  showSchedule?: boolean;
  showLocation?: boolean;
  showFaq?: boolean;
  showDressCode?: boolean;
  showRsvp?: boolean;
  showCanva?: boolean;
  showMusic?: boolean;
}

interface BannerNavItem {
  href: string;
  label: string;
  primary?: boolean;
}

export function ThemeBanner({
  coupleName,
  eventDate,
  eventPlace,
  bannerPhotoUrl,
  showGallery = false,
  showSchedule = true,
  showLocation = false,
  showFaq = true,
  showDressCode = false,
  showRsvp = true,
  showCanva = false,
  showMusic = false,
}: ThemeBannerProps) {
  const t = useTranslations();
  const { theme } = useMicrositeTheme();
  const hasPhoto = Boolean(bannerPhotoUrl);
  const hideFrameWithPhoto = Boolean(
    theme.hideBannerFrameWithPhoto && hasPhoto,
  );
  const showFrame =
    theme.bannerMode === "frame-overlay" && !hideFrameWithPhoto;
  const showSvgHero = theme.bannerMode === "svg-hero";
  /** Fondo del tema en raster (p.ej. home-base.png): actúa como foto fallback */
  const themeHomeIsRaster = /\.(png|jpe?g|webp)$/i.test(
    theme.assets.homeSvg ?? "",
  );
  const showThemeRasterFallback =
    !hasPhoto && showSvgHero && themeHomeIsRaster;
  const showPhotoLayer =
    hasPhoto &&
    (theme.bannerMode === "svg-hero" ||
      theme.bannerMode === "photo-overlay" ||
      theme.bannerMode === "full-background" ||
      theme.bannerMode === "frame-overlay");

  const overlayOpacity =
    theme.bannerPhotoOverlay === false
      ? null
      : (theme.bannerPhotoOverlay ?? 0.32);

  const showOverlay =
    overlayOpacity !== null &&
    (theme.bannerMode === "full-background" ||
      showThemeRasterFallback ||
      (hasPhoto && theme.bannerMode !== "frame-overlay"));

  /** Scrim inferior: mejora contraste; marfil / full-bg sin overlay no lo usan */
  const showScrim =
    (showPhotoLayer || showThemeRasterFallback) &&
    overlayOpacity !== null &&
    theme.bannerMode !== "full-background";

  const navItems: BannerNavItem[] = [
    { href: "#regalos", label: t("microsite.gifts") },
    ...(showGallery ? [{ href: "#album", label: t("microsite.photos") }] : []),
    ...(showSchedule
      ? [{ href: "#cronograma", label: t("microsite.schedule") }]
      : []),
    ...(showLocation
      ? [{ href: "#ubicacion", label: t("microsite.location") }]
      : []),
    ...(showCanva
      ? [{ href: "#invitacion-canva", label: t("microsite.invite") }]
      : []),
    ...(showDressCode
      ? [{ href: "#dress-code", label: t("microsite.attire") }]
      : []),
    ...(showFaq ? [{ href: "#faq", label: t("microsite.faq") }] : []),
    ...(showMusic ? [{ href: "#musica", label: t("microsite.music") }] : []),
    ...(showRsvp
      ? [{ href: "#rsvp", label: t("microsite.rsvp"), primary: true }]
      : []),
  ];

  const bannerClass = [
    "microsite-banner",
    `microsite-banner--${theme.bannerMode}`,
    theme.bannerMode === "frame-overlay" ? "microsite-banner--frame" : "",
    hasPhoto && theme.bannerMode === "frame-overlay"
      ? "microsite-banner--has-photo"
      : "",
    hideFrameWithPhoto ? "microsite-banner--photo-only" : "",
    theme.lightBannerNav ? "microsite-banner--light-nav" : "",
    hasPhoto || showThemeRasterFallback ? "microsite-banner--with-photo" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={bannerClass} id="inicio">
      {showPhotoLayer && bannerPhotoUrl ? (
        <div
          className="microsite-banner__photo"
          style={{ backgroundImage: `url('${bannerPhotoUrl}')` }}
          aria-hidden="true"
        />
      ) : showThemeRasterFallback ? (
        <div
          className="microsite-banner__photo"
          style={{ backgroundImage: `url('${theme.assets.homeSvg}')` }}
          aria-hidden="true"
        />
      ) : null}

      {showSvgHero && !showThemeRasterFallback ? (
        <div className="microsite-banner__svg-bg" aria-hidden="true" />
      ) : null}

      {showFrame ? (
        <div className="microsite-banner__frame" aria-hidden="true" />
      ) : null}

      {showOverlay ? (
        <div
          className="microsite-banner__overlay"
          style={
            overlayOpacity !== null
              ? { background: `rgba(0, 0, 0, ${overlayOpacity})` }
              : undefined
          }
        />
      ) : null}

      {showScrim ? (
        <div className="microsite-banner__scrim" aria-hidden="true" />
      ) : null}

      <div className="microsite-banner__content">
        <p className="microsite-banner__eyebrow">Nos casamos</p>
        <h1
          className={`microsite-banner__title ${
            theme.headingUppercase ? "microsite-banner__title--uppercase" : ""
          }`}
        >
          {coupleName}
        </h1>
        <p className="microsite-banner__meta">
          {eventDate ? <span className="microsite-banner__date">{eventDate}</span> : null}
          {eventDate && eventPlace ? (
            <span className="microsite-banner__meta-sep" aria-hidden="true">
              ·
            </span>
          ) : null}
          {eventPlace ? (
            <span className="microsite-banner__place">{eventPlace}</span>
          ) : null}
        </p>

        {navItems.length ? (
          <nav className="microsite-nav" aria-label={t("microsite.navAria")}>
            {navItems.some((item) => item.primary) ? (
              <div className="microsite-nav__primary">
                {navItems
                  .filter((item) => item.primary)
                  .map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="microsite-nav__link microsite-nav__link--primary"
                    >
                      {item.label}
                    </a>
                  ))}
              </div>
            ) : null}
            {navItems.some((item) => !item.primary) ? (
              <div className="microsite-nav__secondary">
                {navItems
                  .filter((item) => !item.primary)
                  .map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="microsite-nav__link"
                    >
                      {item.label}
                    </a>
                  ))}
              </div>
            ) : null}
          </nav>
        ) : null}
      </div>
    </section>
  );
}
