"use client";

import { useActionState } from "react";
import { formatPrice } from "@/data/bodas";
import { confirmReceivedGiftAction } from "@/lib/microsite/actions/gift-checkout";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { IllustrationGift } from "@/components/account/AccountIllustrations";
import {
  AccountRowActions,
  AccountSection,
} from "@/components/account/AccountPage";
import { FormAlert } from "@/components/account/FormAlert";
import { Badge, Card, IconButton, IconCheck } from "@/components/ui";

interface ConfirmedGiftRow {
  id: string;
  participants: string;
  email: string | null;
  phone: string | null;
  dedication: string | null;
  method: string;
  amount: number;
  currency: string;
  confirmed: boolean;
  voucherUrl: string | null;
  createdAt: string;
  items: Array<{
    title?: string;
    quantity?: number;
    unitPrice?: number;
  }>;
}

interface ConfirmedGiftsPanelProps {
  gifts: ConfirmedGiftRow[];
}

const METHOD_LABELS: Record<string, string> = {
  mp_checkout: "Mercado Pago",
  mp_transfer: "Transferencia MP",
  bank_transfer_ars: "Transferencia ARS",
  bank_transfer_usd: "Transferencia USD",
  paypal: "PayPal",
};

const initialState: { error?: string; success?: string } = {};

function isImageVoucher(url: string): boolean {
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url);
}

function VoucherPreview({ url }: { url: string }) {
  if (isImageVoucher(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="focus-ring mt-4 block overflow-hidden rounded-md border border-border-subtle bg-surface-muted"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Comprobante de transferencia"
          className="max-h-48 w-full object-contain"
        />
        <p className="px-3 py-2 text-center type-caption font-semibold text-text-link">
          Ver comprobante en tamaño completo ↗
        </p>
      </a>
    );
  }

  return (
    <p className="mt-4 type-body-sm">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="focus-ring inline-flex items-center gap-1 rounded-sm font-semibold text-text-link underline underline-offset-2"
      >
        Ver comprobante (PDF) ↗
      </a>
    </p>
  );
}

function ConfirmGiftButton({ giftId }: { giftId: string }) {
  const [state, formAction, isPending] = useActionState(
    confirmReceivedGiftAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="gift_id" value={giftId} />
      <FormAlert error={state.error} success={state.success} />
      <AccountRowActions className="justify-end">
        <IconButton
          type="submit"
          label={isPending ? "Confirmando…" : "Acreditar regalo"}
          icon={<IconCheck />}
          variant="primary"
          loading={isPending}
        />
      </AccountRowActions>
    </form>
  );
}

function GiftCard({ gift }: { gift: ConfirmedGiftRow }) {
  const pending = !gift.confirmed;

  return (
    <Card
      as="article"
      padding="md"
      elevation={0}
      bordered
      className={pending ? "border-l-4 border-l-status-warning-border" : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="type-label text-text-primary">{gift.participants}</p>
          <p className="mt-0.5 type-body-sm tabular-nums text-text-secondary">
            {METHOD_LABELS[gift.method] ?? gift.method} ·{" "}
            {formatPrice(gift.amount)} {gift.currency}
          </p>
          <p className="type-caption text-text-tertiary">
            {new Date(gift.createdAt).toLocaleString("es-AR")}
          </p>
        </div>
        {gift.confirmed ? (
          <Badge tone="aprobado">Acreditado</Badge>
        ) : (
          <Badge tone="pendiente">Revisar</Badge>
        )}
      </div>

      {gift.items.length > 0 ? (
        <ul className="mt-4 space-y-1 rounded-md bg-surface-muted px-3 py-2 type-body-sm text-text-secondary">
          {gift.items.map((item, index) => (
            <li key={`${gift.id}-${index}`}>
              {item.quantity ?? 1} × {item.title ?? "Regalo"} —{" "}
              {formatPrice(item.unitPrice ?? 0)}
            </li>
          ))}
        </ul>
      ) : null}

      {gift.dedication ? (
        <p className="mt-3 type-body-sm italic text-text-secondary">
          “{gift.dedication}”
        </p>
      ) : null}

      {(gift.email || gift.phone) && (
        <p className="mt-2 type-caption text-text-secondary">
          {[gift.email, gift.phone].filter(Boolean).join(" · ")}
        </p>
      )}

      {gift.voucherUrl ? <VoucherPreview url={gift.voucherUrl} /> : null}

      {pending ? (
        <p className="mt-4 type-body-sm text-status-warning-fg">
          Revisá el comprobante (si hay) y acreditá el regalo para que quede
          registrado en tu lista.
        </p>
      ) : null}

      {pending ? <ConfirmGiftButton giftId={gift.id} /> : null}
    </Card>
  );
}

export function ConfirmedGiftsPanel({ gifts }: ConfirmedGiftsPanelProps) {
  const pending = gifts.filter((g) => !g.confirmed);
  const confirmed = gifts.filter((g) => g.confirmed);

  if (gifts.length === 0) {
    return (
      <AccountSection id="regalos-recibidos-vacio" title="Regalos recibidos">
        <AccountEmptyState
          illustration={IllustrationGift}
          title="Todavía no recibiste regalos"
          description="Cuando un invitado complete un regalo desde el micrositio, va a aparecer acá para que lo confirmes."
          actions={[
            {
              label: "Armar lista de regalos",
              href: "/mi-cuenta/regalos",
              primary: true,
            },
            { label: "Métodos de pago", href: "/mi-cuenta/pagos" },
            { label: "Compartir / invitar", href: "/mi-cuenta/invitar" },
          ]}
        />
      </AccountSection>
    );
  }

  return (
    <>
      {pending.length > 0 ? (
        <AccountSection
          id="regalos-pendientes"
          title="Pendientes de revisión"
          badge={<Badge tone="pendiente">{pending.length}</Badge>}
          description={`${pending.length} regalo${pending.length === 1 ? "" : "s"} esperan tu confirmación.`}
        >
          <div className="space-y-4">
            {pending.map((gift) => <GiftCard key={gift.id} gift={gift} />)}
          </div>
        </AccountSection>
      ) : null}

      {confirmed.length > 0 ? (
        <AccountSection
          id="regalos-acreditados"
          title={pending.length > 0 ? "Ya acreditados" : "Todos los regalos"}
          badge={<Badge tone="aprobado">{confirmed.length}</Badge>}
          description={`${confirmed.length} regalo${confirmed.length === 1 ? "" : "s"} confirmado${confirmed.length === 1 ? "" : "s"}.`}
        >
          <div className="space-y-4">
            {confirmed.map((gift) => <GiftCard key={gift.id} gift={gift} />)}
          </div>
        </AccountSection>
      ) : null}
    </>
  );
}
