"use client";

import { useEffect, useState } from "react";
import type { Boda } from "@/types/boda";
import {
  getBannerUrl,
  getCoupleDisplayName,
} from "@/data/bodas";
import { ThemeBanner } from "@/components/themes/ThemeBanner";
import {
  MicrositeSectionTitle,
  ThemeSection,
} from "@/components/themes/ThemeSection";
import { useMicrositeTheme } from "@/components/themes/ThemeProvider";
import { RsvpForm } from "@/components/microsite/RsvpForm";
import { GiftSection } from "@/components/microsite/GiftSection";
import { DressCodeSection } from "@/components/microsite/DressCodeSection";
import {
  getPaymentSettings,
  getPublicPaymentOptions,
} from "@/lib/bodas/payment-settings";
import {
  getDressCode,
  hasDressCodeContent,
} from "@/lib/bodas/dress-code";
import { MicrositeInvitationActions } from "@/components/microsite/MicrositeInvitationActions";
import { parseInvitations } from "@/lib/invitations/parse";
import { normalizePlan } from "@/lib/plans/features";
import { getScheduleIconUrl } from "@/lib/schedule/icons";

interface MicrositeDemoProps {
  boda: Boda;
  rsvpOpen?: boolean;
}

function Countdown({
  targetDate,
  eventTime,
}: {
  targetDate: string;
  eventTime?: string;
}) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const normalizeTime = (raw?: string) => {
      const value = String(raw ?? "").trim();
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
        const [h, m, s] = value.split(":");
        return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${(s ?? "00").padStart(2, "0")}`;
      }
      return "19:30:00";
    };

    const parseDate = (value: string, time?: string) => {
      const clock = normalizeTime(time);
      const parts = value.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return new Date(
          `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${clock}`,
        );
      }
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        const dateOnly = value.slice(0, 10);
        return new Date(`${dateOnly}T${clock}`);
      }
      return new Date(value);
    };

    const target = parseDate(targetDate, eventTime).getTime();

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
  }, [targetDate, eventTime]);

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

export function MicrositeDemo({ boda, rsvpOpen = true }: MicrositeDemoProps) {
  const { theme } = useMicrositeTheme();
  const coupleName = getCoupleDisplayName(boda.couple);
  const bannerUrl = getBannerUrl(boda);
  const story = String(boda.misc?.our_story ?? "");
  const gifts = boda.gifts_list?.gifts ?? [];
  const giftsTitle = String(boda.gifts_list?.title ?? "Lista de regalos");
  const eventDate = String(boda.event?.date ?? "");
  const eventTime = String(boda.event?.time ?? "").trim();
  const titleClass = theme.headingUppercase
    ? "microsite-section__title microsite-section__title--uppercase theme-heading"
    : "microsite-section__title theme-heading";
  const usesInfoDecor =
    Boolean(theme.assets.infoSvg) &&
    !theme.unifiedDecor &&
    theme.bannerMode === "svg-hero";
  const showFaq =
    boda.options?.show_faq !== 0 && boda.options?.show_faq !== false;
  const showDressCode =
    boda.options?.show_dress_code !== 0 &&
    boda.options?.show_dress_code !== false;
  const dressCode = getDressCode(boda.misc);
  const paymentOptions = getPublicPaymentOptions(
    getPaymentSettings(boda.misc),
    String(boda.plan ?? "free"),
  );
  const invitations = parseInvitations(
    (boda.misc ?? {}) as Record<string, unknown>,
  );
  const isPremium = normalizePlan(boda.plan) === "premium";
  const hashtag = String(boda.misc?.hashtag ?? "").trim();

  return (
    <>
      <ThemeBanner
        coupleName={coupleName}
        eventDate={eventDate}
        eventPlace={String(boda.event?.place ?? "")}
        bannerPhotoUrl={bannerUrl}
        showSchedule={Boolean(boda.schedule?.length)}
        showFaq={Boolean(showFaq && boda.faq_items?.length)}
        showDressCode={Boolean(
          showDressCode && hasDressCodeContent(dressCode),
        )}
        showRsvp={rsvpOpen}
      />

      <ThemeSection>
        <div className="mx-auto max-w-5xl px-6">
          <MicrositeSectionTitle className={titleClass}>
            Faltan
          </MicrositeSectionTitle>
          <div className="mt-8">
            {eventDate ? (
              <Countdown targetDate={eventDate} eventTime={eventTime} />
            ) : null}
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
          <GiftSection
            slug={String(boda.slug)}
            giftsTitle={giftsTitle}
            gifts={gifts}
            paymentOptions={paymentOptions}
            titleClass={titleClass}
          />
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
                  icon?: string;
                };
                const iconUrl = getScheduleIconUrl(theme.slug, entry.icon);
                const iconOnRight = index % 2 === 0;

                return (
                  <div
                    key={`${entry.time}-${index}`}
                    className={`microsite-schedule-item ${
                      iconOnRight
                        ? "microsite-schedule-item--icon-right"
                        : "microsite-schedule-item--icon-left"
                    }`}
                  >
                    <div className="microsite-schedule-item__text">
                      <p className="text-sm font-semibold text-[var(--theme-accent)]">
                        {entry.time}
                      </p>
                      <h3 className="text-lg font-semibold">{entry.title}</h3>
                      {entry.description ? (
                        <p className="mt-1 text-sm text-[var(--theme-text-muted)]">
                          {entry.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="microsite-schedule-item__icon">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={iconUrl} alt="" aria-hidden="true" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ThemeSection>
      ) : null}

      {invitations.some((item) => item.isVisibleInMicrosite) ? (
        <ThemeSection soft id="ubicacion">
          <MicrositeInvitationActions
            invitations={invitations}
            coupleName={coupleName}
            isPremium={isPremium}
            hashtag={hashtag || undefined}
          />
        </ThemeSection>
      ) : null}

      {showDressCode && hasDressCodeContent(dressCode) ? (
        <ThemeSection soft decor={usesInfoDecor} id="dress-code">
          <DressCodeSection dressCode={dressCode} titleClass={titleClass} />
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
          <RsvpForm
            slug={String(boda.slug)}
            plan={boda.plan}
            rsvpOpen={rsvpOpen}
            titleClass={titleClass}
          />
        </div>
      </ThemeSection>
    </>
  );
}
