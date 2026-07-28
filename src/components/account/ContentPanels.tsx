"use client";

import { useActionState } from "react";
import {
  addFaqItemAction,
  addScheduleItemAction,
  deleteFaqItemAction,
  deleteScheduleItemAction,
} from "@/lib/account/actions/content";
import type { FormState } from "@/lib/account/form-state";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { FormAlert } from "@/components/account/FormAlert";
import { ConfirmDeleteForm } from "@/components/account/ConfirmDeleteForm";
import {
  FormField,
  FormInput,
  FormTextarea,
  formControlClassName,
} from "@/components/account/FormField";
import {
  SCHEDULE_ICON_OPTIONS,
  scheduleIconLabel,
} from "@/lib/schedule/icons";

interface CronogramaPanelProps {
  items: Array<{
    id: string;
    time: string;
    title: string;
    description: string | null;
    icon: string;
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
      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        {items.length === 0 ? (
          <AccountEmptyState
            title="Todavía no hay momentos en el cronograma"
            description="Agregá ceremonia, recepción u otros hitos del día con el formulario de abajo."
            actions={[
              {
                label: "Agregar primer momento",
                href: "#agregar-cronograma",
                primary: true,
              },
              { label: "Compartir sitio", href: "/mi-cuenta/invitar" },
            ]}
          />
        ) : (
          <ul className="divide-y divide-stone-100">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-[#e6dac7]">
                    {item.time}
                  </p>
                  <p className="font-medium text-stone-800">{item.title}</p>
                  <p className="text-xs text-stone-400">
                    {scheduleIconLabel(item.icon)}
                  </p>
                  {item.description ? (
                    <p className="text-sm text-stone-500">{item.description}</p>
                  ) : null}
                </div>
                <ConfirmDeleteForm
                  action={deleteScheduleItemAction}
                  message="¿Eliminar este ítem del cronograma?"
                >
                  <input type="hidden" name="item_id" value={item.id} />
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </ConfirmDeleteForm>
              </li>
            ))}
          </ul>
        )}

        <form
          id="agregar-cronograma"
          action={addAction}
          className="mt-6 scroll-mt-24 grid gap-4 sm:grid-cols-2"
        >
          <FormInput
            label="Horario"
            name="time"
            required
            placeholder="18:00"
          />
          <FormInput
            label="Título"
            name="title"
            required
            placeholder="Ceremonia"
          />
          <FormField label="Ícono" htmlFor="schedule-icon">
            <select
              id="schedule-icon"
              name="icon"
              defaultValue="anillos"
              className={formControlClassName}
            >
              {SCHEDULE_ICON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormInput
            label="Detalle"
            name="description"
            placeholder="Lugar / detalle (opcional)"
          />
          <div className="sm:col-span-2">
            <FormAlert error={addState.error} success={addState.success} />
            <button
              type="submit"
              disabled={addPending}
              className="mt-2 rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800"
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
      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        {items.length === 0 ? (
          <AccountEmptyState
            title="Todavía no hay FAQs"
            description="Respondé las dudas frecuentes de tus invitados con el formulario de abajo."
            actions={[
              {
                label: "Agregar primera pregunta",
                href: "#agregar-faq",
                primary: true,
              },
            ]}
          />
        ) : (
          <ul className="divide-y divide-stone-100">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 py-4"
              >
                <div>
                  <p className="font-medium text-stone-800">{item.question}</p>
                  <p className="mt-1 text-sm text-stone-500">{item.answer}</p>
                </div>
                <ConfirmDeleteForm
                  action={deleteFaqItemAction}
                  message="¿Eliminar esta pregunta?"
                >
                  <input type="hidden" name="item_id" value={item.id} />
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </ConfirmDeleteForm>
              </li>
            ))}
          </ul>
        )}

        <form
          id="agregar-faq"
          action={addAction}
          className="mt-6 scroll-mt-24 space-y-4"
        >
          <FormInput
            label="Pregunta"
            name="question"
            required
            placeholder="¿Hay estacionamiento?"
          />
          <FormTextarea
            label="Respuesta"
            name="answer"
            required
            rows={3}
            placeholder="Sí, hay cochera gratuita frente al salón."
          />
          <FormAlert error={addState.error} success={addState.success} />
          <button
            type="submit"
            disabled={addPending}
            className="rounded-full bg-[#e6dac7] px-5 py-2.5 text-sm font-semibold text-stone-800"
          >
            {addPending ? "Agregando…" : "Agregar FAQ"}
          </button>
        </form>
      </section>
    </div>
  );
}
