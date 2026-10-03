import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import {
  IllustrationRings,
  IllustrationStars,
} from "@/components/account/AccountIllustrations";
import {
  AccountDetailList,
  AccountFieldGroup,
  AccountItemList,
  AccountListItem,
  AccountPageBody,
  AccountPageHeader,
  AccountSection,
  AccountStatCard,
} from "@/components/account/AccountPage";
import {
  AdminPlanBadge,
  AdminStatusBadge,
} from "@/components/admin/AdminStatusBadge";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  IconExternalLink,
  Select,
  buttonClasses,
  planLabels,
} from "@/components/ui";
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
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";

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
      <AccountEmptyState
        illustration={IllustrationRings}
        title="No encontramos esta boda."
        description="Puede que se haya eliminado o que el enlace sea incorrecto."
        actions={[{ label: "← Volver", href: "/admin/bodas", primary: true }]}
      />
    );
  }

  const rateUrl = `${getAppUrl()}/calificar?bodaId=${boda.id}`;
  const name = coupleLabel(boda.couple, boda.title);

  return (
    <AccountPageBody>
      <AccountPageHeader
        href="/admin/bodas"
        area="Panel admin"
        section="Bodas y clientes"
        back={{ href: "/admin/bodas", label: "Bodas" }}
        title={name}
        description={`/${boda.slug} · tema ${boda.micrositeTheme}`}
        meta={
          <>
            <AdminPlanBadge plan={boda.plan} />
            <Badge tone={boda.isOnline ? "aprobado" : "neutro"}>
              <span className="sr-only">Micrositio: </span>
              {boda.isOnline ? "Online" : "Offline"}
            </Badge>
          </>
        }
        actions={
          <>
            <Button
              href={`/bodas/${boda.slug}`}
              target="_blank"
              variant="secundario"
              size="sm"
              icon={<IconExternalLink size={16} />}
              iconPosition="end"
            >
              Ver micrositio
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </Button>
            <a
              href={rateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "fantasma", size: "sm" })}
            >
              Link calificar
              <IconExternalLink size={16} />
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </>
        }
      />

      {flash.ok ? <Alert tone="exito" title={flash.ok} /> : null}
      {flash.error ? (
        <Alert
          tone="error"
          title={
            flash.error === "sin-email"
              ? "La pareja no tiene email."
              : flash.error === "ya-calificada"
                ? "Esta boda ya tiene una calificación."
                : flash.error
          }
        />
      ) : null}

      <section aria-label="Actividad de la boda">
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "RSVP", value: boda._count.rsvpGuests, icon: "/mi-cuenta/invitados" },
            { label: "Regalos lista", value: boda._count.gifts, icon: "/mi-cuenta/regalos" },
            {
              label: "Regalos recibidos",
              value: boda._count.confirmedGifts,
              icon: "/mi-cuenta/regalos-recibidos",
            },
            { label: "Pagos", value: boda._count.payments, icon: "/admin/pagos" },
          ].map((item) => (
            <AccountStatCard
              key={item.label}
              iconHref={item.icon}
              label={item.label}
              value={item.value}
            />
          ))}
        </ul>
      </section>

      <div className="grid gap-6 sm:gap-8 xl:grid-cols-2">
        <AccountSection
          id="admin-boda-datos"
          title="Datos"
          description="Información de la boda y de la cuenta dueña."
        >
          <AccountDetailList
            items={[
              { label: "Fecha evento", value: eventDateFromJson(boda.event) },
              { label: "Teléfono", value: phoneFromCouple(boda.couple) },
              {
                label: "Dueño",
                value: (
                  <>
                    {boda.user.name || "—"}
                    <span className="block break-all text-text-secondary">
                      {boda.user.email}
                    </span>
                  </>
                ),
              },
              { label: "Micrositio", value: boda.isOnline ? "Online" : "Offline" },
              { label: "Alta", value: boda.createdAt.toLocaleString("es-AR") },
              {
                label: "Mail calificación",
                value: boda.ratingEmailSentAt
                  ? `Enviado ${boda.ratingEmailSentAt.toLocaleString("es-AR")}`
                  : "No enviado",
              },
            ]}
          />
        </AccountSection>

        <AccountSection
          id="admin-boda-plan"
          title="Plan y publicación"
          description="Cada cambio pide confirmación antes de guardarse."
        >
          <AdminActionForm
            action={updateBodaPlanAction}
            confirmMessage="¿Confirmás el cambio de plan de esta boda?"
          >
            <AccountFieldGroup title="Plan">
              <input type="hidden" name="boda_id" value={boda.id} />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Select
                  id="admin-boda-plan-select"
                  name="plan"
                  label="Plan de la boda"
                  defaultValue={boda.plan}
                  className="sm:flex-1"
                  options={(["free", "basico", "premium"] as const).map(
                    (value) => ({ value, label: planLabels[value] }),
                  )}
                />
                <AdminSubmitButton
                  idleLabel="Guardar plan"
                  pendingLabel="Guardando…"
                  variant="primario"
                  size="md"
                />
              </div>
            </AccountFieldGroup>
          </AdminActionForm>

          <AdminActionForm
            action={updateBodaOnlineAction}
            className="mt-6 border-t border-border-subtle pt-6"
            confirmMessage={
              boda.isOnline
                ? "¿Confirmás que querés despublicar este micrositio?"
                : "¿Confirmás que querés publicar este micrositio?"
            }
          >
            <AccountFieldGroup title="Publicación">
              <input type="hidden" name="boda_id" value={boda.id} />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Checkbox
                  id="admin-boda-online"
                  name="is_online"
                  defaultChecked={boda.isOnline}
                  label="Micrositio online"
                  description="Desmarcalo para que el micrositio deje de estar visible."
                />
                <AdminSubmitButton
                  idleLabel="Guardar"
                  pendingLabel="Guardando…"
                  variant="secundario"
                  size="md"
                />
              </div>
            </AccountFieldGroup>
          </AdminActionForm>
        </AccountSection>
      </div>

      <AccountSection
        id="admin-boda-calificacion"
        title="Calificación"
        description={`Cronograma FAQ: ${boda._count.scheduleItems} ítems · ${boda._count.faqItems} FAQs`}
      >
        {boda.ratings.length > 0 ? (
          <AccountItemList label="Calificaciones de la boda">
            {boda.ratings.map((rating) => (
              <AccountListItem
                key={rating.id}
                title={`${rating.name} · ${rating.score}/5`}
                meta={<AdminStatusBadge kind="rating" status={rating.status} />}
              >
                {rating.comment ? rating.comment : null}
              </AccountListItem>
            ))}
          </AccountItemList>
        ) : (
          <AccountEmptyState
            illustration={IllustrationStars}
            title="Todavía no hay calificación."
            description="Podés enviar el pedido por email."
          >
            <div className="flex flex-col items-center gap-3">
              <AdminActionForm
                action={sendRatingRequestAction}
                confirmMessage={`¿Enviar el pedido de calificación a ${boda.user.email}?`}
              >
                <input type="hidden" name="boda_id" value={boda.id} />
                <AdminSubmitButton
                  idleLabel="Enviar pedido de calificación"
                  pendingLabel="Enviando…"
                  variant="primario"
                  size="md"
                />
              </AdminActionForm>
              {boda.ratingEmailSentAt ? (
                <AdminActionForm
                  action={resetRatingEmailFlagAction}
                  confirmMessage="¿Resetear el registro de envío? El cron podrá volver a enviar este email."
                >
                  <input type="hidden" name="boda_id" value={boda.id} />
                  <AdminSubmitButton
                    idleLabel="Resetear flag de email enviado (para cron)"
                    pendingLabel="Reseteando…"
                    variant="fantasma"
                  />
                </AdminActionForm>
              ) : null}
            </div>
          </AccountEmptyState>
        )}
      </AccountSection>
    </AccountPageBody>
  );
}
