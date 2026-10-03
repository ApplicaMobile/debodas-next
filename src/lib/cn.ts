import { clsx, type ClassValue } from "clsx";

/** Une clases condicionales. Sin tailwind-merge: los componentes evitan clases en conflicto. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
