"use client";

import Link from "next/link";
import { useState } from "react";
import { markInviteSharedAction } from "@/lib/account/actions/invitations";
import {
  buildDefaultWhatsAppMessage,
  buildWhatsAppShareUrl,
} from "@/lib/account/invite-message";
import {
  AccountSection,
  AccountWhatsAppLink,
} from "@/components/account/AccountPage";
import { formControlClassName } from "@/components/account/FormField";
import { Button, IconExternalLink, Textarea } from "@/components/ui";

interface InviteSharePanelProps {
  coupleName: string;
  micrositeUrl: string;
  hasPassword: boolean;
}

export function InviteSharePanel({
  coupleName,
  micrositeUrl,
  hasPassword,
}: InviteSharePanelProps) {
  const [message, setMessage] = useState(() =>
    buildDefaultWhatsAppMessage({
      coupleName,
      micrositeUrl,
      hasPassword,
    }),
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  async function copyText(value: string, kind: "link" | "message") {
    try {
      await navigator.clipboard.writeText(value);
      if (kind === "link") {
        setCopiedLink(true);
        window.setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedMessage(true);
        window.setTimeout(() => setCopiedMessage(false), 2000);
      }
      void markInviteSharedAction();
    } catch {
      window.prompt("Copiá el texto:", value);
    }
  }

  return (
    <div className="grid gap-6 sm:gap-8 2xl:grid-cols-2 2xl:items-start">
      <AccountSection
        id="invitar-link"
        title="Tu link para compartir"
        description="Compartí esta URL. Desde ahí pueden confirmar y regalar."
      >
        <div className="rounded-md border border-border-subtle bg-surface-muted p-4">
          <p className="type-overline text-text-secondary">Vista previa · debodas.com.ar</p>
          <p className="mt-2 font-serif type-h4 text-text-primary">{coupleName}</p>
          <p className="mt-1 truncate type-body-sm text-text-accent">
            {micrositeUrl.replace(/^https?:\/\//, "")}
          </p>
          <p className="mt-2 type-caption text-text-secondary">
            Así llega el link a tus invitados.
          </p>
          {hasPassword ? (
            <p className="mt-3 type-body-sm font-semibold text-status-warning-fg">
              El sitio pide contraseña: compartila aparte (no va en el link).
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            readOnly
            value={micrositeUrl}
            className={`${formControlClassName} min-h-12 min-w-0 flex-1`}
            aria-label="Link del micrositio"
          />
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              onClick={() => void copyText(micrositeUrl, "link")}
              className="flex-1 sm:flex-none"
            >
              {copiedLink ? "¡Copiado!" : "Copiar link"}
            </Button>
            <a
              href={micrositeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-action-secondary-bg px-6 type-button text-action-secondary-fg hover:bg-action-secondary-bg-hover sm:flex-none"
            >
              Abrir
              <IconExternalLink size={18} />
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </div>
        </div>

        {!hasPassword ? (
          <p className="mt-4 type-body-sm text-text-secondary">
            Tip: podés proteger el sitio con contraseña desde{" "}
            <Link
              href="/mi-cuenta/boda"
              className="focus-ring rounded-sm font-semibold text-text-link underline underline-offset-2"
            >
              Datos de la boda
            </Link>
            .
          </p>
        ) : null}
      </AccountSection>

      <AccountSection
        id="invitar-whatsapp"
        title="Mensaje para WhatsApp"
        description="Editá el texto si querés y enviálo por WhatsApp con un toque."
      >
        <Textarea
          id="invitar-mensaje"
          label="Mensaje"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={10}
        />

        <div className="mt-5 flex flex-col gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="fantasma"
            onClick={() =>
              setMessage(
                buildDefaultWhatsAppMessage({ coupleName, micrositeUrl }),
              )
            }
          >
            Restaurar plantilla
          </Button>
          <Button
            type="button"
            variant="secundario"
            onClick={() => void copyText(message, "message")}
          >
            {copiedMessage ? "¡Mensaje copiado!" : "Copiar mensaje"}
          </Button>
          <AccountWhatsAppLink
            href={buildWhatsAppShareUrl(message)}
            onClick={() => void markInviteSharedAction()}
          >
            Compartir por WhatsApp
          </AccountWhatsAppLink>
        </div>
      </AccountSection>
    </div>
  );
}
