"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  updateBodaAction,
  type BodaFormState,
} from "@/lib/account/actions/boda";

export interface BodaFormValues {
  title: string;
  brideName: string;
  groomName: string;
  eventDate: string;
  eventTime: string;
  eventPlace: string;
  ourStory: string;
  slug: string;
  password: string;
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

  useEffect(() => {
    if (state.success) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state.success]);

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

      {state.error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          {state.success}
        </p>
      ) : null}

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
