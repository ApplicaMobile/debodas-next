import Link from "next/link";
import {
  resetRatingEmailFlagAction,
  sendRatingRequestAction,
  updateBodaOnlineAction,
  updateBodaPlanAction,
} from "@/lib/admin/actions";
import {
  coupleLabel,
  eventDateFromJson,
  phoneFromCouple,
} from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db/prisma";
import { getAppUrl } from "@/lib/email/client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}

export default async function AdminBodaDetailPage({
  params,
  searchParams,
}: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const flash = await searchParams;

  const boda = await prisma.boda.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
      ratings: { orderBy: { createdAt: "desc" } },
      _count: {
        select: {
          gifts: true,
          rsvpGuests: true,
          confirmedGifts: true,
          payments: true,
          scheduleItems: true,
          faqItems: true,
        },
      },
    },
  });

  if (!boda) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-stone-600">No encontramos esta boda.</p>
        <Link href="/admin/bodas" className="mt-4 inline-block text-[#e6dac7]">
          ← Volver
        </Link>
      </div>
    );
  }

  const rateUrl = `${getAppUrl()}/calificar?bodaId=${boda.id}`;

  return (
    <div className="space-y-6">
      {flash.ok ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {flash.ok}
        </p>
      ) : null}
      {flash.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {flash.error === "sin-email"
            ? "La pareja no tiene email."
            : flash.error === "ya-calificada"
              ? "Esta boda ya tiene una calificación."
              : flash.error}
        </p>
      ) : null}

      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <Link
          href="/admin/bodas"
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          ← Bodas
        </Link>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-stone-800">
          {coupleLabel(boda.couple, boda.title)}
        </h2>
        <p className="mt-1 text-stone-600">
          /{boda.slug} · tema {boda.micrositeTheme}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/bodas/${boda.slug}`}
            target="_blank"
            className="rounded-full bg-[#e6dac7] px-4 py-2 text-sm font-semibold text-stone-800"
          >
            Ver micrositio ↗
          </Link>
          <a
            href={rateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
          >
            Link calificar
          </a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "RSVP", value: boda._count.rsvpGuests },
          { label: "Regalos lista", value: boda._count.gifts },
          { label: "Regalos recibidos", value: boda._count.confirmedGifts },
          { label: "Pagos", value: boda._count.payments },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-stone-500">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-stone-800">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-800">Datos</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-stone-500">Fecha evento</dt>
              <dd className="font-medium text-stone-800">
                {eventDateFromJson(boda.event)}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Teléfono</dt>
              <dd className="font-medium text-stone-800">
                {phoneFromCouple(boda.couple)}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Dueño</dt>
              <dd className="font-medium text-stone-800">
                {boda.user.name || "—"}
                <br />
                <span className="text-stone-500">{boda.user.email}</span>
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Micrositio</dt>
              <dd className="font-medium text-stone-800">
                {boda.isOnline ? "Online" : "Offline"}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Alta</dt>
              <dd className="font-medium text-stone-800">
                {boda.createdAt.toLocaleString("es-AR")}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Mail calificación</dt>
              <dd className="font-medium text-stone-800">
                {boda.ratingEmailSentAt
                  ? `Enviado ${boda.ratingEmailSentAt.toLocaleString("es-AR")}`
                  : "No enviado"}
              </dd>
            </div>
          </dl>

          <form action={updateBodaPlanAction} className="mt-6 flex gap-2">
            <input type="hidden" name="boda_id" value={boda.id} />
            <select
              name="plan"
              defaultValue={boda.plan}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
            >
              <option value="free">free</option>
              <option value="basico">basico</option>
              <option value="premium">premium</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-stone-800 px-3 py-2 text-xs font-semibold text-white"
            >
              Guardar plan
            </button>
          </form>

          <form
            action={updateBodaOnlineAction}
            className="mt-3 flex items-center gap-3"
          >
            <input type="hidden" name="boda_id" value={boda.id} />
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="is_online"
                defaultChecked={boda.isOnline}
                className="h-4 w-4 rounded border-stone-300"
              />
              Micrositio online
            </label>
            <button
              type="submit"
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700"
            >
              Guardar
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-800">
            Calificación
          </h3>
          <p className="mt-2 text-sm text-stone-600">
            Cronograma FAQ: {boda._count.scheduleItems} ítems ·{" "}
            {boda._count.faqItems} FAQs
          </p>

          {boda.ratings.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {boda.ratings.map((rating) => (
                <li
                  key={rating.id}
                  className="rounded-2xl bg-stone-50 p-4 text-sm"
                >
                  <p className="font-medium text-stone-800">
                    {rating.name} · {rating.score}/5 · {rating.status}
                  </p>
                  {rating.comment ? (
                    <p className="mt-1 text-stone-600">{rating.comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-stone-600">
                Todavía no hay calificación. Podés enviar el pedido por email.
              </p>
              <form action={sendRatingRequestAction}>
                <input type="hidden" name="boda_id" value={boda.id} />
                <button
                  type="submit"
                  className="rounded-full bg-[#e6dac7] px-4 py-2 text-sm font-semibold text-stone-800"
                >
                  Enviar pedido de calificación
                </button>
              </form>
              {boda.ratingEmailSentAt ? (
                <form action={resetRatingEmailFlagAction}>
                  <input type="hidden" name="boda_id" value={boda.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-stone-500 underline"
                  >
                    Resetear flag de email enviado (para cron)
                  </button>
                </form>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
