export const ADMIN_ROLE = "admin";
export const COUPLE_ROLE = "couple";

export function isAdminRole(role: string | null | undefined): boolean {
  return role === ADMIN_ROLE;
}
