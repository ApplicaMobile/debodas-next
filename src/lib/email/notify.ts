import { prisma } from "@/lib/db/prisma";
import { getCoupleDisplayName } from "@/data/bodas";
import type { Boda as BodaShape } from "@/types/boda";
import { getAdminEmail, getAppUrl, sendEmail } from "@/lib/email/client";
import {
  giftToCoupleEmail,
  planConfirmedEmail,
  ratingAdminEmail,
  ratingRequestEmail,
  ratingThanksEmail,
  rsvpToCoupleEmail,
} from "@/lib/email/templates";

function coupleNameFromJson(couple: unknown, fallback: string): string {
  return getCoupleDisplayName((couple ?? {}) as BodaShape["couple"]) || fallback;
}

function formatMoney(amount: number | string, currency = "ARS"): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  const value = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

async function getBodaOwner(bodaId: string) {
  return prisma.boda.findUnique({
    where: { id: bodaId },
    select: {
      id: true,
      slug: true,
      title: true,
      couple: true,
      user: { select: { email: true, name: true } },
    },
  });
}

export async function notifyNoviosRsvp(input: {
  bodaId: string;
  guestName: string;
  status: string;
  menu?: string;
  notes?: string | null;
  guestEmail?: string | null;
}): Promise<void> {
  const boda = await getBodaOwner(input.bodaId);
  if (!boda?.user.email) return;

  const coupleName = coupleNameFromJson(boda.couple, boda.title);
  const mail = rsvpToCoupleEmail({
    coupleName,
    guestName: input.guestName,
    status: input.status,
    menu: input.menu,
    notes: input.notes,
    guestEmail: input.guestEmail,
    invitadosUrl: `${getAppUrl()}/mi-cuenta/invitados`,
  });

  await sendEmail({
    to: boda.user.email,
    subject: mail.subject,
    html: mail.html,
    replyTo: input.guestEmail || undefined,
  });
}

export async function notifyNoviosGift(input: {
  bodaId: string;
  participants: string;
  amount: number | string;
  currency?: string;
  method: string;
  pending: boolean;
  items: Array<{ title?: string; quantity?: number }>;
}): Promise<void> {
  const boda = await getBodaOwner(input.bodaId);
  if (!boda?.user.email) return;

  const coupleName = coupleNameFromJson(boda.couple, boda.title);
  const methodLabels: Record<string, string> = {
    mp_checkout: "Mercado Pago",
    bank_transfer: "Transferencia ARS",
    bank_transfer_usd: "Transferencia USD",
    mp_alias_cvu: "Alias / CVU Mercado Pago",
  };

  const itemsSummary =
    input.items
      .map((item) => {
        const qty = item.quantity && item.quantity > 1 ? ` x${item.quantity}` : "";
        return `${item.title ?? "Regalo"}${qty}`;
      })
      .join(", ") || "Sin detalle";

  const mail = giftToCoupleEmail({
    coupleName,
    participants: input.participants,
    amountLabel: formatMoney(input.amount, input.currency ?? "ARS"),
    methodLabel: methodLabels[input.method] ?? input.method,
    pending: input.pending,
    itemsSummary,
    panelUrl: `${getAppUrl()}/mi-cuenta/regalos-recibidos`,
  });

  await sendEmail({
    to: boda.user.email,
    subject: mail.subject,
    html: mail.html,
  });
}

export async function notifyPlanConfirmed(input: {
  bodaId: string;
  planTarget: string;
  amount: number | string;
}): Promise<void> {
  const boda = await getBodaOwner(input.bodaId);
  if (!boda?.user.email) return;

  const coupleName =
    boda.user.name || coupleNameFromJson(boda.couple, boda.title);
  const planLabel =
    input.planTarget.charAt(0).toUpperCase() + input.planTarget.slice(1);

  const mail = planConfirmedEmail({
    coupleName,
    planLabel,
    amountLabel: formatMoney(input.amount),
    panelUrl: `${getAppUrl()}/mi-cuenta/plan`,
  });

  await sendEmail({
    to: boda.user.email,
    subject: mail.subject,
    html: mail.html,
  });
}

export async function notifyRatingRequest(input: {
  to: string;
  coupleName: string;
  bodaId: string;
}): Promise<{ skipped: boolean; simulated?: boolean; id?: string }> {
  const mail = ratingRequestEmail({
    coupleName: input.coupleName,
    rateUrl: `${getAppUrl()}/calificar?bodaId=${encodeURIComponent(input.bodaId)}`,
  });

  return sendEmail({
    to: input.to,
    subject: mail.subject,
    html: mail.html,
    meta: { type: "rating_request", bodaId: input.bodaId },
  });
}

export async function notifyRatingSubmitted(input: {
  coupleName: string;
  name: string;
  email: string;
  score: number;
  comment: string | null;
}): Promise<void> {
  const thanks = ratingThanksEmail({ name: input.name });
  await sendEmail({
    to: input.email,
    subject: thanks.subject,
    html: thanks.html,
  });

  const admin = getAdminEmail();
  if (admin) {
    const adminMail = ratingAdminEmail(input);
    await sendEmail({
      to: admin,
      subject: adminMail.subject,
      html: adminMail.html,
      replyTo: input.email,
    });
  }
}

/** Fire-and-forget helper: never throws to callers. */
export function queueEmail(task: () => Promise<void>): void {
  void task().catch((err) => {
    console.error("[email] background send failed:", err);
  });
}
