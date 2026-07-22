"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { toPng } from "html-to-image";
import {
  deleteInvitationAction,
  saveInvitationAction,
} from "@/lib/account/actions/invitations";
import type { FormState } from "@/lib/account/form-state";
import { ConfirmDeleteForm } from "@/components/account/ConfirmDeleteForm";
import { FormAlert } from "@/components/account/FormAlert";
import { InvitationCardPreview } from "@/components/account/InvitationCardPreview";
import { buildInvitationFilename } from "@/lib/invitations/format";
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
      <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />
    ),
  },
);

interface InvitationBuilderProps {
  invitations: DigitalInvitation[];
  brideName: string;
  groomName: string;
  isPremium: boolean;
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

const emptyDraft = (): Draft => ({
  id: "",
  name: "",
  title: "",
  description: "",
  theme: "flores",
  datetime: "",
  outfit: "formal",
  locationName: "",
  address: "",
  lat: "",
  lng: "",
  isVisibleInMicrosite: false,
});

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
}: InvitationBuilderProps) {
  const [state, formAction, pending] = useActionState(
    saveInvitationAction,
    initialState,
  );
  const [openForm, setOpenForm] = useState(invitations.length === 0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const themes = useMemo(() => getInvitationThemeOptions(), []);
  const selectedTheme = themes.find((t) => t.slug === draft.theme) ?? themes[0];
  const isEditing = Boolean(draft.id);

  useEffect(() => {
    if (state.success) {
      setDraft(emptyDraft());
      setOpenForm(false);
    }
  }, [state.success]);

  function openCreate() {
    setDraft(emptyDraft());
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

  return (
    <div className="space-y-6">
      <section
        id="invitation-form"
        className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-stone-800">
              Invitaciones digitales
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              Creá tarjetas con plantillas, descargalas en PNG y compartilas.
              {isPremium
                ? " Con Premium podés marcar la ubicación en el mapa."
                : " La ubicación con mapa está disponible en Premium."}
            </p>
          </div>
          <button
            type="button"
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
            disabled={invitations.length >= MAX_INVITATIONS && !openForm}
            className="rounded-full bg-[#e6dac7] px-4 py-2.5 text-sm font-semibold text-stone-800 disabled:opacity-50"
          >
            {openForm && !isEditing ? "Cerrar formulario" : "Nueva invitación"}
          </button>
        </div>

        <FormAlert error={state.error} success={state.success} />

        {openForm ? (
          <form
            action={formAction}
            className="mt-6 space-y-5 border-t border-stone-100 pt-6"
          >
            {isEditing ? (
              <input type="hidden" name="invitation_id" value={draft.id} />
            ) : null}

            {isEditing ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Editando: <strong>{draft.name || "invitación"}</strong>
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-stone-700">
                Nombre
                <input
                  name="name"
                  required
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, name: e.target.value }))
                  }
                  placeholder="Ceremonia, Fiesta, etc."
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                />
              </label>
              <label className="block text-sm text-stone-700">
                Título
                <input
                  name="title"
                  required
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  placeholder="Nos vamos a casar"
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                />
              </label>
              <label className="block text-sm text-stone-700 sm:col-span-2">
                Descripción
                <textarea
                  name="description"
                  rows={3}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  placeholder="Texto opcional (no repitas el título)"
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                />
              </label>
              <label className="block text-sm text-stone-700">
                Tema
                <select
                  name="theme"
                  value={draft.theme}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      theme: e.target.value as InvitationThemeSlug,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                >
                  {themes.map((theme) => (
                    <option key={theme.slug} value={theme.slug}>
                      {theme.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-stone-700">
                Fecha y hora
                <input
                  type="datetime-local"
                  name="datetime"
                  required
                  value={draft.datetime}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, datetime: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                />
              </label>
              <label className="block text-sm text-stone-700">
                Vestimenta
                <select
                  name="outfit"
                  value={draft.outfit}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      outfit: e.target.value as InvitationOutfit,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                >
                  {INVITATION_OUTFITS.map((outfit) => (
                    <option key={outfit} value={outfit}>
                      {OUTFIT_LABELS[outfit]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-stone-700">
                Nombre del lugar
                <input
                  name="location_name"
                  value={draft.locationName}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, locationName: e.target.value }))
                  }
                  placeholder="Salón, iglesia, etc."
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                />
              </label>
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
              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                El mapa y la dirección completa están en el plan Premium. Podés
                cargar el nombre del lugar igual.{" "}
                <Link
                  href="/mi-cuenta/plan"
                  className="font-semibold underline"
                >
                  Ver planes
                </Link>
              </div>
            )}

            <label className="flex items-start gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="is_visible_in_microsite"
                checked={draft.isVisibleInMicrosite}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    isVisibleInMicrosite: e.target.checked,
                  }))
                }
                className="mt-1"
              />
              <span>
                Mostrar botones Agendar / Ir al lugar en el micrositio
              </span>
            </label>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
              <div>
                <p className="mb-2 text-sm font-medium text-stone-700">
                  Vista previa del tema
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedTheme.previewSrc}
                  alt={`Vista previa ${selectedTheme.label}`}
                  className="mx-auto max-h-64 w-auto rounded-xl border border-stone-100 object-contain"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-stone-700">
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

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-[#06263a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pending
                  ? "Guardando…"
                  : isEditing
                    ? "Guardar cambios"
                    : "Guardar invitación"}
              </button>
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(emptyDraft());
                    setOpenForm(false);
                  }}
                  className="rounded-full border border-stone-200 px-5 py-2.5 text-sm font-medium text-stone-700"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        ) : null}
      </section>

      <section className="space-y-4">
        {invitations.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-stone-500 shadow-sm">
            Todavía no hay invitaciones digitales.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {invitations.map((invitation) => (
              <article
                key={invitation.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <div className="border-b border-stone-100 px-4 py-3">
                  <h4 className="font-semibold text-stone-800">
                    {invitation.name}
                  </h4>
                  {invitation.isVisibleInMicrosite ? (
                    <p className="mt-0.5 text-xs text-[#6f5f47]">
                      Visible en micrositio
                    </p>
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
                <div className="space-y-2 border-t border-stone-100 p-4">
                  <button
                    type="button"
                    onClick={() => openEdit(invitation)}
                    className="w-full rounded-full border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadPng(invitation)}
                    disabled={downloadingId === invitation.id}
                    className="w-full rounded-full bg-[#e6dac7] px-4 py-2.5 text-sm font-semibold text-stone-800 disabled:opacity-60"
                  >
                    {downloadingId === invitation.id
                      ? "Generando PNG…"
                      : "Descargar invitación"}
                  </button>
                  <ConfirmDeleteForm
                    action={deleteInvitationAction}
                    message="¿Eliminar esta invitación?"
                  >
                    <input
                      type="hidden"
                      name="invitation_id"
                      value={invitation.id}
                    />
                    <button
                      type="submit"
                      className="w-full rounded-full border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                    >
                      Eliminar
                    </button>
                  </ConfirmDeleteForm>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
