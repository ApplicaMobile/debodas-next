"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  deleteCanvaLinkAction,
  saveCanvaLinkAction,
} from "@/lib/account/actions/invitations";
import type { FormState } from "@/lib/account/form-state";
import { ConfirmDeleteForm } from "@/components/account/ConfirmDeleteForm";
import { FormAlert } from "@/components/account/FormAlert";
import { toCanvaEmbedUrl } from "@/lib/invitations/parse";

interface CanvaInvitePanelProps {
  canvaLink: string;
  isPremium: boolean;
}

const initialState: FormState = {};

export function CanvaInvitePanel({
  canvaLink,
  isPremium,
}: CanvaInvitePanelProps) {
  const [state, formAction, pending] = useActionState(
    saveCanvaLinkAction,
    initialState,
  );

  if (!isPremium) {
    return (
      <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 sm:rounded-3xl sm:p-8">
        <h3 className="text-lg font-semibold text-stone-800">
          ¿Tenés un diseño en Canva?
        </h3>
        <p className="mt-1 text-sm text-stone-600">
          En el plan Premium podés pegar el link de tu invitación de Canva para
          mostrarla a tus invitados.
        </p>
        <Link
          href="/mi-cuenta/plan"
          className="mt-4 inline-flex rounded-full bg-[#e6dac7] px-4 py-2.5 text-sm font-semibold text-stone-800"
        >
          Ver plan Premium
        </Link>
      </section>
    );
  }

  const embedUrl = canvaLink ? toCanvaEmbedUrl(canvaLink) : "";

  return (
    <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 sm:rounded-3xl sm:p-8">
      <h3 className="text-lg font-semibold text-stone-800">
        ¿Tenés un diseño en Canva?
      </h3>
      <p className="mt-1 text-sm text-stone-600">
        Pegá el link de “Ver” de Canva para embeber tu diseño.
      </p>

      <FormAlert error={state.error} success={state.success} />

      <form action={formAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          name="canva_link"
          required
          defaultValue={canvaLink}
          placeholder="https://www.canva.com/design/..."
          className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#06263a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Guardando…" : canvaLink ? "Actualizar" : "Guardar"}
        </button>
      </form>

      {canvaLink ? (
        <div className="mt-3">
          <ConfirmDeleteForm
            action={deleteCanvaLinkAction}
            message="¿Eliminar el diseño de Canva?"
            className="inline"
          >
            <button
              type="submit"
              className="text-sm font-medium text-red-700 hover:underline"
            >
              Eliminar diseño
            </button>
          </ConfirmDeleteForm>
        </div>
      ) : null}

      {embedUrl ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <p className="text-sm font-semibold text-stone-800">
              Vista previa Canva
            </p>
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Activo
            </span>
          </div>
          <iframe
            title="Invitación Canva"
            src={embedUrl}
            className="h-[520px] w-full border-0"
            loading="lazy"
            allow="fullscreen"
            allowFullScreen
          />
        </div>
      ) : null}
    </section>
  );
}
