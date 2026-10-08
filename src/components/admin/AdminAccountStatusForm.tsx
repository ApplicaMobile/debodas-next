"use client";

import { useId, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { changeAccountStatusAction } from "@/lib/admin/actions";
import { accountCompactControlClass } from "@/components/account/AccountPage";
import {
  Button,
  IconButton,
  IconPause,
  IconPlay,
  IconTrash,
  IconUndo,
  type ButtonVariant,
  type IconButtonVariant,
} from "@/components/ui";

/**
 * Botón de operación (name="op"). En modo compacto (filas de tabla) es un
 * ícono con tooltip; en el detalle es un botón de texto chico.
 */
function OpButton({
  op,
  label,
  pendingLabel = "Aplicando…",
  icon,
  compact,
  variant = "secundario",
  iconVariant = "neutral",
  disabled,
}: {
  op: string;
  label: string;
  pendingLabel?: string;
  icon: ReactNode;
  compact: boolean;
  variant?: ButtonVariant;
  iconVariant?: IconButtonVariant;
  disabled?: boolean;
}) {
  const { pending, data } = useFormStatus();
  // Solo el botón que se apretó muestra el spinner; el resto queda bloqueado.
  const isThisOp = pending && data?.get("op") === op;
  if (compact) {
    return (
      <IconButton
        type="submit"
        name="op"
        value={op}
        label={isThisOp ? pendingLabel : label}
        icon={icon}
        variant={iconVariant}
        loading={isThisOp}
        disabled={disabled || (pending && !isThisOp)}
      />
    );
  }
  return (
    <Button
      type="submit"
      name="op"
      value={op}
      size="sm"
      variant={variant}
      icon={icon}
      loading={isThisOp}
      loadingLabel={pendingLabel}
      disabled={disabled || (pending && !isThisOp)}
    >
      {label}
    </Button>
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
  const baseId = useId();
  const reasonId = `${baseId}-reason`;
  const confirmId = `${baseId}-confirm`;
  const deletePanelId = `${baseId}-delete-panel`;

  if (erased) {
    return (
      <p className="type-caption text-text-secondary">
        Borrada por la pareja (definitivo). No se puede restaurar.
      </p>
    );
  }
  if (isSelf) {
    return <p className="type-caption text-text-tertiary">Tu cuenta</p>;
  }

  const emailMatches = confirmEmail.trim().toLowerCase() === email.trim().toLowerCase();

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

      <div className={compact ? "flex max-w-full items-center gap-2" : "space-y-3"}>
        {status !== "deleted" ? (
          <div className="min-w-0 flex-1">
            <label
              htmlFor={reasonId}
              className={compact ? "sr-only" : "mb-1 block type-label text-text-primary"}
            >
              Motivo (opcional){compact ? ` para ${email}` : ""}
            </label>
            <input
              id={reasonId}
              type="text"
              name="reason"
              maxLength={500}
              placeholder={compact ? "Motivo (opcional)" : "Ej.: pedido de la pareja, pago rechazado…"}
              className={accountCompactControlClass}
            />
          </div>
        ) : null}

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {status === "active" ? (
            <OpButton
              op="suspend"
              label="Suspender"
              pendingLabel="Suspendiendo…"
              icon={<IconPause />}
              compact={compact}
              variant="secundario"
            />
          ) : null}
          {status === "suspended" ? (
            <OpButton
              op="reactivate"
              label="Reactivar"
              pendingLabel="Reactivando…"
              icon={<IconPlay />}
              compact={compact}
              variant="primario"
              iconVariant="primary"
            />
          ) : null}
          {status === "deleted" ? (
            <OpButton
              op="restore"
              label="Restaurar"
              pendingLabel="Restaurando…"
              icon={<IconUndo />}
              compact={compact}
              variant="primario"
              iconVariant="primary"
            />
          ) : compact ? (
            <IconButton
              type="button"
              label={showDelete ? "Cancelar eliminación" : "Eliminar cuenta…"}
              icon={<IconTrash />}
              variant="danger"
              aria-expanded={showDelete}
              aria-controls={deletePanelId}
              onClick={() => setShowDelete((value) => !value)}
            />
          ) : (
            <Button
              type="button"
              size="sm"
              variant="fantasma"
              icon={<IconTrash />}
              aria-expanded={showDelete}
              aria-controls={deletePanelId}
              onClick={() => setShowDelete((value) => !value)}
            >
              {showDelete ? "Cancelar" : "Eliminar…"}
            </Button>
          )}
        </div>
      </div>

      {showDelete && status !== "deleted" ? (
        <div
          id={deletePanelId}
          className="space-y-3 rounded-md border border-status-error-border bg-status-error-bg p-3"
        >
          <label htmlFor={confirmId} className="block type-body-sm text-status-error-fg">
            Escribí <strong className="break-all">{email}</strong> para confirmar:
          </label>
          <input
            id={confirmId}
            type="text"
            name="confirm_email"
            autoComplete="off"
            value={confirmEmail}
            onChange={(event) => setConfirmEmail(event.target.value)}
            className={accountCompactControlClass}
          />
          <p className="type-caption text-status-error-fg">
            Es una baja lógica: la cuenta desaparece del sitio, pero los datos quedan y se puede restaurar.
          </p>
          <OpButton
            op="delete"
            label="Eliminar cuenta"
            pendingLabel="Eliminando…"
            icon={<IconTrash />}
            compact={false}
            variant="peligro"
            disabled={!emailMatches}
          />
        </div>
      ) : null}
    </form>
  );
}
