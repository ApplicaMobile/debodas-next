"use client";

import { useActionState, useRef } from "react";
import {
  updateBodaAction,
  type BodaFormState,
} from "@/lib/account/actions/boda";
import { FormAlert } from "@/components/account/FormAlert";
import { FormInput, FormTextarea } from "@/components/account/FormField";
import { StickyFormActions } from "@/components/account/StickyFormActions";

export interface BodaFormValues {
  title: string;
  brideName: string;
  groomName: string;
  eventDate: string;
  eventTime: string;
  eventPlace: string;
  ourStory: string;
  spotifyUrl: string;
  slug: string;
  hasPassword: boolean;
  plan: string;
}

interface BodaFormProps {
  initialValues: BodaFormValues;
}

const initialState: BodaFormState = {};

export function BodaForm({ initialValues }: BodaFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateBodaAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const isPremium = initialValues.plan === "premium";

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
        URL pública:{" "}
        <span className="font-medium text-stone-800">
          /bodas/{initialValues.slug}
        </span>
      </div>

      <FormInput
        name="title"
        label="Título del micrositio"
        defaultValue={initialValues.title}
        placeholder="María & Juan"
        required
        minLength={2}
        maxLength={120}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput
          name="bride_name"
          label="Nombre novia/o 1"
          defaultValue={initialValues.brideName}
          required
          minLength={2}
          maxLength={100}
        />
        <FormInput
          name="groom_name"
          label="Nombre novia/o 2"
          defaultValue={initialValues.groomName}
          required
          minLength={2}
          maxLength={100}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormInput
          name="event_date"
          label="Fecha"
          defaultValue={initialValues.eventDate}
          placeholder="15/11/2026"
          required
          hint="Formato DD/MM/AAAA"
        />
        <FormInput
          name="event_time"
          label="Hora"
          defaultValue={initialValues.eventTime}
          placeholder="19:30"
          maxLength={40}
        />
        <FormInput
          name="event_place"
          label="Lugar"
          defaultValue={initialValues.eventPlace}
          placeholder="Estancia La Paz, Pilar"
          maxLength={200}
        />
      </div>

      <FormTextarea
        name="our_story"
        label="Nuestra historia"
        defaultValue={initialValues.ourStory}
        rows={5}
        maxLength={3000}
        placeholder="Contá brevemente su historia..."
        hint="Máximo 3000 caracteres."
      />

      <FormInput
        name="spotify_url"
        label={
          isPremium
            ? "Playlist de Spotify"
            : "Playlist de Spotify (Premium)"
        }
        type="text"
        defaultValue={initialValues.spotifyUrl}
        disabled={!isPremium}
        placeholder="ID o URL de la playlist (ej: open.spotify.com/playlist/...)"
        autoComplete="off"
        hint={
          isPremium
            ? "Pegá el link o el ID de una playlist pública. Se muestra al final del micrositio."
            : "Disponible en el plan Premium. Podés upgradear desde Plan."
        }
      />

      <div>
        <FormInput
          name="password"
          label="Contraseña del micrositio"
          type="text"
          defaultValue=""
          placeholder={
            initialValues.hasPassword
              ? "Dejá vacío para mantener la actual"
              : "Opcional — acceso público si está vacío"
          }
          autoComplete="off"
          maxLength={72}
          hint={
            initialValues.hasPassword
              ? "Hay una contraseña activa (guardada de forma segura). Escribí una nueva para cambiarla."
              : "Si la completás, los invitados deberán ingresarla antes de ver el micrositio."
          }
        />
        {initialValues.hasPassword ? (
          <label className="mt-3 flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              name="clear_password"
              value="1"
              className="rounded border-stone-300"
            />
            Quitar contraseña (acceso público)
          </label>
        ) : null}
      </div>

      <StickyFormActions alert={<FormAlert error={state.error} success={state.success} />}>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[#e6dac7] px-6 py-3 text-sm font-semibold text-stone-800 disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Guardar cambios"}
        </button>
      </StickyFormActions>
    </form>
  );
}
