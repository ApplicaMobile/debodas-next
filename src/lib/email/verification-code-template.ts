import { getMessages, t } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/config";
import { codeBlock, escapeHtml, layout } from "@/lib/email/templates";

/**
 * Email con el código de verificación del registro (6 dígitos).
 * Diseño de Punky; textos en i18n (`emailVerification.email*`).
 * El código NO va en el asunto (decisión de producto: no exponerlo en la vista previa de la bandeja).
 */
export function registrationCodeEmail(input: {
  locale: Locale;
  code: string;
  minutes: number;
  name?: string | null;
}): { subject: string; html: string } {
  const m = getMessages(input.locale);
  const code = input.code.replace(/\D/g, "");
  const name = input.name?.trim();
  const greeting = name
    ? t(m, "emailVerification.emailGreetingName", { name })
    : t(m, "emailVerification.emailGreeting");
  const body = [
    `<p>${escapeHtml(greeting)}</p>`,
    `<p>${escapeHtml(t(m, "emailVerification.emailIntro"))}</p>`,
    codeBlock({
      code,
      label: t(m, "emailVerification.emailCodeBoxLabel"),
      note: t(m, "emailVerification.emailExpiry", { minutes: input.minutes }),
    }),
    `<p>${escapeHtml(t(m, "emailVerification.emailExpiredHint"))}</p>`,
  ].join("\n");

  const info = [
    `<p style="margin:0 0 8px;"><strong style="color:#06263A;" class="db-text">${escapeHtml(t(m, "emailVerification.emailNotYouTitle"))}</strong> ${escapeHtml(t(m, "emailVerification.emailNotYou"))}</p>`,
    `<p style="margin:0;">${escapeHtml(t(m, "emailVerification.emailNeverShare"))}</p>`,
  ].join("\n");

  return {
    subject: t(m, "emailVerification.emailSubject"),
    html: layout(t(m, "emailVerification.emailTitle"), body, {
      lang: input.locale,
      signature: t(m, "emailVerification.emailSignature"),
      preheader: t(m, "emailVerification.emailPreheader", { minutes: input.minutes }),
      eyebrow: t(m, "emailVerification.emailEyebrow"),
      info,
      reason: t(m, "emailVerification.emailReason"),
    }),
  };
}
