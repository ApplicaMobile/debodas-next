import {
  isValidRegisterPlanSlug,
  normalizeRegisterPlan,
} from "@/lib/auth/plans";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;
const MIN_NAME_LENGTH = 2;
const MIN_PHONE_LENGTH = 8;

export const SITE_SOURCE_OPTIONS = [
  { value: "search", label: "Buscador (Google, etc.)" },
  { value: "social", label: "Redes sociales" },
  { value: "referral", label: "Recomendación de alguien" },
  { value: "ads", label: "Publicidad" },
  { value: "email", label: "Email / newsletter" },
  { value: "direct", label: "Ya conocía el sitio" },
  { value: "other", label: "Otro" },
] as const;

export interface RegisterInput {
  email: string;
  password: string;
  passwordConfirm: string;
  brideName: string;
  brideLastname: string;
  groomName: string;
  groomLastname: string;
  phone: string;
  eventDate: string;
  ourStory: string;
  siteSource: string;
  siteSourceOther: string;
  selectedPlan: string;
}

export type RegisterValidation =
  | { ok: true; data: RegisterInput }
  | { ok: false; error: string };

function parseRegisterFields(formData: FormData): RegisterInput {
  return {
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("password_confirm") ?? ""),
    brideName: String(formData.get("bride_name") ?? "").trim(),
    brideLastname: String(formData.get("bride_lastname") ?? "").trim(),
    groomName: String(formData.get("groom_name") ?? "").trim(),
    groomLastname: String(formData.get("groom_lastname") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    eventDate: String(formData.get("event_date") ?? "").trim(),
    ourStory: String(formData.get("our_story") ?? "").trim(),
    siteSource: String(formData.get("site_source") ?? "").trim(),
    siteSourceOther: String(formData.get("site_source_other") ?? "").trim(),
    selectedPlan: String(formData.get("selected_plan") ?? "gratuito").trim(),
  };
}

function validateEmail(email: string): string | null {
  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return "Ingresá un email válido.";
  }
  return null;
}

function validatePassword(password: string, passwordConfirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `La contraseña no puede superar ${MAX_PASSWORD_LENGTH} caracteres.`;
  }

  if (password !== passwordConfirm) {
    return "Las contraseñas no coinciden.";
  }

  return null;
}

function validateName(value: string, label: string): string | null {
  if (value.length < MIN_NAME_LENGTH) {
    return `${label} debe tener al menos ${MIN_NAME_LENGTH} caracteres.`;
  }
  if (value.length > 100) {
    return `${label} no puede superar 100 caracteres.`;
  }
  return null;
}

export function validateRegisterStep1(formData: FormData): string | null {
  const data = parseRegisterFields(formData);
  return (
    validateEmail(data.email) ??
    validatePassword(data.password, data.passwordConfirm)
  );
}

export function validateRegisterStep2(formData: FormData): string | null {
  const data = parseRegisterFields(formData);

  return (
    validateName(data.brideName, "El nombre 1") ??
    validateName(data.brideLastname, "El apellido 1") ??
    validateName(data.groomName, "El nombre 2") ??
    validateName(data.groomLastname, "El apellido 2") ??
    (data.phone.length < MIN_PHONE_LENGTH || data.phone.length > 40
      ? `El teléfono debe tener entre ${MIN_PHONE_LENGTH} y 40 caracteres.`
      : null) ??
    (data.ourStory.length > 3000
      ? "La historia no puede superar 3000 caracteres."
      : null) ??
    (!data.eventDate ? "Ingresá la fecha de la boda." : null) ??
    (!data.siteSource ? "Seleccioná cómo nos conociste." : null) ??
    (data.siteSource === "other" && !data.siteSourceOther
      ? "Contanos cómo nos conociste."
      : null)
  );
}

export function validateRegisterStep3(formData: FormData): string | null {
  const data = parseRegisterFields(formData);
  if (!isValidRegisterPlanSlug(data.selectedPlan)) {
    return "Seleccioná un plan.";
  }
  const accepted =
    formData.get("accept_terms") === "on" ||
    formData.get("accept_terms") === "1" ||
    formData.get("accept_terms") === "true";
  if (!accepted) {
    return "Debés aceptar los términos y la política de privacidad.";
  }
  return null;
}

export function validateRegisterInput(formData: FormData): RegisterValidation {
  const data = parseRegisterFields(formData);

  const stepError =
    validateRegisterStep1(formData) ??
    validateRegisterStep2(formData) ??
    validateRegisterStep3(formData);

  if (stepError) {
    return { ok: false, error: stepError };
  }

  return { ok: true, data };
}

export function buildCoupleTitle(
  brideName: string,
  brideLastname: string,
  groomName: string,
  groomLastname: string,
): string {
  const bride = [brideName, brideLastname].filter(Boolean).join(" ");
  const groom = [groomName, groomLastname].filter(Boolean).join(" ");
  return [bride, groom].filter(Boolean).join(" & ");
}

export function buildPlanValue(selectedPlan: string): string {
  return normalizeRegisterPlan(selectedPlan);
}
