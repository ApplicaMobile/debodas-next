"use client";

import { useActionState } from "react";
import {
  addFaqItemAction,
  addScheduleItemAction,
  deleteFaqItemAction,
  deleteScheduleItemAction,
} from "@/lib/account/actions/content";
import type { FormState } from "@/lib/account/form-state";
import { FormAlert } from "@/components/account/FormAlert";

interface CronogramaPanelProps {
  items: Array<{
    id: string;
    time: string;
    title: string;
    description: string | null;
  }>;
}

const initialState: FormState = {};

export function CronogramaPanel({ items }: CronogramaPanelProps) {
  const [addState, addAction, addPending] = useActionState(
    addScheduleItemAction,
    initialState,
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <ul className="divide-y divide-stone-100">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 py-4"
            >
              <div>
                <p className="text-sm font-semibold text-[#556B2F]">
                  {item.time}
                </p>
                <p className="font-medium text-stone-800">{item.title}</p>
                {item.description ? (
                  <p className="text-sm text-stone-500">{item.description}</p>
                ) : null}
              </div>
              <form action={deleteScheduleItemAction}>
                <input type="hidden" name="item_id" value={item.id} />
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </form>
            </li>
          ))}
        </ul>

        <form action={addAction} className="mt-6 grid gap-3 sm:grid-cols-2">
          <input
            name="time"
            required
            className="rounded-xl border border-stone-200 px-4 py-3"
            placeholder="18:00"
          />
          <input
            name="title"
            required
            className="rounded-xl border border-stone-200 px-4 py-3"
            placeholder="Ceremonia"
          />
          <input
            name="description"
            className="rounded-xl border border-stone-200 px-4 py-3 sm:col-span-2"
            placeholder="Descripción (opcional)"
          />
          <div className="sm:col-span-2">
            <FormAlert error={addState.error} success={addState.success} />
            <button
              type="submit"
              disabled={addPending}
              className="mt-2 rounded-full bg-[#556B2F] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Agregar al cronograma
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function FaqPanel({
  items,
}: {
  items: Array<{ id: string; question: string; answer: string }>;
}) {
  const [addState, addAction, addPending] = useActionState(
    addFaqItemAction,
    initialState,
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <ul className="divide-y divide-stone-100">
          {items.map((item) => (
            <li key={item.id} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-stone-800">{item.question}</p>
                  <p className="mt-1 text-sm text-stone-600">{item.answer}</p>
                </div>
                <form action={deleteFaqItemAction}>
                  <input type="hidden" name="item_id" value={item.id} />
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>

        <form action={addAction} className="mt-6 space-y-3">
          <input
            name="question"
            required
            className="w-full rounded-xl border border-stone-200 px-4 py-3"
            placeholder="Pregunta"
          />
          <textarea
            name="answer"
            required
            rows={3}
            className="w-full rounded-xl border border-stone-200 px-4 py-3"
            placeholder="Respuesta"
          />
          <FormAlert error={addState.error} success={addState.success} />
          <button
            type="submit"
            disabled={addPending}
            className="rounded-full bg-[#556B2F] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Agregar pregunta
          </button>
        </form>
      </section>
    </div>
  );
}
