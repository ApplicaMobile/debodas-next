import { getMessages, t } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/config";
import { escapeHtml, layout } from "@/lib/email/templates";

/**
 * Email de "restablecer contraseña" sobre la base nueva: botón (CTA bulletproof)
 * + enlace de respaldo que agrega emailButton(). Textos en i18n (`passwordReset.email*`).
 */
export function passwordResetEmail(input: {
  locale: Locale;
  resetUrl: string;
  name?: string | null;
  minutes: number;
}): { subject: string; html: string } {
  const m = getMessages(input.locale);
  const name = input.name?.trim();
  const greeting = name
    ? t(m, "passwordReset.emailGreetingName", { name })
    : t(m, "passwordReset.emailGreeting");
  const body = [
    `<p>${escapeHtml(greeting)}</p>`,
    `<p>${escapeHtml(t(m, "passwordReset.emailIntro", { minutes: input.minutes }))}</p>`,
  ].join("\n");
  const info = `<p style="margin:0;"><strong class="db-text" style="color:#06263A;">${escapeHtml(t(m, "passwordReset.emailNotYouTitle"))}</strong> ${escapeHtml(t(m, "passwordReset.emailNotYou"))}</p>`;

  return {
    subject: t(m, "passwordReset.emailSubject"),
    html: layout(t(m, "passwordReset.emailTitle"), body, {
      lang: input.locale,
      signature: t(m, "passwordReset.emailSignature"),
      preheader: t(m, "passwordReset.emailPreheader", { minutes: input.minutes }),
      eyebrow: t(m, "passwordReset.emailEyebrow"),
      cta: { label: t(m, "passwordReset.emailButton"), href: input.resetUrl },
      info,
      reason: t(m, "passwordReset.emailReason"),
    }),
  };
}
