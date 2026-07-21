import { prisma } from "@/lib/db/prisma";
import { getCoupleDisplayName } from "@/data/bodas";
import type { Boda as BodaShape } from "@/types/boda";
import { getAdminEmail, getAppUrl } from "@/lib/email/client";
import { enqueueEmail } from "@/lib/email/queue";
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
  notificationId?: string;
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

  await enqueueEmail({
    to: boda.user.email,
    subject: mail.subject,
    html: mail.html,
    replyTo: input.guestEmail || undefined,
    type: "rsvp",
    dedupeKey: input.notificationId
      ? `rsvp:${input.notificationId}:couple`
      : undefined,
    meta: { bodaId: input.bodaId },
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
  notificationId?: string;
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

  await enqueueEmail({
    to: boda.user.email,
    subject: mail.subject,
    html: mail.html,
    type: "gift",
    dedupeKey: input.notificationId
      ? `gift:${input.notificationId}:couple`
      : undefined,
    meta: { bodaId: input.bodaId },
  });
}

export async function notifyPlanConfirmed(input: {
  bodaId: string;
  planTarget: string;
  amount: number | string;
  notificationId?: string;
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

  await enqueueEmail({
    to: boda.user.email,
    subject: mail.subject,
    html: mail.html,
    type: "plan_confirmed",
    dedupeKey: input.notificationId
      ? `plan:${input.notificationId}:couple`
      : undefined,
    meta: { bodaId: input.bodaId },
  });
}

export async function notifyRatingRequest(input: {
  to: string;
  coupleName: string;
  bodaId: string;
}) {
  const mail = ratingRequestEmail({
    coupleName: input.coupleName,
    rateUrl: `${getAppUrl()}/calificar?bodaId=${encodeURIComponent(input.bodaId)}`,
  });

  return enqueueEmail({
    to: input.to,
    subject: mail.subject,
    html: mail.html,
    type: "rating_request",
    dedupeKey: `rating-request:${input.bodaId}`,
    meta: { bodaId: input.bodaId },
  });
}

export async function notifyRatingSubmitted(input: {
  coupleName: string;
  name: string;
  email: string;
  score: number;
  comment: string | null;
  ratingId?: string;
}): Promise<void> {
  const thanks = ratingThanksEmail({ name: input.name });
  await enqueueEmail({
    to: input.email,
    subject: thanks.subject,
    html: thanks.html,
    type: "rating_thanks",
    dedupeKey: input.ratingId
      ? `rating:${input.ratingId}:thanks`
      : undefined,
  });

  const admin = getAdminEmail();
  if (admin) {
    const adminMail = ratingAdminEmail(input);
    await enqueueEmail({
      to: admin,
      subject: adminMail.subject,
      html: adminMail.html,
      replyTo: input.email,
      type: "rating_admin",
      dedupeKey: input.ratingId
        ? `rating:${input.ratingId}:admin`
        : undefined,
    });
  }
}
