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
import {
  IllustrationCalendar,
  IllustrationQuestions,
} from "@/components/account/AccountIllustrations";
import {
  AccountDeleteButton,
  AccountFormActions,
  AccountItemList,
  AccountListItem,
  AccountSection,
} from "@/components/account/AccountPage";
import { Badge, Button, Input, Select, Textarea } from "@/components/ui";
import { FormAlert } from "@/components/account/FormAlert";
import { ConfirmDeleteForm } from "@/components/account/ConfirmDeleteForm";
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
    <>
      <AccountSection
        id="cronograma-momentos"
        title="Momentos del día"
        description="Así se ve el cronograma en tu micrositio, en este orden."
        badge={
          items.length > 0 ? (
            <Badge tone="neutro" icon={false}>
              {items.length} {items.length === 1 ? "momento" : "momentos"}
            </Badge>
          ) : null
        }
      >
        {items.length === 0 ? (
          <AccountEmptyState
            illustration={IllustrationCalendar}
            title="Todavía no hay momentos en el cronograma"
            description="Agregá ceremonia, recepción u otros hitos del día. Tus invitados lo van a ver en el micrositio."
            actions={[
              {
                label: "Agregar primer momento",
                href: "#agregar-cronograma",
                primary: true,
              },
              { label: "Compartir / invitar", href: "/mi-cuenta/invitar" },
              { label: "Ver FAQ", href: "/mi-cuenta/faq" },
            ]}
          />
        ) : (
          <AccountItemList label="Momentos del cronograma">
            {items.map((item) => (
              <AccountListItem
                key={item.id}
                leading={
                  <span className="type-h4 tabular-nums text-text-accent">
                    {item.time}
                  </span>
                }
                title={item.title}
                meta={scheduleIconLabel(item.icon)}
                actions={
                  <ConfirmDeleteForm
                    action={deleteScheduleItemAction}
                    message="¿Eliminar este ítem del cronograma?"
                  >
                    <input type="hidden" name="item_id" value={item.id} />
                    <AccountDeleteButton />
                  </ConfirmDeleteForm>
                }
              >
                {item.description ? item.description : null}
              </AccountListItem>
            ))}
          </AccountItemList>
        )}
      </AccountSection>

      <AccountSection
        id="cronograma-agregar"
        title="Agregar un momento"
        description="Completá el horario y el título; el ícono y el detalle ayudan a que se entienda de un vistazo."
      >
        <form
          id="agregar-cronograma"
          action={addAction}
          className="scroll-mt-24"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="time"
              label="Horario"
              name="time"
              required
              placeholder="18:00"
            />
            <Input
              id="title"
              label="Título"
              name="title"
              required
              placeholder="Ceremonia"
            />
            <Select
              id="schedule-icon"
              label="Ícono"
              name="icon"
              defaultValue="anillos"
              options={SCHEDULE_ICON_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
            <Input
              id="description"
              label="Detalle"
              optional
              name="description"
              placeholder="Lugar / detalle (opcional)"
            />
          </div>
          <AccountFormActions
            alert={<FormAlert error={addState.error} success={addState.success} />}
          >
            <Button type="submit" disabled={addPending}>
              Agregar al cronograma
            </Button>
          </AccountFormActions>
        </form>
      </AccountSection>
    </>
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
    <>
      <AccountSection
        id="faq-preguntas"
        title="Preguntas publicadas"
        description="Se muestran en tu micrositio en este orden."
        badge={
          items.length > 0 ? (
            <Badge tone="neutro" icon={false}>
              {items.length} {items.length === 1 ? "pregunta" : "preguntas"}
            </Badge>
          ) : null
        }
      >
        {items.length === 0 ? (
          <AccountEmptyState
            illustration={IllustrationQuestions}
            title="Todavía no hay preguntas frecuentes"
            description="Respondé dudas típicas (estacionamiento, dress code, niños) para que los invitados encuentren todo en un solo lugar."
            actions={[
              {
                label: "Agregar primera pregunta",
                href: "#agregar-faq",
                primary: true,
              },
              { label: "Armar cronograma", href: "/mi-cuenta/cronograma" },
              { label: "Dress code", href: "/mi-cuenta/dress-code" },
            ]}
          />
        ) : (
          <AccountItemList label="Preguntas frecuentes">
            {items.map((item) => (
              <AccountListItem
                key={item.id}
                title={item.question}
                actions={
                  <ConfirmDeleteForm
                    action={deleteFaqItemAction}
                    message="¿Eliminar esta pregunta?"
                  >
                    <input type="hidden" name="item_id" value={item.id} />
                    <AccountDeleteButton />
                  </ConfirmDeleteForm>
                }
              >
                {item.answer}
              </AccountListItem>
            ))}
          </AccountItemList>
        )}
      </AccountSection>

      <AccountSection
        id="faq-agregar"
        title="Agregar una pregunta"
        description="Escribí la duda tal como la haría un invitado y una respuesta corta."
      >
        <form id="agregar-faq" action={addAction} className="scroll-mt-24 space-y-5">
          <Input
            id="question"
            label="Pregunta"
            name="question"
            required
            placeholder="¿Hay estacionamiento?"
          />
          <Textarea
            id="answer"
            label="Respuesta"
            name="answer"
            required
            rows={3}
            placeholder="Sí, hay cochera gratuita frente al salón."
          />
          <AccountFormActions
            alert={<FormAlert error={addState.error} success={addState.success} />}
          >
            <Button type="submit" loading={addPending} loadingLabel="Agregando…">
              Agregar FAQ
            </Button>
          </AccountFormActions>
        </form>
      </AccountSection>
    </>
  );
}
