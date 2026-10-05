"use client";

import { useActionState, useState } from "react";
import { submitPublicRsvpAction } from "@/lib/microsite/actions/rsvp";
import type { FormState } from "@/lib/account/form-state";
import { FormAlert } from "@/components/account/FormAlert";
import { HoneypotField } from "@/components/ui/HoneypotField";
import { MicrositeSectionTitle } from "@/components/themes/ThemeSection";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import {
  canChooseRsvpMenu,
  RSVP_MENU_OPTIONS,
} from "@/lib/rsvp/menu";

interface RsvpFormProps {
  slug: string;
  plan?: string | null;
  rsvpOpen: boolean;
  titleClass?: string;
}

const initialState: FormState = {};

export function RsvpForm({
  slug,
  plan,
  rsvpOpen,
  titleClass,
}: RsvpFormProps) {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(
    submitPublicRsvpAction,
    initialState,
  );
  const [status, setStatus] = useState<"confirmed" | "declined">("confirmed");
  const [extraGuests, setExtraGuests] = useState<string[]>([]);
  const showMenu = canChooseRsvpMenu(plan) && status === "confirmed";

  if (state.success) {
    return (
      <div className="microsite-rsvp-box">
        <MicrositeSectionTitle className={titleClass ?? ""}>
          {t("microsite.rsvp")}
        </MicrositeSectionTitle>
        <div className="mt-5 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-5 text-center">
          <p className="text-2xl text-emerald-700" aria-hidden>
            ✓
          </p>
          <p className="mt-2 text-sm font-medium text-emerald-900">
            {state.success}
          </p>
          <p className="mt-2 type-caption text-emerald-800/80">
            {t("microsite.rsvpReceived")}
          </p>
        </div>
      </div>
    );
  }

  if (!rsvpOpen) {
    return (
      <div className="microsite-rsvp-box">
        <MicrositeSectionTitle className={titleClass ?? ""}>
          {t("microsite.rsvp")}
        </MicrositeSectionTitle>
        <div className="mt-4 rounded-2xl border border-stone-200/80 bg-white/80 px-4 py-5 text-center">
          <p className="text-sm font-medium text-stone-800">
            {t("microsite.rsvpClosedTitle")}
          </p>
          <p className="mt-2 text-sm text-[var(--theme-text-muted)]">
            {t("microsite.rsvpClosedLead")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="microsite-rsvp-box">
      <MicrositeSectionTitle className={titleClass ?? ""}>
        {t("microsite.rsvp")}
      </MicrositeSectionTitle>
      <p className="mt-3 text-sm text-[var(--theme-text-muted)]">
        {t("microsite.rsvpLead")}
      </p>

      <form
        action={formAction}
        aria-busy={isPending}
        className="mt-6 space-y-4"
      >
        <input type="hidden" name="boda_slug" value={slug} />
        <HoneypotField id="rsvp-website" />

        <div className="space-y-1.5">
          <label htmlFor="rsvp-name" className="microsite-rsvp-label">
            {t("microsite.rsvpName")}
          </label>
          <input
            id="rsvp-name"
            name="name"
            required
            minLength={2}
            maxLength={120}
            className="microsite-rsvp-input"
            placeholder={t("microsite.rsvpNamePlaceholder")}
            autoComplete="name"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="rsvp-email" className="microsite-rsvp-label">
            {t("microsite.rsvpEmail")}
          </label>
          <input
            id="rsvp-email"
            name="email"
            type="email"
            maxLength={254}
            className="microsite-rsvp-input"
            placeholder={t("microsite.rsvpEmail")}
            autoComplete="email"
          />
        </div>

        <fieldset className="space-y-1.5">
          <legend className="microsite-rsvp-label">
            {t("microsite.rsvpGoing")}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label
              className={`microsite-rsvp-choice${
                status === "confirmed" ? " microsite-rsvp-choice--selected" : ""
              }`}
            >
              <input
                type="radio"
                name="status"
                value="confirmed"
                checked={status === "confirmed"}
                onChange={() => setStatus("confirmed")}
                required
                className="sr-only"
              />
              <span className="microsite-rsvp-choice__dot" aria-hidden="true" />
              {t("microsite.rsvpYes")}
            </label>
            <label
              className={`microsite-rsvp-choice${
                status === "declined" ? " microsite-rsvp-choice--selected" : ""
              }`}
            >
              <input
                type="radio"
                name="status"
                value="declined"
                checked={status === "declined"}
                onChange={() => setStatus("declined")}
                required
                className="sr-only"
              />
              <span className="microsite-rsvp-choice__dot" aria-hidden="true" />
              {t("microsite.rsvpNo")}
            </label>
          </div>
        </fieldset>

        {status === "confirmed" ? (
          <div className="space-y-3">
            {extraGuests.map((guestName, index) => (
              <div key={index} className="rounded-xl border border-stone-200/80 bg-white/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={`extra-guest-${index}`}
                    className="microsite-rsvp-label"
                  >
                    {t("microsite.rsvpExtra", { n: index + 1 })}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setExtraGuests((current) =>
                        current.filter((_, guestIndex) => guestIndex !== index),
                      )
                    }
                    className="inline-flex min-h-11 items-center type-caption font-medium text-red-600 hover:underline"
                  >
                    {t("microsite.rsvpRemove")}
                  </button>
                </div>
                <input
                  id={`extra-guest-${index}`}
                  name={`extra_guest_name_${index}`}
                  required
                  minLength={2}
                  maxLength={120}
                  defaultValue={guestName}
                  className="microsite-rsvp-input mt-2"
                  placeholder={t("microsite.rsvpName")}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setExtraGuests((current) => [...current, ""])}
              className="microsite-rsvp-add hover:underline"
            >
              {t("microsite.rsvpAdd")}
            </button>
          </div>
        ) : null}

        {showMenu ? (
          <label className="microsite-rsvp-label">
            {t("microsite.rsvpMenu")}
            <select
              name="menu"
              defaultValue="general"
              className="microsite-rsvp-input mt-1.5 font-normal"
            >
              {RSVP_MENU_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input type="hidden" name="menu" value="general" />
        )}

        <div className="space-y-1.5">
          <label htmlFor="rsvp-notes" className="microsite-rsvp-label">
            {t("microsite.rsvpNotes")}
          </label>
          <textarea
            id="rsvp-notes"
            name="notes"
            rows={2}
            maxLength={1000}
            className="microsite-rsvp-input"
            placeholder={t("microsite.rsvpNotes")}
          />
        </div>

        <FormAlert error={state.error} />

        <button
          type="submit"
          disabled={isPending}
          className="microsite-btn microsite-btn--lg w-full disabled:opacity-60"
        >
          {isPending ? t("microsite.rsvpSending") : t("microsite.rsvpSubmit")}
        </button>
      </form>
    </div>
  );
}
