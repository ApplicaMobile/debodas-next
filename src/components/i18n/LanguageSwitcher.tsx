"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/i18n/actions";
import {
  LOCALES,
  LOCALE_FLAG,
  LOCALE_LABELS,
  type Locale,
} from "@/i18n/config";
import { useLocale } from "@/components/i18n/LocaleProvider";

function Flag({ locale }: { locale: Locale }) {
  const country = LOCALE_FLAG[locale];
  return (
    <span
      className="inline-flex h-4 w-6 shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,0.12)]"
      aria-hidden
    >
      {country === "AR" ? (
        <svg viewBox="0 0 18 12" className="h-full w-full" focusable="false">
          <rect width="18" height="12" fill="#74ACDF" />
          <rect y="4" width="18" height="4" fill="#fff" />
          <circle cx="9" cy="6" r="1.55" fill="#F6B40E" />
        </svg>
      ) : null}
      {country === "US" ? (
        <svg viewBox="0 0 18 12" className="h-full w-full" focusable="false">
          <rect width="18" height="12" fill="#BF0A30" />
          <rect y="1.09" width="18" height="1.09" fill="#fff" />
          <rect y="3.27" width="18" height="1.09" fill="#fff" />
          <rect y="5.45" width="18" height="1.09" fill="#fff" />
          <rect y="7.64" width="18" height="1.09" fill="#fff" />
          <rect y="9.82" width="18" height="1.09" fill="#fff" />
          <rect width="8" height="6.55" fill="#002868" />
        </svg>
      ) : null}
      {country === "BR" ? (
        <svg viewBox="0 0 18 12" className="h-full w-full" focusable="false">
          <rect width="18" height="12" fill="#009B3A" />
          <polygon points="9,1.4 16.2,6 9,10.6 1.8,6" fill="#FEDD00" />
          <circle cx="9" cy="6" r="2.15" fill="#002776" />
        </svg>
      ) : null}
    </span>
  );
}

export function LanguageSwitcher({
  compact = false,
  variant = "onDark",
}: {
  compact?: boolean;
  variant?: "onDark" | "onLight";
}) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const triggerClass =
    variant === "onLight"
      ? "border-stone-300 bg-white text-stone-800 hover:bg-stone-50"
      : "border-white/25 bg-white/10 text-white hover:bg-white/15";

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(next: Locale) {
    setOpen(false);
    if (next === locale) {
      return;
    }
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t("language.label")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[#e6dac7]/50 sm:min-h-10 ${triggerClass} ${pending ? "opacity-70" : ""}`}
      >
        <Flag locale={locale} />
        <span>{compact ? locale.toUpperCase() : LOCALE_LABELS[locale]}</span>
        <span aria-hidden className="text-[10px] opacity-70">
          ▾
        </span>
      </button>
      {open ? (
        <ul
          id={menuId}
          role="listbox"
          aria-label={t("language.label")}
          className="absolute right-0 z-50 mt-2 min-w-40 overflow-hidden rounded-2xl border border-stone-200 bg-white py-1 text-stone-800 shadow-xl"
        >
          {LOCALES.map((code) => {
            const selected = code === locale;
            return (
              <li key={code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => choose(code)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-stone-50 ${
                    selected ? "bg-[#e6dac7]/35 font-semibold" : "font-medium"
                  }`}
                >
                  <Flag locale={code} />
                  <span>{LOCALE_LABELS[code]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
