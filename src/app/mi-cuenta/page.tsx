import Link from "next/link";
import { AccountSetupSticky } from "@/components/account/AccountSetupSticky";
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
  const hasRsvpGuests = Boolean(boda?.rsvpGuests?.length);
  const misc = parseJsonObject(boda?.misc);
  const hasRsvpReviewed = Boolean(
    misc.rsvpSectionReviewedAt || hasRsvpGuests,
  );
  const hasInviteShared = Boolean(misc.inviteSharedAt);
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
          done: hasRsvpReviewed,
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
          done: hasInviteShared,
          href: "/mi-cuenta/invitar",
          alwaysShow: true,
        },
      ]
    : [];

  const pendingSetup = checklist.filter((item) => !item.done);
  const pendingRequired = checklist.filter(
    (item) => !item.optional && !item.done && item.id !== "invitar",
  );
  const setupReady = pendingRequired.length === 0;
  const hasPassword = boda
    ? Boolean(getMicrositePassword(boda.options))
    : false;
  const doneCount = checklist.filter((item) => item.done).length;
  const nextSetupStep =
    pendingRequired[0] ??
    (!hasInviteShared
      ? checklist.find((item) => item.id === "invitar")
      : undefined);

  return (
    <div className="space-y-6 pb-20 sm:space-y-8 sm:pb-0">
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm sm:rounded-3xl">
        <div className="border-b border-stone-100 bg-gradient-to-r from-[#06263a] to-[#0a3550] px-4 py-5 text-white sm:px-8 sm:py-7">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
            Panel
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">
            Bienvenido{user?.name ? `, ${user.name}` : ""}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/75 sm:text-base">
            Editá tu micrositio desde acá. Los cambios se ven en el sitio
            público al guardar.
          </p>
          {boda ? (
            <div className="mt-5 flex flex-wrap gap-2">
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
        </div>

        {boda ? (
          <div className="grid gap-px bg-stone-100 sm:grid-cols-3">
            <div className="bg-white p-4 sm:p-5">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                Plan
              </p>
              <p className="mt-1 font-semibold capitalize text-stone-800">
                {boda.plan}
              </p>
            </div>
            <div className="bg-white p-4 sm:p-5">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                Tema
              </p>
              <p className="mt-1 font-semibold text-stone-800">
                {boda.micrositeTheme}
              </p>
            </div>
            <div className="bg-white p-4 sm:p-5">
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
        ) : (
          <div className="p-4 sm:p-8">
            <p className="text-stone-600">
              Todavía no hay una boda asociada a esta cuenta.
            </p>
          </div>
        )}
      </section>

      {boda && pendingGiftsCount > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 sm:rounded-3xl sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-950">
                Tenés {pendingGiftsCount} regalo
                {pendingGiftsCount === 1 ? "" : "s"} por confirmar
              </p>
              <p className="mt-0.5 text-sm text-amber-900/80">
                Revisá comprobantes y acreditá los pagos pendientes.
              </p>
            </div>
            <Link
              href="/mi-cuenta/regalos-recibidos"
              className="inline-flex rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Ir a regalos
            </Link>
          </div>
        </section>
      ) : null}

      {boda ? (
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h3 className="text-lg font-semibold text-stone-800">
            Acciones rápidas
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Lo que más usás día a día.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/mi-cuenta/invitar"
              className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-4 transition hover:bg-[#25D366]/15"
            >
              <p className="text-sm font-semibold text-stone-800">
                Compartir / invitar
              </p>
              <p className="mt-1 text-xs text-stone-600">
                Link, WhatsApp e invitaciones
              </p>
            </Link>
            <Link
              href="/mi-cuenta/invitados"
              className="rounded-2xl border border-stone-200 px-4 py-4 transition hover:bg-stone-50"
            >
              <p className="text-sm font-semibold text-stone-800">
                Invitados / RSVP
              </p>
              <p className="mt-1 text-xs text-stone-600">
                Confirmaciones y lista de invitados
              </p>
            </Link>
            <Link
              href="/mi-cuenta/regalos-recibidos"
              className={`rounded-2xl border px-4 py-4 transition ${
                pendingGiftsCount > 0
                  ? "border-amber-200 bg-amber-50 hover:bg-amber-100/70"
                  : "border-stone-200 hover:bg-stone-50"
              }`}
            >
              <p className="text-sm font-semibold text-stone-800">
                Regalos recibidos
                {pendingGiftsCount > 0 ? (
                  <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {pendingGiftsCount}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs text-stone-600">
                {pendingGiftsCount > 0
                  ? "Hay pendientes por confirmar"
                  : "Historial y comprobantes"}
              </p>
            </Link>
            <Link
              href="/mi-cuenta/boda"
              className="rounded-2xl border border-stone-200 px-4 py-4 transition hover:bg-stone-50"
            >
              <p className="text-sm font-semibold text-stone-800">
                Datos de la boda
              </p>
              <p className="mt-1 text-xs text-stone-600">
                Nombres, fecha, historia y contraseña
              </p>
            </Link>
          </div>
        </section>
      ) : null}

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
              <p className="mt-2 text-xs text-stone-500">
                {doneCount} de {checklist.length} completados
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

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-[#06263a] transition-all"
              style={{
                width: `${Math.round((doneCount / Math.max(checklist.length, 1)) * 100)}%`,
              }}
            />
          </div>

          <ul className="mt-5 space-y-2">
            {checklist.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 px-4 py-3 transition hover:bg-stone-50"
                >
                  <span className="flex items-center gap-3 text-sm text-stone-800">
                    <span
                      aria-hidden
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        item.done
                          ? "bg-emerald-100 text-emerald-800"
                          : item.id === "invitar"
                            ? "bg-[#e6dac7] text-stone-800"
                            : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {item.done ? "✓" : item.id === "invitar" ? "↗" : "·"}
                    </span>
                    {item.label}
                    {item.optional ? (
                      <span className="text-xs text-stone-400">opcional</span>
                    ) : null}
                  </span>
                  <span className="text-xs font-medium text-[#6f5f47]">
                    {item.done ? "Listo" : "Ir →"}
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
        <h3 className="text-lg font-semibold text-stone-800">
          Todas las secciones
        </h3>
        <p className="mt-1 text-sm text-stone-500">
          Acceso completo a lo editable del micrositio.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {editableSections.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between rounded-xl border border-stone-100 px-4 py-3 transition hover:border-stone-200 hover:bg-stone-50"
              >
                <span className="font-medium text-stone-800">
                  {item.label}
                  {item.href === "/mi-cuenta/regalos-recibidos" &&
                  pendingGiftsCount > 0
                    ? ` (${pendingGiftsCount})`
                    : ""}
                </span>
                <span className="text-xs font-medium text-[#6f5f47]">
                  Editar →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {nextSetupStep ? (
        <AccountSetupSticky
          label={nextSetupStep.label}
          href={nextSetupStep.href}
          ready={setupReady && hasInviteShared}
        />
      ) : null}
    </div>
  );
}
