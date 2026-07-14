"use client";

import { useMicrositeTheme } from "./ThemeProvider";

interface ThemeBannerProps {
  coupleName: string;
  eventDate: string;
  eventPlace: string;
  bannerPhotoUrl?: string | null;
}

const navItems = [
  { href: "#regalos", label: "Regalos" },
  { href: "#cronograma", label: "Cronograma" },
  { href: "#faq", label: "FAQ" },
  { href: "#rsvp", label: "RSVP" },
];

export function ThemeBanner({
  coupleName,
  eventDate,
  eventPlace,
  bannerPhotoUrl,
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
      : (theme.bannerPhotoOverlay ?? 0.28);

  const showOverlay =
    theme.bannerMode === "full-background" ||
    (hasPhoto &&
      theme.bannerMode !== "frame-overlay" &&
      overlayOpacity !== null);

  const bannerClass = [
    "microsite-banner",
    `microsite-banner--${theme.bannerMode}`,
    theme.bannerMode === "frame-overlay" ? "microsite-banner--frame" : "",
    hasPhoto && theme.bannerMode === "frame-overlay"
      ? "microsite-banner--has-photo"
      : "",
    hideFrameWithPhoto ? "microsite-banner--photo-only" : "",
    theme.lightBannerNav ? "microsite-banner--light-nav" : "",
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
          {eventDate}
          {eventPlace ? ` · ${eventPlace}` : ""}
        </p>

        <nav className="microsite-nav" aria-label="Secciones del micrositio">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
