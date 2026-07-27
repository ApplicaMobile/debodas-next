"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  deleteCanvaLinkAction,
  markInviteSharedAction,
  saveCanvaLinkAction,
} from "@/lib/account/actions/invitations";
import type { FormState } from "@/lib/account/form-state";
import { buildWhatsAppShareUrl } from "@/lib/account/invite-message";
import { ConfirmDeleteForm } from "@/components/account/ConfirmDeleteForm";
import { FormAlert } from "@/components/account/FormAlert";
import { toCanvaEmbedUrl } from "@/lib/invitations/parse";

interface CanvaInvitePanelProps {
  canvaLink: string;
  isPremium: boolean;
  micrositeUrl?: string;
  coupleName?: string;
}

const initialState: FormState = {};

export function CanvaInvitePanel({
  canvaLink,
  isPremium,
  micrositeUrl = "",
  coupleName = "Nosotros",
}: CanvaInvitePanelProps) {
  const [state, formAction, pending] = useActionState(
    saveCanvaLinkAction,
    initialState,
  );
  const [copied, setCopied] = useState(false);

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
  const inviteSectionUrl = micrositeUrl
    ? `${micrositeUrl.split("#")[0]}#invitacion-canva`
    : "";
  const whatsappUrl = inviteSectionUrl
    ? buildWhatsAppShareUrl(
        [
          `✨ Invitación de ${coupleName.trim() || "Nosotros"}`,
          "",
          "Mirá nuestro diseño:",
          inviteSectionUrl,
        ].join("\n"),
      )
    : canvaLink
      ? buildWhatsAppShareUrl(
          [
            `✨ Invitación de ${coupleName.trim() || "Nosotros"}`,
            "",
            canvaLink,
          ].join("\n"),
        )
      : "";

  async function copyCanvaLink() {
    if (!canvaLink) return;
    try {
      await navigator.clipboard.writeText(canvaLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      void markInviteSharedAction();
    } catch {
      window.prompt("Copiá el link de Canva:", canvaLink);
    }
  }

  return (
    <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 sm:rounded-3xl sm:p-8">
      <h3 className="text-lg font-semibold text-stone-800">
        ¿Tenés un diseño en Canva?
      </h3>
      <p className="mt-1 text-sm text-stone-600">
        Pegá el link de “Ver” de Canva para embeber tu diseño. La descarga del
        archivo (PNG/PDF) se hace desde Canva.
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
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyCanvaLink()}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            {copied ? "¡Copiado!" : "Copiar link"}
          </button>
          <a
            href={canvaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Abrir en Canva ↗
          </a>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void markInviteSharedAction()}
              className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe57]"
            >
              WhatsApp
            </a>
          ) : null}
          <ConfirmDeleteForm
            action={deleteCanvaLinkAction}
            message="¿Eliminar el diseño de Canva?"
            className="inline"
          >
            <button
              type="submit"
              className="rounded-full px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Eliminar
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
