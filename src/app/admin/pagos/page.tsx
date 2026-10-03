import Link from "next/link";
import { confirmGiftAdminAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db/prisma";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { IllustrationGift } from "@/components/account/AccountIllustrations";
import {
  AccountPageBody,
  AccountPageHeader,
  AccountSection,
  AccountTable,
  accountTableHeadClass,
  accountTableRowClass,
  accountTableTdClass,
  accountTableThClass,
} from "@/components/account/AccountPage";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import { Badge, Button, IconExternalLink } from "@/components/ui";

const PAGE_SIZE = 25;

function money(amount: { toString(): string }, currency: string) {
  const n = Number(amount.toString());
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency || "ARS",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

interface PageProps {
  searchParams: Promise<{ paymentsPage?: string; giftsPage?: string }>;
}

export default async function AdminPagosPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const [paymentsTotal, giftsTotal] = await Promise.all([
    prisma.payment.count(),
    prisma.confirmedGift.count(),
  ]);
  const paymentsTotalPages = Math.max(1, Math.ceil(paymentsTotal / PAGE_SIZE));
  const giftsTotalPages = Math.max(1, Math.ceil(giftsTotal / PAGE_SIZE));
  const requestedPaymentsPage = Number.parseInt(params.paymentsPage ?? "1", 10);
  const requestedGiftsPage = Number.parseInt(params.giftsPage ?? "1", 10);
  const paymentsPage = Math.min(
    Number.isFinite(requestedPaymentsPage) && requestedPaymentsPage > 0
      ? requestedPaymentsPage
      : 1,
    paymentsTotalPages,
  );
  const giftsPage = Math.min(
    Number.isFinite(requestedGiftsPage) && requestedGiftsPage > 0
      ? requestedGiftsPage
      : 1,
    giftsTotalPages,
  );

  const [payments, gifts] = await Promise.all([
    prisma.payment.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (paymentsPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        boda: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.confirmedGift.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (giftsPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        boda: { select: { id: true, title: true, slug: true } },
      },
    }),
  ]);

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/admin/pagos"
        area="Panel admin"
        section="Pagos"
        title="Pagos y regalos"
        description="Últimos registros de MercadoPago / transferencias."
        actions={
          <Button href="/admin/mercadopago" variant="secundario" size="sm">
            Configurar MercadoPago
          </Button>
        }
      />

      <AccountSection
        id="admin-pagos-payments"
        title="Pagos registrados"
        badge={
          <Badge tone="neutro" icon={false}>
            {paymentsTotal}
          </Badge>
        }
        description="Cobros de planes y otros pagos procesados por la plataforma."
      >
        {payments.length === 0 ? (
          <AccountEmptyState
            illustration={IllustrationGift}
            title="Sin pagos todavía."
            description="Cuando una pareja pague un plan, el registro va a aparecer acá."
          />
        ) : (
          <AccountTable caption="Pagos registrados" tableClassName="min-w-[680px]">
            <thead className={accountTableHeadClass}>
              <tr>
                <th scope="col" className={accountTableThClass}>Tipo</th>
                <th scope="col" className={accountTableThClass}>Boda</th>
                <th scope="col" className={`${accountTableThClass} text-right`}>Monto</th>
                <th scope="col" className={accountTableThClass}>Estado</th>
                <th scope="col" className={accountTableThClass}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className={accountTableRowClass}>
                  <td className={`${accountTableTdClass} capitalize`}>
                    {payment.type}
                    {payment.planTarget ? ` → ${payment.planTarget}` : ""}
                  </td>
                  <td className={accountTableTdClass}>
                    <Link
                      href={`/admin/bodas/${payment.boda.id}`}
                      className="focus-ring rounded-sm font-semibold text-text-link hover:underline"
                    >
                      {payment.boda.title}
                    </Link>
                  </td>
                  <td className={`${accountTableTdClass} whitespace-nowrap text-right tabular-nums`}>
                    {money(payment.amount, payment.currency)}
                  </td>
                  <td className={accountTableTdClass}>
                    <AdminStatusBadge kind="payment" status={payment.status} />
                  </td>
                  <td className={`${accountTableTdClass} whitespace-nowrap text-text-secondary`}>
                    {payment.createdAt.toLocaleString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </AccountTable>
        )}
        <AdminPagination
          pathname="/admin/pagos"
          currentPage={paymentsPage}
          totalPages={paymentsTotalPages}
          pageParam="paymentsPage"
          query={giftsPage > 1 ? { giftsPage: String(giftsPage) } : {}}
        />
      </AccountSection>

      <AccountSection
        id="admin-pagos-regalos"
        title="Regalos confirmados / pendientes"
        badge={
          <Badge tone="neutro" icon={false}>
            {giftsTotal}
          </Badge>
        }
        description="Regalos informados por los invitados. Confirmá los que ya fueron recibidos (pide confirmación)."
      >
        {gifts.length === 0 ? (
          <AccountEmptyState
            illustration={IllustrationGift}
            title="Sin regalos todavía."
            description="Cuando un invitado informe un regalo, va a aparecer acá."
          />
        ) : (
          <AccountTable caption="Regalos confirmados y pendientes" tableClassName="min-w-[760px]">
            <thead className={accountTableHeadClass}>
              <tr>
                <th scope="col" className={accountTableThClass}>De</th>
                <th scope="col" className={accountTableThClass}>Boda</th>
                <th scope="col" className={`${accountTableThClass} text-right`}>Monto</th>
                <th scope="col" className={accountTableThClass}>Método</th>
                <th scope="col" className={accountTableThClass}>Comprobante</th>
                <th scope="col" className={accountTableThClass}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {gifts.map((gift) => (
                <tr key={gift.id} className={accountTableRowClass}>
                  <td className={accountTableTdClass}>
                    <p className="font-semibold">{gift.participants}</p>
                    <p className="break-all type-caption text-text-secondary">
                      {gift.email || "—"}
                    </p>
                  </td>
                  <td className={accountTableTdClass}>
                    <Link
                      href={`/admin/bodas/${gift.boda.id}`}
                      className="focus-ring rounded-sm font-semibold text-text-link hover:underline"
                    >
                      {gift.boda.title}
                    </Link>
                  </td>
                  <td className={`${accountTableTdClass} whitespace-nowrap text-right tabular-nums`}>
                    {money(gift.amount, gift.currency)}
                  </td>
                  <td className={accountTableTdClass}>{gift.method}</td>
                  <td className={accountTableTdClass}>
                    {gift.voucherUrl ? (
                      <a
                        href={gift.voucherUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="focus-ring inline-flex items-center gap-1 rounded-sm font-semibold text-text-link hover:underline"
                      >
                        Ver voucher
                        <IconExternalLink size={14} />
                        <span className="sr-only"> (se abre en otra pestaña)</span>
                      </a>
                    ) : (
                      <span className="text-text-tertiary">—</span>
                    )}
                  </td>
                  <td className={accountTableTdClass}>
                    {gift.confirmed ? (
                      <Badge tone="aprobado">Confirmado</Badge>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="pendiente">Pendiente</Badge>
                        <AdminActionForm
                          action={confirmGiftAdminAction}
                          confirmMessage={`¿Confirmás que el regalo de ${gift.participants} fue recibido?`}
                        >
                          <input type="hidden" name="gift_id" value={gift.id} />
                          <AdminSubmitButton
                            idleLabel="Confirmar"
                            pendingLabel="Confirmando…"
                            variant="primario"
                          />
                        </AdminActionForm>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </AccountTable>
        )}
        <AdminPagination
          pathname="/admin/pagos"
          currentPage={giftsPage}
          totalPages={giftsTotalPages}
          pageParam="giftsPage"
          query={
            paymentsPage > 1
              ? { paymentsPage: String(paymentsPage) }
              : {}
          }
        />
      </AccountSection>
    </AccountPageBody>
  );
}
