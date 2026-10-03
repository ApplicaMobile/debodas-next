import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { AccountSetupSticky } from "@/components/account/AccountSetupSticky";
import {
  AccountNavIcon,
  AccountNavIconBadge,
  type AccountNavIconTone,
} from "@/components/account/AccountNavIcon";
import {
  IllustrationCalendar,
  IllustrationEnvelope,
  IllustrationGift,
  IllustrationGuests,
  IllustrationMicrosite,
  IllustrationRings,
} from "@/components/account/AccountIllustrations";
import {
  Alert,
  Badge,
  Button,
  Card,
  IconArrowRight,
  IconCheck,
  PlanBadge,
  UsageMeter,
  formatWeddingDate,
  type PlanId,
} from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getMicrositePassword } from "@/lib/microsite/password";
import { normalizePlan } from "@/lib/plans/features";
import { getPlanLimits } from "@/lib/plans/limits";
import { getTheme } from "@/lib/themes";
import { cn } from "@/lib/cn";

function parseJsonObject(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as Record<string, unknown>;
}

function optionEnabled(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

function nowMs(): number {
  return Date.now();
}

/** Fecha de hoy (YYYY-MM-DD) en Argentina. */
function todayInArgentina(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(nowMs()));
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const AR_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/** Normaliza la fecha guardada (AAAA-MM-DD o DD/MM/AAAA) a AAAA-MM-DD. */
function toIsoDate(raw: string): string | null {
  const value = raw.trim();
  if (ISO_DATE.test(value)) return value;
  const ar = AR_DATE.exec(value);
  if (ar) {
    return `${ar[3]}-${ar[2].padStart(2, "0")}-${ar[1].padStart(2, "0")}`;
  }
  return null;
}

/** Días que faltan para la boda (negativo si ya pasó). */
function daysUntil(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const [ty, tm, td] = todayInArgentina().split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86_400_000);
}

function plural(n: number, singular: string, pluralForm: string) {
  return n === 1 ? singular : pluralForm;
}

type Illustration = ComponentType<SVGProps<SVGSVGElement>>;

const STEP_ILLUSTRATIONS: Record<string, Illustration> = {
  datos: IllustrationCalendar,
  tema: IllustrationMicrosite,
  banner: IllustrationMicrosite,
  regalos: IllustrationGift,
  pagos: IllustrationGift,
  rsvp: IllustrationGuests,
  cronograma: IllustrationCalendar,
  invitar: IllustrationEnvelope,
};

const STEP_HELP: Record<string, string> = {
  datos: "Con los nombres y la fecha, tu sitio ya muestra la cuenta regresiva.",
  tema: "Elegí el diseño y los colores con los que tus invitados van a ver tu sitio.",
  banner: "Una linda foto de portada hace que el sitio se sienta tuyo.",
  regalos: "Sumá los regalos que te gustaría recibir. Podés cambiarlos cuando quieras.",
  pagos: "Indicá cómo te pueden pagar los regalos: transferencia o MercadoPago.",
  rsvp: "Mirá quién confirmó asistencia y quién todavía no respondió.",
  cronograma: "Contales a tus invitados los horarios del gran día.",
  invitar: "Mandá el link por WhatsApp o compartí tu invitación.",
};

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

  const bodaId = user?.boda?.id;
  const [giftCount, pictureCount, receivedGiftsCount, rsvpByStatus] = bodaId
    ? await Promise.all([
        prisma.gift.count({ where: { bodaId } }),
        prisma.picture.count({ where: { bodaId } }),
        prisma.confirmedGift.count({ where: { bodaId } }),
        prisma.rsvpGuest.groupBy({
          by: ["status"],
          where: { bodaId },
          _count: { _all: true },
        }),
      ])
    : [0, 0, 0, []];

  const rsvpCount = (status: string) =>
    rsvpByStatus.find((row) => row.status === status)?._count._all ?? 0;
  const guestsTotal = rsvpByStatus.reduce((sum, row) => sum + row._count._all, 0);
  const guestsConfirmed = rsvpCount("confirmed");
  const guestsPending = rsvpCount("pending");
  const guestsDeclined = rsvpCount("declined");

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
  const eventDateRaw = String(
    (boda?.event && typeof boda.event === "object"
      ? (boda.event as Record<string, unknown>).date
      : "") ?? "",
  );
  const eventDate = eventDateRaw ? new Date(eventDateRaw) : null;
  const eventPassed = Boolean(
    eventDate &&
      !Number.isNaN(eventDate.getTime()) &&
      eventDate.getTime() < nowMs() - 12 * 60 * 60 * 1000,
  );

  const couple = parseJsonObject(boda?.couple);
  const brideName = String(couple.bride_name ?? couple.bride ?? "").trim();
  const groomName = String(couple.groom_name ?? couple.groom ?? "").trim();
  const coupleNames = [brideName, groomName].filter(Boolean).join(" y ");
  const hasWeddingData = Boolean(brideName && groomName && eventDateRaw);
  const eventIsoDate = toIsoDate(eventDateRaw);
  const daysLeft = eventIsoDate ? daysUntil(eventIsoDate) : null;
  const eventDateLabel = eventIsoDate
    ? formatWeddingDate(eventIsoDate).toLowerCase()
    : eventDateRaw;

  const checklist = boda
    ? [
        {
          id: "datos",
          label: "Completá los nombres y la fecha",
          done: hasWeddingData,
          href: "/mi-cuenta/boda",
          // Informativo: no cambia el cálculo de "listo para compartir".
          optional: true,
          hideOptionalTag: true,
        },
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

  // Mismo cálculo que antes: el ítem informativo "datos" no participa.
  const setupItems = checklist.filter((item) => item.id !== "datos");
  const pendingSetup = setupItems.filter((item) => !item.done);
  const pendingRequired = setupItems.filter(
    (item) => !item.optional && !item.done && item.id !== "invitar",
  );
  const setupReady = pendingRequired.length === 0;
  const hasPassword = boda
    ? Boolean(getMicrositePassword(boda.options))
    : false;
  const doneCount = checklist.filter((item) => item.done).length;
  const progressPct = Math.round(
    (doneCount / Math.max(checklist.length, 1)) * 100,
  );
  const nextSetupStep =
    pendingRequired[0] ??
    (!hasInviteShared
      ? checklist.find((item) => item.id === "invitar")
      : undefined);
  // Sugerencia del panel: si faltan los datos básicos, empezar por ahí.
  const suggestedStep =
    !hasWeddingData && boda
      ? checklist.find((item) => item.id === "datos")
      : nextSetupStep;

  const plan = normalizePlan(boda?.plan) as PlanId;
  const limits = getPlanLimits(boda?.plan);
  const theme = boda ? getTheme(boda.micrositeTheme) : null;

  const quickActions: {
    href: string;
    title: string;
    text: string;
    tone: AccountNavIconTone;
    badge?: number;
    highlight?: boolean;
  }[] = [
    {
      href: "/mi-cuenta/invitar",
      title: "Compartir / invitar",
      text: "Link, WhatsApp e invitaciones",
      tone: "whatsapp",
    },
    {
      href: "/mi-cuenta/invitados",
      title: "Invitados / RSVP",
      text: "Confirmaciones y lista de invitados",
      tone: "neutral",
    },
    {
      href: "/mi-cuenta/regalos-recibidos",
      title: "Regalos recibidos",
      text:
        pendingGiftsCount > 0
          ? "Hay pendientes por confirmar"
          : "Historial y comprobantes",
      tone: pendingGiftsCount > 0 ? "gift" : "neutral",
      badge: pendingGiftsCount,
      highlight: pendingGiftsCount > 0,
    },
    {
      href: "/mi-cuenta/boda",
      title: "Datos de la boda",
      text: "Nombres, fecha, historia y contraseña",
      tone: "neutral",
    },
    {
      href: "/mi-cuenta/tema",
      title: "Cambiar tema",
      text: theme ? `Ahora: ${theme.label}` : "Diseño y colores del sitio",
      tone: "neutral",
    },
  ];

  const StepIllustration = suggestedStep
    ? (STEP_ILLUSTRATIONS[suggestedStep.id] ?? IllustrationRings)
    : IllustrationRings;

  return (
    <div className="space-y-6 pb-24 sm:space-y-8 sm:pb-0">
      {/* Saludo */}
      <Card as="section" padding="none" className="overflow-hidden" aria-labelledby="inicio-saludo">
        <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="min-w-0 max-w-2xl">
            <p className="type-overline text-text-accent">Mi cuenta · Inicio</p>
            <h2 id="inicio-saludo" className="mt-2 type-h2 text-text-primary">
              {`Bienvenido${user?.name ? `, ${user.name}` : ""}`}
            </h2>
            {boda ? (
              eventDateRaw ? (
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 type-body-lg text-text-secondary">
                  <span>
                    {coupleNames ? `${coupleNames} se casan` : "Se casan"} el{" "}
                    {eventDateLabel}
                  </span>
                  {daysLeft !== null && daysLeft > 0 ? (
                    <Badge tone="info" icon={false}>
                      Faltan {daysLeft} {plural(daysLeft, "día", "días")}
                    </Badge>
                  ) : daysLeft === 0 ? (
                    <Badge tone="aprobado">¡Es hoy!</Badge>
                  ) : null}
                </p>
              ) : (
                <p className="mt-3 type-body-lg text-text-secondary">
                  Todavía no cargaste la fecha.{" "}
                  <Link
                    href="/mi-cuenta/boda"
                    className="focus-ring rounded-sm font-semibold text-text-link underline underline-offset-2"
                  >
                    Agregala en Datos de la boda
                  </Link>
                </p>
              )
            ) : null}
            <p className="mt-2 type-body text-text-secondary">
              Editá tu micrositio desde acá. Los cambios se ven en el sitio
              público al guardar.
            </p>
            {boda ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/mi-cuenta/invitar"
                  className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-whatsapp-bg px-6 type-button text-brand-whatsapp-fg transition-colors hover:bg-brand-whatsapp-bg-hover"
                >
                  <AccountNavIcon href="/mi-cuenta/invitar" className="h-5 w-5" />
                  Compartir / invitar
                </Link>
                <a
                  href={`/bodas/${boda.slug}`}
                  target="_blank"
                  rel="noopener"
                  className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-action-secondary-bg px-6 type-button text-action-secondary-fg transition-colors hover:bg-action-secondary-bg-hover"
                >
                  Ver micrositio <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
              </div>
            ) : null}
          </div>
          <IllustrationRings className="mx-auto hidden h-36 w-48 shrink-0 sm:block lg:h-44 lg:w-60" />
        </div>
        {!boda ? (
          <div className="flex flex-col items-center gap-3 border-t border-border-subtle bg-surface-muted p-6 text-center sm:p-8">
            <IllustrationRings className="h-24 w-32" />
            <p className="type-body text-text-secondary">
              Todavía no hay una boda asociada a esta cuenta.
            </p>
          </div>
        ) : null}
      </Card>

      {boda && pendingGiftsCount > 0 ? (
        <Alert
          tone="pendiente"
          title={`Tenés ${pendingGiftsCount} regalo${pendingGiftsCount === 1 ? "" : "s"} por confirmar`}
          action={
            <Button href="/mi-cuenta/regalos-recibidos" size="sm">
              Ir a regalos
            </Button>
          }
        >
          Revisá comprobantes y acreditá los pagos pendientes.
        </Alert>
      ) : null}

      {boda && eventPassed ? (
        <Card as="section" tone="muted" bordered elevation={0}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="type-label text-text-primary">
                ¿Cómo te fue con DeBodas?
              </p>
              <p className="mt-0.5 type-body-sm text-text-secondary">
                Dejá una calificación para que otras parejas te conozcan.
              </p>
            </div>
            <Button href={`/calificar?bodaId=${boda.id}`} size="sm">
              Califícanos
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Siguiente paso sugerido */}
      {boda && suggestedStep ? (
        <Card as="section" tone="brand" padding="none" elevation={0} aria-labelledby="inicio-siguiente">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
            <StepIllustration className="h-20 w-28 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="type-overline text-text-accent">Tu próximo paso</p>
              <h2 id="inicio-siguiente" className="mt-1 type-h3 text-text-primary">
                {suggestedStep.label}
              </h2>
              <p className="mt-1 type-body-sm text-text-primary">
                {STEP_HELP[suggestedStep.id]}
              </p>
            </div>
            <Button
              href={suggestedStep.href}
              icon={<IconArrowRight />}
              iconPosition="end"
              className="shrink-0"
            >
              Continuar
            </Button>
          </div>
        </Card>
      ) : boda ? (
        <Alert tone="exito" title="¡Tu sitio está listo y ya lo compartiste!">
          Podés seguir sumando detalles cuando quieras.
        </Alert>
      ) : null}

      {/* Números */}
      {boda ? (
        <section aria-labelledby="inicio-numeros">
          <h2 id="inicio-numeros" className="type-h4 text-text-primary">
            Tu boda en números
          </h2>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              href="/mi-cuenta/invitados"
              label="Invitados confirmados"
              value={guestsTotal > 0 ? `${guestsConfirmed}` : "—"}
              detail={
                guestsTotal > 0
                  ? `${guestsPending} sin responder · ${guestsDeclined} no ${plural(guestsDeclined, "va", "van")}`
                  : "Todavía nadie respondió. Compartí el link para empezar."
              }
              empty={guestsTotal === 0}
              illustration={IllustrationGuests}
            />
            <StatCard
              href="/mi-cuenta/regalos"
              label="Regalos en tu lista"
              value={giftCount > 0 ? `${giftCount}` : "—"}
              detail={
                giftCount > 0
                  ? "Tus invitados ya pueden elegirlos"
                  : "Tu lista está vacía. Sumá el primer regalo."
              }
              empty={giftCount === 0}
              illustration={IllustrationGift}
            />
            <StatCard
              href="/mi-cuenta/regalos-recibidos"
              label="Regalos pendientes"
              value={`${pendingGiftsCount}`}
              detail={
                pendingGiftsCount > 0
                  ? `Revisar → · ${receivedGiftsCount} ${plural(receivedGiftsCount, "recibido", "recibidos")} en total`
                  : receivedGiftsCount > 0
                    ? `${receivedGiftsCount} ${plural(receivedGiftsCount, "regalo recibido", "regalos recibidos")}, todos confirmados`
                    : "Cuando te regalen algo, lo vas a ver acá."
              }
              highlight={pendingGiftsCount > 0}
            />
            <li>
              <Link
                href="/mi-cuenta/tema"
                className="focus-ring group flex h-full flex-col rounded-md bg-surface-default p-4 shadow-elevation-1 transition-shadow hover:shadow-elevation-2 sm:p-5"
              >
                <span className="type-caption font-semibold text-text-tertiary">
                  Tema
                </span>
                <span className="mt-1 flex items-center gap-2 type-h3 text-text-primary">
                  {theme ? (
                    <span
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 rounded-full border border-border-default"
                      style={{ background: theme.colors.accent }}
                    />
                  ) : null}
                  <span className="truncate">{theme?.label ?? boda.micrositeTheme}</span>
                </span>
                <span className="mt-auto pt-3 type-body-sm font-semibold text-text-accent group-hover:underline">
                  Cambiar tema →
                </span>
              </Link>
            </li>
          </ul>
        </section>
      ) : null}

      {boda ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
          {/* Checklist */}
          <Card as="section" padding="lg" aria-labelledby="inicio-checklist">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="inicio-checklist" className="type-h3 text-text-primary">
                  Prepará tu sitio
                </h2>
                <p className="mt-1 type-body-sm text-text-secondary">
                  {setupReady
                    ? "Tu micrositio ya tiene lo esencial. ¡Compartilo con tus invitados!"
                    : "Completá estos pasos para dejar el micrositio listo para compartir."}
                </p>
              </div>
              <Badge tone={setupReady ? "aprobado" : "pendiente"}>
                {setupReady ? "Listo para compartir" : "En progreso"}
                {hasPassword ? " · Con contraseña" : ""}
              </Badge>
            </div>

            <div className="mt-5">
              <div className="flex items-baseline justify-between type-body-sm">
                <span id="inicio-progreso" className="font-semibold text-text-primary">
                  {doneCount} de {checklist.length} completados
                </span>
                <span className="tabular-nums text-text-tertiary">{progressPct}%</span>
              </div>
              <div
                role="progressbar"
                aria-labelledby="inicio-progreso"
                aria-valuemin={0}
                aria-valuemax={checklist.length}
                aria-valuenow={doneCount}
                className="mt-2 h-2 overflow-hidden rounded-full bg-surface-disabled"
              >
                <div
                  className="h-full rounded-full bg-action-primary-bg transition-all motion-reduce:transition-none"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <ol className="mt-5 space-y-2">
              {checklist.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      "focus-ring flex items-center justify-between gap-3 rounded-md border px-4 py-3 transition-colors",
                      item.done
                        ? "border-border-subtle bg-surface-default hover:bg-surface-muted"
                        : "border-border-default bg-surface-default hover:border-border-strong hover:bg-surface-muted",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                          item.done
                            ? "bg-status-success-bg text-status-success-fg"
                            : item.id === "invitar"
                              ? "bg-surface-brand text-text-on-brand"
                              : "bg-surface-muted text-text-accent",
                        )}
                      >
                        {item.done ? (
                          <IconCheck size={16} strokeWidth={2.5} />
                        ) : (
                          <AccountNavIcon
                            href={item.id === "rsvp" ? "/mi-cuenta/invitados" : item.href}
                            className="h-4 w-4"
                          />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "type-body-sm",
                            item.done ? "text-text-secondary" : "font-semibold text-text-primary",
                          )}
                        >
                          {item.label}
                        </span>
                        {item.optional && !("hideOptionalTag" in item && item.hideOptionalTag) ? (
                          <span className="ml-2 type-caption text-text-tertiary">opcional</span>
                        ) : null}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 type-caption font-semibold",
                        item.done ? "text-status-success-fg" : "text-text-accent",
                      )}
                    >
                      {item.done ? (
                        <>
                          Listo<span className="sr-only">: completado</span>
                        </>
                      ) : (
                        <>
                          Ir <span aria-hidden="true">→</span>
                          <span className="sr-only">: pendiente</span>
                        </>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>

            {!setupReady && pendingSetup.length > 0 ? (
              <p className="mt-4 type-body-sm text-text-secondary">
                Te faltan {pendingRequired.length} paso
                {pendingRequired.length === 1 ? "" : "s"} esencial
                {pendingRequired.length === 1 ? "" : "es"}.
              </p>
            ) : null}
          </Card>

          {/* Plan */}
          <Card as="section" padding="lg" aria-labelledby="inicio-plan">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <AccountNavIconBadge href="/mi-cuenta/plan" tone="brand" />
                <h2 id="inicio-plan" className="type-h3 text-text-primary">
                  Tu plan
                </h2>
              </div>
              <PlanBadge plan={plan} />
            </div>
            <div className="mt-5 space-y-5">
              <UsageMeter
                label="Regalos"
                value={giftCount}
                max={limits.maxGifts}
                unit="regalos"
                upgradeHref="/mi-cuenta/plan"
              />
              <UsageMeter
                label="Invitados en RSVP"
                value={guestsTotal}
                max={limits.maxRsvpGuests}
                unit="invitados"
                upgradeHref="/mi-cuenta/plan"
              />
              <UsageMeter
                label="Fotos del álbum"
                value={pictureCount}
                max={limits.maxPictures}
                unit="fotos"
                upgradeHref="/mi-cuenta/plan"
              />
            </div>
            <Button
              href="/mi-cuenta/plan"
              variant="secundario"
              size="sm"
              fullWidth
              className="mt-6"
            >
              Ver plan y facturación
            </Button>
          </Card>
        </div>
      ) : null}

      {/* Acciones rápidas */}
      {boda ? (
        <section aria-labelledby="inicio-acciones">
          <h2 id="inicio-acciones" className="type-h4 text-text-primary">
            Acciones rápidas
          </h2>
          <p className="mt-1 type-body-sm text-text-secondary">
            Lo que más usás día a día.
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {quickActions.map((action) => (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className={cn(
                    "focus-ring flex h-full flex-col gap-3 rounded-md border p-4 transition-colors",
                    action.highlight
                      ? "border-status-warning-border bg-status-warning-bg hover:bg-surface-default"
                      : action.tone === "whatsapp"
                        ? "border-brand-whatsapp-bg bg-surface-default hover:bg-surface-muted"
                        : "border-border-subtle bg-surface-default hover:border-border-default hover:bg-surface-muted",
                  )}
                >
                  <AccountNavIconBadge href={action.href} tone={action.tone} />
                  <span>
                    <span className="flex items-center gap-2 type-label text-text-primary">
                      {action.title}
                      {action.badge && action.badge > 0 ? (
                        <span className="rounded-full bg-status-warning-fg px-2 py-0.5 type-caption font-bold text-text-inverse">
                          {action.badge}
                          <span className="sr-only"> pendientes</span>
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block type-caption text-text-secondary">
                      {action.text}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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

function StatCard({
  href,
  label,
  value,
  detail,
  empty = false,
  highlight = false,
  illustration: Illustration,
}: {
  href: string;
  label: string;
  value: string;
  detail: string;
  empty?: boolean;
  highlight?: boolean;
  illustration?: Illustration;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "focus-ring flex h-full items-start justify-between gap-3 rounded-md p-4 shadow-elevation-1 transition-shadow hover:shadow-elevation-2 sm:p-5",
          highlight
            ? "border border-status-warning-border bg-status-warning-bg"
            : "bg-surface-default",
        )}
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 type-caption font-semibold text-text-tertiary">
            <AccountNavIcon href={href} className="h-4 w-4 text-text-accent" />
            {label}
          </span>
          <span className="mt-1 block type-h2 tabular-nums text-text-primary">
            {value}
          </span>
          <span className="mt-1 block type-caption text-text-secondary">
            {detail}
          </span>
        </span>
        {empty && Illustration ? (
          <Illustration className="h-12 w-14 shrink-0" />
        ) : null}
      </Link>
    </li>
  );
}
