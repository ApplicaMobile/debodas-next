"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { changeAccountStatusAction } from "@/lib/admin/actions";

function OpButton({
  op,
  idleLabel,
  pendingLabel = "…",
  className,
}: {
  op: string;
  idleLabel: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="op"
      value={op}
      disabled={pending}
      aria-disabled={pending}
      className={`${className ?? ""} disabled:cursor-wait disabled:opacity-60`}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

interface AdminAccountStatusFormProps {
  userId: string;
  email: string;
  status: string;
  erased: boolean;
  isSelf: boolean;
  /** "/admin/usuarios" o "/admin/bodas/<id>" */
  returnTo: string;
  /** Para volver a la misma página / búsqueda del listado. */
  q?: string;
  page?: number;
  estado?: string;
  compact?: boolean;
}

const CONFIRM: Record<string, string> = {
  suspend:
    "¿Suspender esta cuenta? La pareja no podrá entrar y el micrositio dejará de verse hasta reactivarla.",
  reactivate: "¿Reactivar esta cuenta? Si el micrositio estaba online, vuelve a publicarse.",
  restore:
    "¿Restaurar esta cuenta eliminada? Vuelve a estar activa y el micrositio recupera su estado anterior.",
};

/**
 * Suspender / Reactivar / Eliminar / Restaurar. Eliminar es baja lógica y exige
 * escribir el email de la cuenta (el servidor lo vuelve a validar).
 */
export function AdminAccountStatusForm({
  userId,
  email,
  status,
  erased,
  isSelf,
  returnTo,
  q,
  page,
  estado,
  compact = false,
}: AdminAccountStatusFormProps) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  if (erased) {
    return (
      <p className="text-xs text-stone-500">
        Borrada por la pareja (definitivo). No se puede restaurar.
      </p>
    );
  }
  if (isSelf) {
    return <p className="text-xs text-stone-400">Tu cuenta</p>;
  }

  const emailMatches = confirmEmail.trim().toLowerCase() === email.trim().toLowerCase();
  const buttonBase = "rounded-lg px-2.5 py-1.5 text-xs font-semibold";

  return (
    <form
      action={changeAccountStatusAction}
      className={compact ? "space-y-2" : "space-y-3"}
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter as
          | HTMLButtonElement
          | null;
        const op = submitter?.value ?? "";
        if (op === "delete") {
          if (!emailMatches) {
            event.preventDefault();
            window.alert("Escribí el email exacto de la cuenta para eliminarla.");
            return;
          }
          if (
            !window.confirm(
              "¿Eliminar esta cuenta? Es una baja lógica: desaparece del sitio pero los datos quedan y se puede restaurar.",
            )
          ) {
            event.preventDefault();
          }
          return;
        }
        if (CONFIRM[op] && !window.confirm(CONFIRM[op])) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="return_to" value={returnTo} />
      {q ? <input type="hidden" name="q" value={q} /> : null}
      {page && page > 1 ? <input type="hidden" name="page" value={page} /> : null}
      {estado ? <input type="hidden" name="estado" value={estado} /> : null}

      {status !== "deleted" ? (
        <input
          type="text"
          name="reason"
          maxLength={500}
          placeholder="Motivo (opcional)"
          className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-xs"
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        {status === "active" ? (
          <OpButton
            op="suspend"
            idleLabel="Suspender"
            pendingLabel="…"
            className={`${buttonBase} border border-amber-300 text-amber-900`}
          />
        ) : null}
        {status === "suspended" ? (
          <OpButton
            op="reactivate"
            idleLabel="Reactivar"
            pendingLabel="…"
            className={`${buttonBase} bg-emerald-700 text-white`}
          />
        ) : null}
        {status === "deleted" ? (
          <OpButton
            op="restore"
            idleLabel="Restaurar"
            pendingLabel="…"
            className={`${buttonBase} bg-stone-800 text-white`}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowDelete((value) => !value)}
            className={`${buttonBase} border border-red-200 text-red-700`}
          >
            Eliminar…
          </button>
        )}
      </div>

      {showDelete && status !== "deleted" ? (
        <div className="space-y-2 rounded-lg bg-red-50 p-2">
          <label className="block text-xs text-red-800">
            Escribí <strong className="break-all">{email}</strong> para confirmar:
            <input
              type="text"
              name="confirm_email"
              autoComplete="off"
              value={confirmEmail}
              onChange={(event) => setConfirmEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs"
            />
          </label>
          <OpButton
            op="delete"
            idleLabel="Eliminar cuenta"
            pendingLabel="Eliminando…"
            className={`${buttonBase} bg-red-700 text-white ${emailMatches ? "" : "opacity-50"}`}
          />
        </div>
      ) : null}
    </form>
  );
}