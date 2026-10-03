"use client";

import { useActionState, useRef } from "react";
import {
  updateBodaAction,
  type BodaFormState,
} from "@/lib/account/actions/boda";
import {
  AccountFieldGroup,
  AccountFormActions,
  AccountSection,
} from "@/components/account/AccountPage";
import { FormAlert } from "@/components/account/FormAlert";
import { Badge, Button, Checkbox, Input, Textarea } from "@/components/ui";

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
    <AccountSection
      id="boda-datos"
      title="Información del micrositio"
      description="Completá los datos y guardá: los cambios se ven al instante en tu sitio público."
    >
      <form ref={formRef} action={formAction} className="space-y-6">
        <AccountFieldGroup
          title="La pareja"
          description={
            <>
              Dirección pública de tu sitio:{" "}
              <span className="font-semibold text-text-primary">
                /bodas/{initialValues.slug}
              </span>
            </>
          }
        >
          <Input
            id="title"
            name="title"
            label="Título del micrositio"
            hint="Es lo primero que ven tus invitados, por ejemplo sus nombres."
            defaultValue={initialValues.title}
            placeholder="María & Juan"
            required
            minLength={2}
            maxLength={120}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="bride_name"
              name="bride_name"
              label="Nombre novia/o 1"
              defaultValue={initialValues.brideName}
              required
              minLength={2}
              maxLength={100}
            />
            <Input
              id="groom_name"
              name="groom_name"
              label="Nombre novia/o 2"
              defaultValue={initialValues.groomName}
              required
              minLength={2}
              maxLength={100}
            />
          </div>
        </AccountFieldGroup>

        <AccountFieldGroup
          title="Fecha y lugar"
          description="Se usan en la portada, la cuenta regresiva y las invitaciones."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Input
              id="event_date"
              name="event_date"
              label="Fecha"
              hint="Formato DD/MM/AAAA"
              defaultValue={initialValues.eventDate}
              placeholder="15/11/2026"
              required
            />
            <Input
              id="event_time"
              name="event_time"
              label="Hora"
              optional
              defaultValue={initialValues.eventTime}
              placeholder="19:30"
              maxLength={40}
            />
            <Input
              id="event_place"
              name="event_place"
              label="Lugar"
              optional
              defaultValue={initialValues.eventPlace}
              placeholder="Estancia La Paz, Pilar"
              maxLength={200}
            />
          </div>
        </AccountFieldGroup>

        <AccountFieldGroup
          title="Contenido"
          description="Textos y música que acompañan tu micrositio."
        >
          <Textarea
            id="our_story"
            name="our_story"
            label="Nuestra historia"
            hint="Máximo 3000 caracteres."
            optional
            defaultValue={initialValues.ourStory}
            rows={5}
            maxLength={3000}
            placeholder="Contá brevemente su historia..."
          />
          <Input
            id="spotify_url"
            name="spotify_url"
            label={
              isPremium ? (
                "Playlist de Spotify"
              ) : (
                <span className="inline-flex flex-wrap items-center gap-2">
                  Playlist de Spotify
                  <Badge tone="premium">
                    <span className="sr-only">Requiere plan </span>Premium
                  </Badge>
                </span>
              )
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
        </AccountFieldGroup>

        <AccountFieldGroup
          title="Acceso al micrositio"
          description="Por defecto cualquiera con el link puede ver tu sitio. Podés protegerlo con una contraseña."
        >
          <Input
            id="password"
            name="password"
            label="Contraseña del micrositio"
            optional
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
            <Checkbox
              name="clear_password"
              value="1"
              label="Quitar contraseña (acceso público)"
            />
          ) : null}
        </AccountFieldGroup>

        <AccountFormActions
          alert={<FormAlert error={state.error} success={state.success} />}
        >
          <Button type="submit" loading={isPending} loadingLabel="Guardando…">
            Guardar cambios
          </Button>
        </AccountFormActions>
      </form>
    </AccountSection>
  );
}
