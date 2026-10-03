"use client";

import { useActionState, useEffect, useState } from "react";
import { formatPrice } from "@/data/bodas";
import {
  addGiftAction,
  deleteGiftAction,
  updateGiftAction,
  updateGiftDisplayOptionsAction,
  updateGiftsListTitleAction,
} from "@/lib/account/actions/gifts";
import type { FormState } from "@/lib/account/form-state";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { FormAlert } from "@/components/account/FormAlert";
import { ConfirmDeleteForm } from "@/components/account/ConfirmDeleteForm";
import { IllustrationGift } from "@/components/account/AccountIllustrations";
import {
  AccountDeleteButton,
  AccountFormActions,
  AccountSection,
  AccountPlanUsage,
} from "@/components/account/AccountPage";
import {
  Badge,
  Button,
  Checkbox,
  Input,
} from "@/components/ui";
import { ImageFileInput } from "@/components/ui/ImageFileInput";
import { resolveGiftImageUrl } from "@/lib/gifts/image";
import {
  canAddGift,
  getPlanLimits,
  giftLimitMessage,
} from "@/lib/plans/limits";
import { normalizePlan } from "@/lib/plans/features";

interface GiftRow {
  id: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

interface GiftsPanelProps {
  listTitle: string;
  plan: string;
  gifts: GiftRow[];
  freeMount: boolean;
  hideGiftsList: boolean;
}

const initialState: FormState = {};

function GiftEditor({
  gift,
  onCancel,
}: {
  gift: GiftRow;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    updateGiftAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      onCancel();
    }
    // Cerrar el editor al guardar; onCancel es setEditingId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form
      action={formAction}
      className="mt-4 space-y-5 rounded-md border border-border-subtle bg-surface-muted p-4"
    >
      <input type="hidden" name="gift_id" value={gift.id} />
      <p className="type-overline text-text-accent">Editar regalo</p>
      <div className="grid gap-5 sm:grid-cols-4">
        <Input
          id={`gift-${gift.id}-title`}
          label="Nombre del regalo"
          className="sm:col-span-2"
          name="title"
          required
          defaultValue={gift.title}
          placeholder="Nombre del regalo"
        />
        <Input
          id={`gift-${gift.id}-price`}
          label="Precio"
          name="price"
          type="number"
          min="0"
          required
          defaultValue={gift.price}
          placeholder="Precio"
        />
        <Input
          id={`gift-${gift.id}-quantity`}
          label="Cantidad"
          name="quantity"
          type="number"
          min="1"
          defaultValue={gift.quantity}
          placeholder="Cant."
        />
        <Input
          id={`gift-${gift.id}-image-url`}
          label="URL de imagen"
          optional
          className="sm:col-span-4"
          name="image_url"
          type="url"
          defaultValue={
            gift.imageUrl && !gift.imageUrl.startsWith("/assets/")
              ? gift.imageUrl
              : ""
          }
          placeholder="URL de imagen (opcional)"
        />
      </div>
      <ImageFileInput
        name="image_file"
        label="Cambiar imagen"
        hint="JPG, PNG, WebP o GIF. Máximo 5 MB."
        variant="dropzone"
        subject="la imagen"
      />
      <Checkbox
        name="clear_image"
        value="1"
        label="Quitar imagen (usar placeholder)"
      />
      <FormAlert error={state.error} success={state.success} />
      <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="secundario" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isPending} loadingLabel="Guardando…">
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}

export function GiftsPanel({
  listTitle,
  plan,
  gifts,
  freeMount,
  hideGiftsList,
}: GiftsPanelProps) {
  const limits = getPlanLimits(plan);
  const atGiftLimit = !canAddGift(plan, gifts.length);
  const isPremium = normalizePlan(plan) === "premium";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleState, titleAction, titlePending] = useActionState(
    updateGiftsListTitleAction,
    initialState,
  );
  const [optionsState, optionsAction, optionsPending] = useActionState(
    updateGiftDisplayOptionsAction,
    initialState,
  );
  const [addState, addAction, addPending] = useActionState(
    addGiftAction,
    initialState,
  );

  return (
    <>
      <AccountSection
        id="regalos-lista"
        title="Regalos"
        description="Lo que tus invitados pueden elegir para regalarles, con su precio y cantidad."
        badge={
          <Badge tone="neutro" icon={false}>
            {gifts.length} {gifts.length === 1 ? "regalo" : "regalos"}
          </Badge>
        }
        actions={
          gifts.length > 0 && !atGiftLimit ? (
            <Button href="#agregar-regalo" size="sm">
              Agregar regalo
            </Button>
          ) : null
        }
      >
        <AccountPlanUsage
          label="Regalos"
          value={gifts.length}
          max={limits.maxGifts}
          unit="regalos"
          message={giftLimitMessage(plan)}
        />
        {gifts.length === 0 ? (
          <div className="mt-6">
            <AccountEmptyState
              illustration={IllustrationGift}
              title="Todavía no hay regalos en la lista"
              description="Agregá el primero con el formulario de abajo. Después configurá los métodos de pago y compartí el link."
              actions={[
                {
                  label: "Agregar primer regalo",
                  href: "#agregar-regalo",
                  primary: true,
                },
                { label: "Métodos de pago", href: "/mi-cuenta/pagos" },
                { label: "Compartir / invitar", href: "/mi-cuenta/invitar" },
              ]}
            />
          </div>
        ) : (
          <ul role="list" aria-label="Regalos de la lista" className="mt-6 space-y-3">
            {gifts.map((gift) => (
              <li
                key={gift.id}
                className="rounded-md border border-border-subtle bg-surface-default p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveGiftImageUrl(gift.imageUrl)}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate type-label text-text-primary">
                        {gift.title}
                      </p>
                      <p className="type-body-sm tabular-nums text-text-secondary">
                        {formatPrice(gift.price)} · Cant: {gift.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="secundario"
                      size="sm"
                      aria-expanded={editingId === gift.id}
                      onClick={() =>
                        setEditingId((current) =>
                          current === gift.id ? null : gift.id,
                        )
                      }
                    >
                      {editingId === gift.id ? "Cerrar" : "Editar"}
                    </Button>
                    <ConfirmDeleteForm
                      action={deleteGiftAction}
                      message="¿Eliminar este regalo?"
                    >
                      <input type="hidden" name="gift_id" value={gift.id} />
                      <AccountDeleteButton />
                    </ConfirmDeleteForm>
                  </div>
                </div>
                {editingId === gift.id ? (
                  <GiftEditor
                    gift={gift}
                    onCancel={() => setEditingId(null)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </AccountSection>

      <AccountSection
        id="regalos-agregar"
        title="Agregar un regalo"
        description="Nombre, precio y cantidad disponible. La imagen es opcional: podés pegar una URL o subir un archivo."
      >
        <form
          id="agregar-regalo"
          action={addAction}
          className="scroll-mt-24 space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-4">
            <Input
              id="add-gift-title"
              label="Nombre del regalo"
              className="sm:col-span-2"
              name="title"
              placeholder="Nombre del regalo"
              required
              disabled={atGiftLimit}
            />
            <Input
              id="add-gift-price"
              label="Precio"
              name="price"
              type="number"
              min="0"
              placeholder="Precio"
              required
              disabled={atGiftLimit}
            />
            <Input
              id="add-gift-quantity"
              label="Cantidad"
              name="quantity"
              type="number"
              min="1"
              defaultValue="1"
              placeholder="Cant."
              disabled={atGiftLimit}
            />
            <Input
              id="add-gift-image-url"
              label="URL de imagen"
              optional
              className="sm:col-span-4"
              name="image_url"
              type="url"
              placeholder="URL de imagen (opcional)"
              disabled={atGiftLimit}
            />
          </div>
          <ImageFileInput
            name="image_file"
            label="O subir imagen"
            hint="JPG, PNG, WebP o GIF. Máximo 5 MB."
            variant="dropzone"
            subject="la imagen"
          />
          <AccountFormActions
            alert={<FormAlert error={addState.error} success={addState.success} />}
          >
            <Button
              type="submit"
              disabled={atGiftLimit}
              loading={addPending}
              loadingLabel="Agregando…"
            >
              {atGiftLimit ? "Límite de regalos alcanzado" : "Agregar regalo"}
            </Button>
          </AccountFormActions>
        </form>
      </AccountSection>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:items-start">
        <AccountSection
          id="regalos-titulo"
          title="Título de la sección"
          description="El encabezado que ven tus invitados arriba de la lista."
        >
          <form action={titleAction}>
            <Input
              id="gifts_list_title"
              label="Título de la sección"
              name="gifts_list_title"
              defaultValue={listTitle}
              placeholder="Lista de regalos"
            />
            <AccountFormActions
              alert={<FormAlert error={titleState.error} success={titleState.success} />}
            >
              <Button type="submit" variant="secundario" disabled={titlePending}>
                Guardar título
              </Button>
            </AccountFormActions>
          </form>
        </AccountSection>

        <AccountSection
          id="regalos-visibilidad"
          title="Cómo se muestra la lista"
          description="Elegí qué ven tus invitados en la sección de regalos del micrositio."
        >
          <form action={optionsAction} className="space-y-1">
            {isPremium ? (
              <Checkbox
                name="free_mount"
                defaultChecked={freeMount}
                label="Permitir un monto libre (sin elegir un regalo de la lista)"
              />
            ) : freeMount ? (
              <input type="hidden" name="free_mount" value="on" />
            ) : null}
            <Checkbox
              name="hide_gifts_list"
              defaultChecked={hideGiftsList}
              label="Ocultar la lista de regalos en el micrositio"
            />
            <AccountFormActions
              alert={
                <FormAlert error={optionsState.error} success={optionsState.success} />
              }
            >
              <Button
                type="submit"
                variant="secundario"
                loading={optionsPending}
                loadingLabel="Guardando…"
              >
                Guardar visibilidad
              </Button>
            </AccountFormActions>
          </form>
        </AccountSection>
      </div>
    </>
  );
}
