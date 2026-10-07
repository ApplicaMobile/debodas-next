import { getMessages, t } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/config";
import { calloutBlock, codeBlock, escapeHtml, layout } from "@/lib/email/templates";

/**
 * Email con el código de borrado de cuenta (base de emails de DeBodas, tono "danger").
 * Plantilla aislada: solo depende de los helpers exportados por templates.ts.
 */
export function accountDeletionCodeEmail(input: {
  locale: Locale;
  code: string;
  minutes: number;
}): { subject: string; html: string } {
  const m = getMessages(input.locale);
  const body = [
    `<p>${escapeHtml(t(m, "accountDeletion.emailGreeting"))}</p>`,
    `<p>${escapeHtml(t(m, "accountDeletion.emailIntro"))} ${escapeHtml(t(m, "accountDeletion.emailCodeLabel"))}</p>`,
    codeBlock({
      code: input.code,
      label: t(m, "accountDeletion.emailCodeBoxLabel"),
      note: t(m, "accountDeletion.emailExpiry", { minutes: input.minutes }),
    }),
    calloutBlock({
      title: t(m, "accountDeletion.emailPermanentTitle"),
      text: t(m, "accountDeletion.emailWarning"),
    }),
  ].join("\n");

  const info = `<p style="margin:0;"><strong class="db-text" style="color:#06263A;">${escapeHtml(t(m, "accountDeletion.emailIgnore"))}</strong></p>`;

  return {
    subject: t(m, "accountDeletion.emailSubject"),
    html: layout(t(m, "accountDeletion.emailTitle"), body, {
      lang: input.locale,
      signature: t(m, "accountDeletion.emailSignature"),
      preheader: t(m, "accountDeletion.emailPreheader", { minutes: input.minutes }),
      eyebrow: t(m, "accountDeletion.emailEyebrow"),
      info,
      reason: t(m, "accountDeletion.emailReason"),
      tone: "danger",
    }),
  };
}
