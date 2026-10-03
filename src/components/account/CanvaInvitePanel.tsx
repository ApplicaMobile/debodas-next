"use client";

import { useActionState, useState } from "react";
import {
  deleteCanvaLinkAction,
  markInviteSharedAction,
  saveCanvaLinkAction,
} from "@/lib/account/actions/invitations";
import type { FormState } from "@/lib/account/form-state";
import { buildWhatsAppShareUrl } from "@/lib/account/invite-message";
import { ConfirmDeleteForm } from "@/components/account/ConfirmDeleteForm";
import {
  AccountDeleteButton,
  AccountSection,
  AccountWhatsAppLink,
} from "@/components/account/AccountPage";
import { FormAlert } from "@/components/account/FormAlert";
import { Badge, Button, Input } from "@/components/ui";
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
      <AccountSection
        id="invitar-canva"
        title="¿Tenés un diseño en Canva?"
        badge={
          <Badge tone="premium">
            <span className="sr-only">Plan </span>Premium
          </Badge>
        }
        description="En el plan Premium podés pegar el link de tu invitación de Canva para mostrarla a tus invitados."
      >
        <Button href="/mi-cuenta/plan" variant="secundario">
          Ver plan Premium
        </Button>
      </AccountSection>
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
    <AccountSection
      id="invitar-canva"
      title="¿Tenés un diseño en Canva?"
      description="Pegá el link de “Ver” de Canva para embeber tu diseño. La descarga del archivo (PNG/PDF) se hace desde Canva."
      badge={embedUrl ? <Badge tone="aprobado">Activo</Badge> : null}
    >
      <div className="empty:hidden">
        <FormAlert error={state.error} success={state.success} />
      </div>

      <form action={formAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          id="canva_link"
          label="Link de Canva"
          className="min-w-0 flex-1"
          type="url"
          name="canva_link"
          required
          defaultValue={canvaLink}
          placeholder="https://www.canva.com/design/..."
        />
        <Button type="submit" loading={pending} loadingLabel="Guardando…">
          {canvaLink ? "Actualizar" : "Guardar"}
        </Button>
      </form>

      {canvaLink ? (
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-5">
          <Button
            type="button"
            variant="secundario"
            size="sm"
            onClick={() => void copyCanvaLink()}
          >
            {copied ? "¡Copiado!" : "Copiar link"}
          </Button>
          <a
            href={canvaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-full bg-action-secondary-bg px-4 py-2 type-button-sm text-action-secondary-fg hover:bg-action-secondary-bg-hover"
          >
            Abrir en Canva ↗
          </a>
          {whatsappUrl ? (
            <AccountWhatsAppLink
              href={whatsappUrl}
              size="sm"
              onClick={() => void markInviteSharedAction()}
            >
              WhatsApp
            </AccountWhatsAppLink>
          ) : null}
          <ConfirmDeleteForm
            action={deleteCanvaLinkAction}
            message="¿Eliminar el diseño de Canva?"
            className="inline"
          >
            <AccountDeleteButton />
          </ConfirmDeleteForm>
        </div>
      ) : null}

      {embedUrl ? (
        <div className="mt-6 overflow-hidden rounded-md border border-border-subtle">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <p className="type-label text-text-primary">Vista previa Canva</p>
          </div>
          <iframe
            title="Invitación Canva"
            src={embedUrl}
            className="h-[360px] w-full border-0 xl:h-[420px]"
            loading="lazy"
            allow="fullscreen"
            allowFullScreen
          />
        </div>
      ) : null}
    </AccountSection>
  );
}
