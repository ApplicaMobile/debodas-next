import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { accountSections } from "@/lib/account/sections";
import { prisma } from "@/lib/db/prisma";
import { getMicrositePassword } from "@/lib/microsite/password";

function parseJsonObject(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as Record<string, unknown>;
}

function optionEnabled(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

export default async function MiCuentaPage() {
  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
          boda: {
            include: {
              gifts: { select: { id: true }, take: 1 },
              scheduleItems: { select: { id: true }, take: 1 },
              rsvpGuests: { select: { id: true }, take: 1 },
            },
          },
        },
      })
    : null;

  const pendingGiftsCount = user?.boda
    ? await prisma.confirmedGift.count({
        where: { bodaId: user.boda.id, confirmed: false },
      })
    : 0;

  const editableSections = accountSections.filter(
    (item) => !item.exact && item.available,
  );

  const boda = user?.boda;
  const options = parseJsonObject(boda?.options);
  const banner = parseJsonObject(boda?.banner);
  const bannerImage = banner.image as { url?: string } | undefined;
  const hasBanner = Boolean(bannerImage?.url || boda?.featuredImageUrl);
  const hasGifts = Boolean(boda?.gifts?.length);
  const hasPayments =
    optionEnabled(options.transfer) ||
    optionEnabled(options.mercadopago) ||
    Boolean(String(options.alias ?? "").trim()) ||
    Boolean(String(options.cbu ?? "").trim());
  const hasSchedule = Boolean(boda?.scheduleItems?.length);
  const hasRsvp = Boolean(boda?.rsvpGuests?.length);
  const checklist = boda
    ? [
        {
          id: "tema",
          label: "Elegí el tema del micrositio",
          done: Boolean(boda.micrositeTheme),
          href: "/mi-cuenta/tema",
        },
        {
          id: "banner",
          label: "Subí una foto de banner",
          done: hasBanner,
          href: "/mi-cuenta/banner",
        },
        {
          id: "regalos",
          label: "Armá la lista de regalos",
          done: hasGifts,
          href: "/mi-cuenta/regalos",
        },
        {
          id: "pagos",
          label: "Configurá un método de pago",
          done: hasPayments,
          href: "/mi-cuenta/pagos",
        },
        {
          id: "rsvp",
          label: "Revisá invitados / RSVP",
          done: hasRsvp,
          href: "/mi-cuenta/invitados",
          optional: true,
        },
        {
          id: "cronograma",
          label: "Agregá el cronograma (opcional)",
          done: hasSchedule,
          href: "/mi-cuenta/cronograma",
          optional: true,
        },
        {
          id: "invitar",
          label: "Compartí el link con tus invitados",
          done: false,
          href: "/mi-cuenta/invitar",
          alwaysShow: true,
        },
      ]
    : [];

  const pendingSetup = checklist.filter(
    (item) => !item.done && !(item.optional && item.done),
  );
  const pendingRequired = checklist.filter(
    (item) => !item.optional && !item.done && item.id !== "invitar",
  );
  const setupReady = pendingRequired.length === 0;
  const hasPassword = boda
    ? Boolean(getMicrositePassword(boda.options))
    : false;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h2 className="font-serif text-xl font-semibold text-stone-800 sm:text-2xl">
          Bienvenido{user?.name ? `, ${user.name}` : ""}
        </h2>
        <p className="mt-2 text-stone-600">
          Editá tu micrositio desde el panel. Los cambios se reflejan en el
          sitio público al guardar.
        </p>
        {boda ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                Plan
              </p>
              <p className="mt-1 font-semibold capitalize text-stone-800">
                {boda.plan}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                Tema
              </p>
              <p className="mt-1 font-semibold text-stone-800">
                {boda.micrositeTheme}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                Regalos pendientes
              </p>
              <p className="mt-1 font-semibold text-stone-800">
                {pendingGiftsCount}
              </p>
              {pendingGiftsCount > 0 ? (
                <Link
                  href="/mi-cuenta/regalos-recibidos"
                  className="mt-2 inline-block text-sm font-medium text-[#6f5f47] hover:underline"
                >
                  Revisar →
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        {boda ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/mi-cuenta/invitar"
              className="inline-flex rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Compartir / invitar
            </Link>
            <Link
              href={`/bodas/${boda.slug}`}
              target="_blank"
              className="inline-flex rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800"
            >
              Ver micrositio ↗
            </Link>
          </div>
        ) : null}
      </section>

      {boda ? (
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-stone-800">
                Prepará tu sitio
              </h3>
              <p className="mt-1 text-sm text-stone-600">
                {setupReady
                  ? "Tu micrositio ya tiene lo esencial. ¡Compartilo con tus invitados!"
                  : "Completá estos pasos para dejar el micrositio listo para compartir."}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                setupReady
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-amber-50 text-amber-900"
              }`}
            >
              {setupReady ? "Listo para compartir" : "En progreso"}
              {hasPassword ? " · Con contraseña" : ""}
            </span>
          </div>

          <ul className="mt-5 space-y-2">
            {checklist.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 px-4 py-3 hover:bg-stone-50"
                >
                  <span className="flex items-center gap-3 text-sm text-stone-800">
                    <span
                      aria-hidden
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        item.done || item.id === "invitar"
                          ? item.id === "invitar"
                            ? "bg-[#e6dac7] text-stone-800"
                            : "bg-emerald-100 text-emerald-800"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {item.done && item.id !== "invitar" ? "✓" : item.id === "invitar" ? "↗" : "·"}
                    </span>
                    {item.label}
                    {item.optional ? (
                      <span className="text-xs text-stone-400">opcional</span>
                    ) : null}
                  </span>
                  <span className="text-xs font-medium text-[#6f5f47]">
                    {item.done && item.id !== "invitar" ? "Listo" : "Ir →"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {!setupReady && pendingSetup.length > 0 ? (
            <p className="mt-4 text-sm text-stone-500">
              Te faltan {pendingRequired.length} paso
              {pendingRequired.length === 1 ? "" : "s"} esencial
              {pendingRequired.length === 1 ? "" : "es"}.
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h3 className="text-lg font-semibold text-stone-800">Secciones</h3>
        <ul className="mt-4 divide-y divide-stone-100">
          {editableSections.map((item) => (
            <li
              key={item.href}
              className="flex items-center justify-between py-3"
            >
              <Link
                href={item.href}
                className="font-medium text-[#6f5f47] hover:underline"
              >
                {item.label}
                {item.href === "/mi-cuenta/regalos-recibidos" &&
                pendingGiftsCount > 0
                  ? ` (${pendingGiftsCount})`
                  : ""}
              </Link>
              <span className="text-xs text-stone-400">Editar →</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
