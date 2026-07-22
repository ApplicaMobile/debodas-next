"use client";

import { useActionState, useRef } from "react";
import {
  updateBodaAction,
  type BodaFormState,
} from "@/lib/account/actions/boda";
import { FormAlert } from "@/components/account/FormAlert";

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
  password: string;
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
        <span className="font-medium text-stone-800">/bodas/{initialValues.slug}</span>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">
          Título del micrositio
        </label>
        <input
          name="title"
          defaultValue={initialValues.title}
          className="w-full rounded-xl border border-stone-200 px-4 py-3"
          placeholder="María & Juan"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Nombre novia/o 1
          </label>
          <input
            name="bride_name"
            defaultValue={initialValues.brideName}
            className="w-full rounded-xl border border-stone-200 px-4 py-3"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Nombre novia/o 2
          </label>
          <input
            name="groom_name"
            defaultValue={initialValues.groomName}
            className="w-full rounded-xl border border-stone-200 px-4 py-3"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Fecha
          </label>
          <input
            name="event_date"
            defaultValue={initialValues.eventDate}
            className="w-full rounded-xl border border-stone-200 px-4 py-3"
            placeholder="15/11/2026"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Hora
          </label>
          <input
            name="event_time"
            defaultValue={initialValues.eventTime}
            className="w-full rounded-xl border border-stone-200 px-4 py-3"
            placeholder="19:30"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Lugar
          </label>
          <input
            name="event_place"
            defaultValue={initialValues.eventPlace}
            className="w-full rounded-xl border border-stone-200 px-4 py-3"
            placeholder="Estancia La Paz, Pilar"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">
          Nuestra historia
        </label>
        <textarea
          name="our_story"
          defaultValue={initialValues.ourStory}
          rows={5}
          className="w-full rounded-xl border border-stone-200 px-4 py-3"
          placeholder="Contá brevemente su historia..."
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">
          Playlist de Spotify
          {!isPremium ? (
            <span className="ml-2 text-xs font-normal text-stone-500">
              (Premium)
            </span>
          ) : null}
        </label>
        <input
          name="spotify_url"
          type="text"
          defaultValue={initialValues.spotifyUrl}
          disabled={!isPremium}
          className="w-full rounded-xl border border-stone-200 px-4 py-3 disabled:bg-stone-50 disabled:text-stone-400"
          placeholder="ID o URL de la playlist (ej: open.spotify.com/playlist/...)"
          autoComplete="off"
        />
        <p className="mt-2 text-xs text-stone-500">
          {isPremium
            ? "Pegá el link o el ID de una playlist pública. Se muestra al final del micrositio."
            : "Disponible en el plan Premium. Podés upgradear desde Plan."}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">
          Contraseña del micrositio
        </label>
        <input
          name="password"
          type="text"
          defaultValue={initialValues.password}
          className="w-full rounded-xl border border-stone-200 px-4 py-3"
          placeholder="Opcional — dejá vacío para acceso público"
          autoComplete="off"
        />
        <p className="mt-2 text-xs text-stone-500">
          Si la completás, los invitados deberán ingresarla antes de ver el
          micrositio.
        </p>
      </div>

      <FormAlert error={state.error} success={state.success} />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[#e6dac7] px-6 py-3 text-sm font-semibold text-stone-800 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
