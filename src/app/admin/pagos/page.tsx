import Link from "next/link";
import { confirmGiftAdminAction } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db/prisma";

function money(amount: { toString(): string }, currency: string) {
  const n = Number(amount.toString());
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency || "ARS",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export default async function AdminPagosPage() {
  await requireAdmin();

  const [payments, gifts] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        boda: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.confirmedGift.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        boda: { select: { id: true, title: true, slug: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          Pagos y regalos
        </h2>
        <p className="mt-2 text-stone-600">
          Últimos registros de MercadoPago / transferencias.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="px-1 text-sm font-semibold uppercase tracking-wide text-stone-500">
          Payments
        </h3>
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Boda</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 capitalize text-stone-800">
                      {payment.type}
                      {payment.planTarget ? ` → ${payment.planTarget}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bodas/${payment.boda.id}`}
                        className="text-[#06263a] hover:underline"
                      >
                        {payment.boda.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {money(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3">{payment.status}</td>
                    <td className="px-4 py-3 text-stone-500">
                      {payment.createdAt.toLocaleString("es-AR")}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-stone-500"
                    >
                      Sin pagos todavía.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="px-1 text-sm font-semibold uppercase tracking-wide text-stone-500">
          Regalos confirmados / pendientes
        </h3>
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">De</th>
                  <th className="px-4 py-3">Boda</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Comprobante</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {gifts.map((gift) => (
                  <tr key={gift.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-800">
                        {gift.participants}
                      </p>
                      <p className="text-xs text-stone-500">
                        {gift.email || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bodas/${gift.boda.id}`}
                        className="text-[#06263a] hover:underline"
                      >
                        {gift.boda.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {money(gift.amount, gift.currency)}
                    </td>
                    <td className="px-4 py-3">{gift.method}</td>
                    <td className="px-4 py-3">
                      {gift.voucherUrl ? (
                        <a
                          href={gift.voucherUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-[#e6dac7] underline"
                        >
                          Ver voucher
                        </a>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {gift.confirmed ? (
                        <span className="text-emerald-700">Confirmado</span>
                      ) : (
                        <form action={confirmGiftAdminAction}>
                          <input type="hidden" name="gift_id" value={gift.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-[#e6dac7] px-3 py-1.5 text-xs font-semibold text-stone-800"
                          >
                            Confirmar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
                {gifts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-stone-500"
                    >
                      Sin regalos todavía.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
