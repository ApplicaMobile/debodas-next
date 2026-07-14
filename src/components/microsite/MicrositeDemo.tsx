"use client";

import { useEffect, useState } from "react";
import type { Boda } from "@/types/boda";
import {
  formatPrice,
  getBannerUrl,
  getCoupleDisplayName,
} from "@/data/bodas";
import { ThemeBanner } from "@/components/themes/ThemeBanner";
import {
  MicrositeSectionTitle,
  ThemeSection,
} from "@/components/themes/ThemeSection";
import { useMicrositeTheme } from "@/components/themes/ThemeProvider";

interface MicrositeDemoProps {
  boda: Boda;
}

function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const parseDate = (value: string) => {
      const parts = value.split("/");
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T19:30:00`);
      }
      return new Date(value);
    };

    const target = parseDate(targetDate).getTime();

    const tick = () => {
      const diff = Math.max(target - Date.now(), 0);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [targetDate]);

  const items = [
    { label: "días", value: timeLeft.days },
    { label: "horas", value: timeLeft.hours },
    { label: "minutos", value: timeLeft.minutes },
    { label: "segundos", value: timeLeft.seconds },
  ];

  return (
    <div className="microsite-countdown-grid">
      {items.map((item) => (
        <div key={item.label} className="microsite-countdown-item">
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function MicrositeDemo({ boda }: MicrositeDemoProps) {
  const { theme } = useMicrositeTheme();
  const coupleName = getCoupleDisplayName(boda.couple);
  const bannerUrl = getBannerUrl(boda);
  const story = String(boda.misc?.our_story ?? "");
  const gifts = boda.gifts_list?.gifts ?? [];
  const eventDate = String(boda.event?.date ?? "");
  const titleClass = theme.headingUppercase
    ? "microsite-section__title microsite-section__title--uppercase theme-heading"
    : "microsite-section__title theme-heading";
  const usesInfoDecor =
    Boolean(theme.assets.infoSvg) &&
    !theme.unifiedDecor &&
    theme.bannerMode === "svg-hero";
  const showFaq =
    boda.options?.show_faq !== 0 && boda.options?.show_faq !== false;

  return (
    <>
      <ThemeBanner
        coupleName={coupleName}
        eventDate={eventDate}
        eventPlace={String(boda.event?.place ?? "")}
        bannerPhotoUrl={bannerUrl}
      />

      <ThemeSection>
        <div className="mx-auto max-w-5xl px-6">
          <MicrositeSectionTitle className={titleClass}>
            Faltan
          </MicrositeSectionTitle>
          <div className="mt-8">
            {eventDate ? <Countdown targetDate={eventDate} /> : null}
          </div>
        </div>
      </ThemeSection>

      {story ? (
        <ThemeSection soft decor={usesInfoDecor}>
          <div className="mx-auto max-w-3xl px-6">
            <MicrositeSectionTitle className={titleClass}>
              Nuestra historia
            </MicrositeSectionTitle>
            <p className="microsite-story mt-5">{story}</p>
          </div>
        </ThemeSection>
      ) : null}

      <ThemeSection id="regalos">
        <div className="mx-auto max-w-5xl px-6">
          <MicrositeSectionTitle className={titleClass}>
            Lista de regalos
          </MicrositeSectionTitle>
          <div className="microsite-gift-grid mt-10">
            {gifts.map((gift, index) => (
              <article key={`${gift.title}-${index}`} className="microsite-card">
                <h3 className="text-lg font-semibold">{gift.title}</h3>
                <p className="microsite-gift-price">
                  {formatPrice(gift.price ?? 0)}
                </p>
                <button type="button" className="microsite-btn mt-5">
                  Regalar (demo)
                </button>
              </article>
            ))}
          </div>
        </div>
      </ThemeSection>

      {boda.schedule?.length ? (
        <ThemeSection soft decor={usesInfoDecor} id="cronograma">
          <div className="mx-auto max-w-4xl px-6">
            <MicrositeSectionTitle className={titleClass}>
              Cronograma
            </MicrositeSectionTitle>
            <div className="mt-10 space-y-4">
              {boda.schedule.map((item, index) => {
                const entry = item as {
                  time?: string;
                  title?: string;
                  description?: string;
                };
                return (
                  <div
                    key={`${entry.time}-${index}`}
                    className="microsite-schedule-item"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--theme-accent)]">
                        {entry.time}
                      </p>
                      <h3 className="text-lg font-semibold">{entry.title}</h3>
                    </div>
                    <p className="text-sm text-[var(--theme-text-muted)]">
                      {entry.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </ThemeSection>
      ) : null}

      {showFaq && boda.faq_items?.length ? (
        <ThemeSection id="faq">
          <div className="mx-auto max-w-3xl px-6">
            <MicrositeSectionTitle className={titleClass}>FAQ</MicrositeSectionTitle>
            <div className="microsite-faq mt-10 space-y-4">
              {boda.faq_items.map((item, index) => {
                const faq = item as { question?: string; answer?: string };
                return (
                  <details key={`${faq.question}-${index}`}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                );
              })}
            </div>
          </div>
        </ThemeSection>
      ) : null}

      <ThemeSection soft id="rsvp">
        <div className="mx-auto max-w-xl px-6">
          <div className="microsite-rsvp-box">
            <MicrositeSectionTitle className={titleClass}>
              RSVP
            </MicrositeSectionTitle>
            <p className="mt-3 text-sm text-[var(--theme-text-muted)]">
              Confirmá tu asistencia. En esta demo el formulario es solo visual.
            </p>
            <button type="button" className="microsite-btn mt-6">
              Confirmar asistencia
            </button>
          </div>
        </div>
      </ThemeSection>
    </>
  );
}
