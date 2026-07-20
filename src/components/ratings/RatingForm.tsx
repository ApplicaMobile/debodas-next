"use client";

import { useActionState, useState } from "react";
import { submitRatingAction } from "@/lib/ratings/actions";
import type { FormState } from "@/lib/account/form-state";

const initialState: FormState = {};

interface RatingFormProps {
  bodaId: string;
  coupleName: string;
}

export function RatingForm({ bodaId, coupleName }: RatingFormProps) {
  const [state, action, pending] = useActionState(
    submitRatingAction,
    initialState,
  );
  const [score, setScore] = useState(0);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-serif text-xl text-emerald-900">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="boda_id" value={bodaId} />
      <input type="hidden" name="score" value={score || ""} />

      <p className="text-stone-600">
        Contanos cómo fue tu experiencia con DeBodas para{" "}
        <span className="font-semibold text-stone-800">{coupleName}</span>.
      </p>

      <div>
        <p className="mb-2 text-sm font-medium text-stone-700">Calificación</p>
        <div className="flex gap-2 text-3xl" role="group" aria-label="Estrellas">
          {[1, 2, 3, 4, 5].map((value) => {
            const active = value <= score;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setScore(value)}
                className={
                  active
                    ? "text-amber-600 transition"
                    : "text-stone-300 transition hover:text-amber-500"
                }
                aria-label={`${value} estrellas`}
              >
                ★
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-stone-700"
          htmlFor="name"
        >
          Nombre
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-800 outline-none focus:border-[#e6dac7]"
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-stone-700"
          htmlFor="email"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-800 outline-none focus:border-[#e6dac7]"
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-stone-700"
          htmlFor="comment"
        >
          Comentario (opcional)
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-800 outline-none focus:border-[#e6dac7]"
          placeholder="¿Qué te gustó más?"
        />
      </div>

      {state.error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || score < 1}
        className="w-full rounded-full bg-[#e6dac7] px-6 py-3 text-sm font-semibold text-stone-800 disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar calificación"}
      </button>
    </form>
  );
}
