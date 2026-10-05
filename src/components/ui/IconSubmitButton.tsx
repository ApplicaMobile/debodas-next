"use client";

import { useFormStatus } from "react-dom";
import { IconButton, type IconButtonProps } from "./IconButton";

export type IconSubmitButtonProps = Omit<IconButtonProps, "type" | "loading"> & {
  /** Nombre accesible y tooltip mientras se envía (p. ej. "Guardando…"). */
  pendingLabel?: string;
};

/**
 * IconButton de envío: dentro de un <form> muestra spinner y se bloquea mientras
 * la acción del formulario está pendiente (evita doble envío).
 */
export function IconSubmitButton({
  label,
  pendingLabel,
  tooltip,
  ...props
}: IconSubmitButtonProps) {
  const { pending } = useFormStatus();
  const currentLabel = pending && pendingLabel ? pendingLabel : label;
  return (
    <IconButton
      {...props}
      type="submit"
      label={currentLabel}
      tooltip={pending && pendingLabel ? pendingLabel : tooltip}
      loading={pending}
    />
  );
}
