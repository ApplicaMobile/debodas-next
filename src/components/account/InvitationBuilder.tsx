"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toPng } from "html-to-image";
import {
  deleteInvitationAction,
  saveInvitationAction,
} from "@/lib/account/actions/invitations";
import type { FormState } from "@/lib/account/form-state";
import { ConfirmDeleteForm } from "@/components/account/ConfirmDeleteForm";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { IllustrationEnvelope } from "@/components/account/AccountIllustrations";
import {
  AccountDeleteButton,
  AccountFieldGroup,
  AccountFormActions,
  AccountSection,
} from "@/components/account/AccountPage";
import { FormAlert } from "@/components/account/FormAlert";
import { formControlClassName } from "@/components/account/FormField";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { InvitationCardPreview } from "@/components/account/InvitationCardPreview";
import {
  buildInvitationFilename,
  toInvitationDatetimeLocal,
} from "@/lib/invitations/format";
import { getInvitationThemeOptions } from "@/lib/invitations/themes";
import {
  INVITATION_OUTFITS,
  MAX_INVITATIONS,
  OUTFIT_LABELS,
  type DigitalInvitation,
  type InvitationOutfit,
  type InvitationThemeSlug,
} from "@/lib/invitations/types";

const LocationMapPicker = dynamic(
  () =>
    import("@/components/account/LocationMapPicker").then(
      (mod) => mod.LocationMapPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-md bg-surface-muted" />
    ),
  },
);

interface InvitationBuilderProps {
  invitations: DigitalInvitation[];
  brideName: string;
  groomName: string;
  isPremium: boolean;
  /** Fecha ya cargada en la cuenta (dd/mm/aaaa o ISO). */
  eventDate?: string;
  /** Hora ya cargada en la cuenta, si existe. */
  eventTime?: string;
  /** Panel lateral (p. ej. Canva) al lado de las invitaciones creadas */
  aside?: ReactNode;
}

const initialState: FormState = {};

type Draft = {
  id: string;
  name: string;
  title: string;
  description: string;
  theme: InvitationThemeSlug;
  datetime: string;
  outfit: InvitationOutfit;
  locationName: string;
  address: string;
  lat: string;
  lng: string;
  isVisibleInMicrosite: boolean;
};

const emptyDraft = (datetime = ""): Draft => ({
  id: "",
  name: "",
  title: "",
  description: "",
  theme: "flores",
  datetime,
  outfit: "formal",
  locationName: "",
  address: "",
  lat: "",
  lng: "",
  isVisibleInMicrosite: false,
});

function splitDatetimeLocal(value: string): { date: string; time: string } {
  const [date = "", time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

function joinDatetimeLocal(date: string, time: string): string {
  if (!date) return "";
  if (!time) return `${date}T`;
  return `${date}T${time}`;
}

function draftFromInvitation(invitation: DigitalInvitation): Draft {
  return {
    id: invitation.id,
    name: invitation.name,
    title: invitation.title,
    description: invitation.description,
    theme: invitation.theme,
    datetime: invitation.datetime,
    outfit: invitation.outfit,
    locationName: invitation.locationName,
    address: invitation.location.address,
    lat: invitation.location.lat,
    lng: invitation.location.lng,
    isVisibleInMicrosite: invitation.isVisibleInMicrosite,
  };
}

export function InvitationBuilder({
  invitations,
  brideName,
  groomName,
  isPremium,
  eventDate = "",
  eventTime = "",
  aside,
}: InvitationBuilderProps) {
  const [state, formAction, pending] = useActionState(
    saveInvitationAction,
    initialState,
  );
  const eventDatetime = useMemo(
    () => toInvitationDatetimeLocal(eventDate, eventTime),
    [eventDate, eventTime],
  );
  const [openForm, setOpenForm] = useState(invitations.length === 0);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(eventDatetime));
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const themes = useMemo(() => getInvitationThemeOptions(), []);
  const selectedTheme = themes.find((t) => t.slug === draft.theme) ?? themes[0];
  const isEditing = Boolean(draft.id);

  useEffect(() => {
    if (state.success) {
      setDraft(emptyDraft(eventDatetime));
      setOpenForm(false);
    }
  }, [state.success, eventDatetime]);

  function openCreate() {
    setDraft(emptyDraft(eventDatetime));
    setOpenForm(true);
  }

  function openEdit(invitation: DigitalInvitation) {
    setDraft(draftFromInvitation(invitation));
    setOpenForm(true);
    window.setTimeout(() => {
      document
        .getElementById("invitation-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function downloadPng(invitation: DigitalInvitation) {
    const el = document.getElementById(`invitation-card-${invitation.id}`);
    if (!el) return;

    setDownloadingId(invitation.id);
    try {
      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: undefined,
      });
      const link = document.createElement("a");
      link.download = buildInvitationFilename(
        invitation.title || invitation.name,
        brideName,
        groomName,
      );
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("[downloadPng]", err);
      window.alert(
        "No se pudo generar el PNG. Probá de nuevo o usá otra plantilla.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  const atLimit = invitations.length >= MAX_INVITATIONS;

  return (
    <>
      <Card
        as="section"
        padding="lg"
        id="invitation-form"
        aria-labelledby="invitaciones-digitales"
        className="scroll-mt-24"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id="invitaciones-digitales" className="type-h4 text-text-primary">
                Invitaciones digitales
              </h3>
              <Badge tone="neutro" icon={false}>
                {invitations.length} de {MAX_INVITATIONS}
              </Badge>
            </div>
            <p className="mt-1 max-w-2xl type-body-sm text-text-secondary">
              Creá tarjetas con plantillas, descargalas en PNG y compartilas.
              {isPremium
                ? " Con Premium podés marcar la ubicación en el mapa."
                : " La ubicación con mapa está disponible en Premium."}
            </p>
          </div>
          <Button
            type="button"
            variant={openForm && !isEditing ? "secundario" : "primario"}
            onClick={() => {
              if (openForm && !isEditing) {
                setOpenForm(false);
                return;
              }
              if (invitations.length >= MAX_INVITATIONS && !isEditing) {
                return;
              }
              openCreate();
            }}
            disabled={atLimit && !openForm}
            className="shrink-0"
          >
            {openForm && !isEditing ? "Cerrar formulario" : "Nueva invitación"}
          </Button>
        </div>

        <div className="mt-4 empty:hidden">
          <FormAlert error={state.error} success={state.success} />
        </div>

        {openForm ? (
          <form
            action={formAction}
            className="mt-6 space-y-6 border-t border-border-subtle pt-6"
          >
            {isEditing ? (
              <input type="hidden" name="invitation_id" value={draft.id} />
            ) : null}

            {isEditing ? (
              <Alert tone="info" title={`Editando: ${draft.name || "invitación"}`} />
            ) : null}

            <AccountFieldGroup title="Evento">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  id="invitation-name"
                  label="Nombre del evento"
                  hint="Distingue ceremonia, fiesta u otro encuentro. No es el nombre de los novios."
                  name="name"
                  required
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, name: e.target.value }))
                  }
                  placeholder="Ceremonia, Fiesta, etc."
                />
                <Input
                  id="invitation-title"
                  label="Título"
                  hint="El texto grande de la tarjeta."
                  name="title"
                  required
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  placeholder="Nos vamos a casar"
                />
                <Textarea
                  id="invitation-description"
                  label="Descripción"
                  optional
                  className="sm:col-span-2"
                  name="description"
                  rows={3}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  placeholder="Texto opcional (no repitas el título)"
                />
              </div>
            </AccountFieldGroup>

            <AccountFieldGroup title="Diseño, fecha y lugar">
              <div className="grid gap-5 sm:grid-cols-2">
                <Select
                  id="invitation-theme"
                  label="Tema"
                  name="theme"
                  value={draft.theme}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      theme: e.target.value as InvitationThemeSlug,
                    }))
                  }
                  options={themes.map((theme) => ({
                    value: theme.slug,
                    label: theme.label,
                  }))}
                />
                <fieldset className="min-w-0">
                  <legend className="type-label text-text-primary">
                    Fecha y hora
                    <span aria-hidden="true" className="ml-1 text-status-error-fg">
                      *
                    </span>
                  </legend>
                  <p className="mt-1 type-body-sm text-text-secondary">
                    La fecha sale de tu boda. Indicá a qué hora empieza y
                    corregí el día si este evento es otro.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      required
                      aria-label="Fecha del evento"
                      value={splitDatetimeLocal(draft.datetime).date}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          datetime: joinDatetimeLocal(
                            e.target.value,
                            splitDatetimeLocal(d.datetime).time,
                          ),
                        }))
                      }
                      className={`${formControlClassName} min-h-12`}
                    />
                    <input
                      type="time"
                      required
                      aria-label="Hora del evento"
                      value={splitDatetimeLocal(draft.datetime).time}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          datetime: joinDatetimeLocal(
                            splitDatetimeLocal(d.datetime).date,
                            e.target.value,
                          ),
                        }))
                      }
                      className={`${formControlClassName} min-h-12`}
                    />
                  </div>
                  <input type="hidden" name="datetime" value={draft.datetime} />
                </fieldset>
                <Select
                  id="invitation-outfit"
                  label="Vestimenta"
                  name="outfit"
                  value={draft.outfit}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      outfit: e.target.value as InvitationOutfit,
                    }))
                  }
                  options={INVITATION_OUTFITS.map((outfit) => ({
                    value: outfit,
                    label: OUTFIT_LABELS[outfit],
                  }))}
                />
                <Input
                  id="invitation-location-name"
                  label="Nombre del lugar"
                  optional
                  name="location_name"
                  value={draft.locationName}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, locationName: e.target.value }))
                  }
                  placeholder="Salón, iglesia, etc."
                />
              </div>

              {isPremium ? (
                <LocationMapPicker
                  key={draft.id || "new"}
                  value={{
                    address: draft.address,
                    lat: draft.lat,
                    lng: draft.lng,
                  }}
                  onChange={(location) =>
                    setDraft((d) => ({
                      ...d,
                      address: location.address,
                      lat: location.lat,
                      lng: location.lng,
                    }))
                  }
                />
              ) : (
                <Alert tone="info" title="Mapa disponible en Premium">
                  El mapa y la dirección completa están en el plan Premium.
                  Podés cargar el nombre del lugar igual.{" "}
                  <Link
                    href="/mi-cuenta/plan"
                    className="focus-ring rounded-sm font-semibold text-text-link underline underline-offset-2"
                  >
                    Ver planes
                  </Link>
                </Alert>
              )}

              <Checkbox
                name="is_visible_in_microsite"
                checked={draft.isVisibleInMicrosite}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    isVisibleInMicrosite: e.target.checked,
                  }))
                }
                label="Mostrar botones Agendar / Ir al lugar en el micrositio"
              />
            </AccountFieldGroup>

            <AccountFieldGroup title="Vista previa">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-start">
                <div>
                  <p className="mb-2 type-label text-text-primary">
                    Vista previa del tema
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedTheme.previewSrc}
                    alt={`Vista previa ${selectedTheme.label}`}
                    className="mx-auto max-h-64 w-auto rounded-md border border-border-subtle object-contain"
                  />
                </div>
                <div>
                  <p className="mb-2 type-label text-text-primary">
                    Vista previa en vivo
                  </p>
                  <InvitationCardPreview
                    invitation={{
                      theme: draft.theme,
                      title: draft.title,
                      description: draft.description,
                      datetime: draft.datetime,
                      outfit: draft.outfit,
                      locationName: draft.locationName,
                      location: {
                        address: draft.address,
                        lat: draft.lat,
                        lng: draft.lng,
                      },
                    }}
                    brideName={brideName || "Novia"}
                    groomName={groomName || "Novio"}
                    showAddress={isPremium}
                  />
                </div>
              </div>
            </AccountFieldGroup>

            <AccountFormActions>
              {isEditing ? (
                <Button
                  type="button"
                  variant="secundario"
                  onClick={() => {
                    setDraft(emptyDraft(eventDatetime));
                    setOpenForm(false);
                  }}
                >
                  Cancelar
                </Button>
              ) : null}
              <Button type="submit" loading={pending} loadingLabel="Guardando…">
                {isEditing ? "Guardar cambios" : "Guardar invitación"}
              </Button>
            </AccountFormActions>
          </form>
        ) : null}
      </Card>

      <div
        className={
          aside
            ? "grid gap-6 sm:gap-8 xl:grid-cols-2 xl:items-start"
            : "space-y-4"
        }
      >
        <AccountSection
          id="invitaciones-creadas"
          title="Tus invitaciones"
          description="Descargalas en PNG para enviarlas o editalas cuando quieras."
        >
          {invitations.length === 0 ? (
            <AccountEmptyState
              illustration={IllustrationEnvelope}
              title="Todavía no hay invitaciones digitales."
              description="Usá “Nueva invitación” para crear la primera tarjeta con una plantilla."
            />
          ) : (
            <div className={aside ? "grid gap-6" : "grid gap-6 sm:grid-cols-2"}>
              {invitations.map((invitation) => (
                <article
                  key={invitation.id}
                  className="max-w-full overflow-hidden rounded-md border border-border-subtle bg-surface-default"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
                    <h4 className="type-label text-text-primary">
                      {invitation.name}
                    </h4>
                    {invitation.isVisibleInMicrosite ? (
                      <Badge tone="aprobado">Visible en micrositio</Badge>
                    ) : null}
                  </div>
                  <div className="p-4">
                    <InvitationCardPreview
                      cardId={`invitation-card-${invitation.id}`}
                      invitation={invitation}
                      brideName={brideName || "Novia"}
                      groomName={groomName || "Novio"}
                      showAddress={isPremium}
                    />
                  </div>
                  <div className="flex flex-col gap-2 border-t border-border-subtle p-4">
                    <Button
                      type="button"
                      onClick={() => downloadPng(invitation)}
                      loading={downloadingId === invitation.id}
                      loadingLabel="Generando PNG…"
                      fullWidth
                    >
                      Descargar invitación
                    </Button>
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="secundario"
                        size="sm"
                        onClick={() => openEdit(invitation)}
                      >
                        Editar
                      </Button>
                      <ConfirmDeleteForm
                        action={deleteInvitationAction}
                        message="¿Eliminar esta invitación?"
                      >
                        <input
                          type="hidden"
                          name="invitation_id"
                          value={invitation.id}
                        />
                        <AccountDeleteButton />
                      </ConfirmDeleteForm>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </AccountSection>

        {aside ? <div className="min-w-0">{aside}</div> : null}
      </div>
    </>
  );
}
