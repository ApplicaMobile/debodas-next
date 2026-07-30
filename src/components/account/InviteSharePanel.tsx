"use client";

import Link from "next/link";
import { useState } from "react";
import { markInviteSharedAction } from "@/lib/account/actions/invitations";
import {
  buildDefaultWhatsAppMessage,
  buildWhatsAppShareUrl,
} from "@/lib/account/invite-message";

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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm sm:rounded-3xl">
        <div className="border-b border-stone-100 bg-gradient-to-r from-[#06263a] to-[#0a3550] px-4 py-5 text-white sm:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
            Vista previa
          </p>
          <p className="mt-2 font-serif text-2xl font-semibold">{coupleName}</p>
          <p className="mt-1 text-sm text-white/75">
            Así llega el link a tus invitados.
          </p>
        </div>
        <div className="p-4 sm:p-8">
          <div className="rounded-2xl border border-stone-200 bg-[#f7f3eb] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              debodas.com.ar
            </p>
            <p className="mt-2 font-serif text-lg font-semibold text-stone-800">
              {coupleName}
            </p>
            <p className="mt-1 truncate text-sm text-[#6f5f47]">
              {micrositeUrl.replace(/^https?:\/\//, "")}
            </p>
            {hasPassword ? (
              <p className="mt-3 text-xs text-amber-800">
                El sitio pide contraseña: compartila aparte (no va en el link).
              </p>
            ) : null}
          </div>

          <h3 className="mt-6 text-lg font-semibold text-stone-800">
            Link del micrositio
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            Compartí esta URL. Desde ahí pueden confirmar y regalar.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              readOnly
              value={micrositeUrl}
              className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800"
              aria-label="Link del micrositio"
            />
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => void copyText(micrositeUrl, "link")}
                className="rounded-full bg-[#e6dac7] px-4 py-2.5 text-sm font-semibold text-stone-800"
              >
                {copiedLink ? "¡Copiado!" : "Copiar link"}
              </button>
              <a
                href={micrositeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Abrir ↗
              </a>
            </div>
          </div>

          {!hasPassword ? (
            <p className="mt-3 text-sm text-stone-500">
              Tip: podés proteger el sitio con contraseña desde{" "}
              <Link
                href="/mi-cuenta/boda"
                className="font-medium text-[#6f5f47] hover:underline"
              >
                Datos de la boda
              </Link>
              .
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h3 className="text-lg font-semibold text-stone-800">
          Mensaje para WhatsApp
        </h3>
        <p className="mt-1 text-sm text-stone-600">
          Editá el texto si querés y enviálo por WhatsApp con un toque.
        </p>

        <label className="mt-4 block text-sm text-stone-700">
          Mensaje
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={10}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm leading-relaxed text-stone-800"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={buildWhatsAppShareUrl(message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void markInviteSharedAction()}
            className="inline-flex rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-105"
          >
            Compartir por WhatsApp
          </a>
          <button
            type="button"
            onClick={() => void copyText(message, "message")}
            className="rounded-full border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            {copiedMessage ? "¡Mensaje copiado!" : "Copiar mensaje"}
          </button>
          <button
            type="button"
            onClick={() =>
              setMessage(
                buildDefaultWhatsAppMessage({ coupleName, micrositeUrl }),
              )
            }
            className="rounded-full border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Restaurar plantilla
          </button>
        </div>
      </section>
    </div>
  );
}
