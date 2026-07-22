"use client";

import { useMicrositeTheme } from "./ThemeProvider";

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
  const { theme } = useMicrositeTheme();
  const hasPhoto = Boolean(bannerPhotoUrl);
  const hideFrameWithPhoto = Boolean(
    theme.hideBannerFrameWithPhoto && hasPhoto,
  );
  const showFrame =
    theme.bannerMode === "frame-overlay" && !hideFrameWithPhoto;
  const showSvgHero = theme.bannerMode === "svg-hero";
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
    theme.bannerMode === "full-background" ||
    (hasPhoto &&
      theme.bannerMode !== "frame-overlay" &&
      overlayOpacity !== null);

  /** Scrim inferior: mejora contraste del texto sobre cualquier foto */
  const showScrim = showPhotoLayer;

  const navItems: BannerNavItem[] = [
    { href: "#regalos", label: "Regalos" },
    ...(showGallery ? [{ href: "#album", label: "Fotos" }] : []),
    ...(showSchedule
      ? [{ href: "#cronograma", label: "Cronograma" }]
      : []),
    ...(showLocation
      ? [{ href: "#ubicacion", label: "Ubicación" }]
      : []),
    ...(showCanva
      ? [{ href: "#invitacion-canva", label: "Invitación" }]
      : []),
    ...(showDressCode
      ? [{ href: "#dress-code", label: "Vestimenta" }]
      : []),
    ...(showFaq ? [{ href: "#faq", label: "FAQ" }] : []),
    ...(showMusic ? [{ href: "#musica", label: "Música" }] : []),
    ...(showRsvp
      ? [{ href: "#rsvp", label: "RSVP", primary: true }]
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
    hasPhoto ? "microsite-banner--with-photo" : "",
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
      ) : null}

      {showSvgHero ? (
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
          <nav className="microsite-nav" aria-label="Secciones del micrositio">
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
