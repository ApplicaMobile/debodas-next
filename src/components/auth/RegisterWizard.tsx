"use client";

import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { registerAction, type RegisterState } from "@/lib/auth/actions";
import { REGISTER_PLANS } from "@/lib/auth/plans";
import {
  SITE_SOURCE_OPTIONS,
  validateRegisterStep1,
  validateRegisterStep2,
  validateRegisterStep3,
} from "@/lib/auth/register";
import { ImageFileInput } from "@/components/ui/ImageFileInput";

const initialState: RegisterState = {};
const TOTAL_STEPS = 3;
const STEP_LABELS = ["Cuenta", "Tu boda", "Plan"];

interface RegisterFields {
  email: string;
  password: string;
  password_confirm: string;
  bride_name: string;
  bride_lastname: string;
  groom_name: string;
  groom_lastname: string;
  phone: string;
  event_date: string;
  our_story: string;
}

const emptyFields: RegisterFields = {
  email: "",
  password: "",
  password_confirm: "",
  bride_name: "",
  bride_lastname: "",
  groom_name: "",
  groom_lastname: "",
  phone: "",
  event_date: "",
  our_story: "",
};

function StepError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {message}
    </p>
  );
}

export function RegisterWizard() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [fields, setFields] = useState<RegisterFields>(emptyFields);
  const [siteSource, setSiteSource] = useState("");
  const [siteSourceOther, setSiteSourceOther] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("gratuito");
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState,
  );

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state.success, state.redirectTo, router]);

  useEffect(() => {
    if (stepError) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [stepError]);

  function updateField(name: keyof RegisterFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    setStepError(null);
  }

  function buildFormData(): FormData {
    const formData = new FormData();

    for (const [name, value] of Object.entries(fields)) {
      formData.set(name, value);
    }

    formData.set("site_source", siteSource);
    formData.set(
      "site_source_other",
      siteSource === "other" ? siteSourceOther : "",
    );
    formData.set("selected_plan", selectedPlan);

    const bannerInput = formRef.current?.elements.namedItem("banner_file");
    if (
      bannerInput instanceof HTMLInputElement &&
      bannerInput.files?.[0]
    ) {
      formData.set("banner_file", bannerInput.files[0]);
    }

    return formData;
  }

  function validateStep(stepNumber: number): string | null {
    const formData = buildFormData();

    if (stepNumber === 1) {
      return validateRegisterStep1(formData);
    }
    if (stepNumber === 2) {
      return validateRegisterStep2(formData);
    }
    return validateRegisterStep3(formData);
  }

  function validateAllSteps(): string | null {
    return (
      validateRegisterStep1(buildFormData()) ??
      validateRegisterStep2(buildFormData()) ??
      validateRegisterStep3(buildFormData())
    );
  }

  function goToStepForError(error: string) {
    const formData = buildFormData();
    if (validateRegisterStep1(formData)) {
      setStep(1);
    } else if (validateRegisterStep2(formData)) {
      setStep(2);
    } else {
      setStep(3);
    }
    setStepError(error);
  }

  function handleNext() {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }

    setStepError(null);
    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setStepError(null);
    setStep((current) => Math.max(current - 1, 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const error = validateAllSteps();
    if (error) {
      event.preventDefault();
      goToStepForError(error);
    }
  }

  const inputClassName =
    "w-full rounded-xl border border-stone-200 px-4 py-3";

  return (
    <div className="mt-8">
      <ol className="flex gap-2">
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = step === stepNumber;
          const isDone = step > stepNumber;

          return (
            <li
              key={label}
              className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold sm:text-sm ${
                isActive
                  ? "bg-[#556B2F] text-white"
                  : isDone
                    ? "bg-[#556B2F]/15 text-[#556B2F]"
                    : "bg-stone-100 text-stone-500"
              }`}
            >
              {stepNumber}. {label}
            </li>
          );
        })}
      </ol>

      <form
        ref={formRef}
        action={formAction}
        noValidate
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
      >
        <div className={step === 1 ? "space-y-4" : "hidden"} aria-hidden={step !== 1}>
          <p className="text-sm text-stone-600">
            Creá tu acceso al panel de DeBodas.
          </p>
          <input
            name="email"
            type="email"
            value={fields.email}
            onChange={(event) => updateField("email", event.target.value)}
            className={inputClassName}
            placeholder="Email"
            autoComplete="email"
          />
          <input
            name="password"
            type="password"
            value={fields.password}
            onChange={(event) => updateField("password", event.target.value)}
            className={inputClassName}
            placeholder="Contraseña (mín. 8 caracteres)"
            autoComplete="new-password"
          />
          <input
            name="password_confirm"
            type="password"
            value={fields.password_confirm}
            onChange={(event) =>
              updateField("password_confirm", event.target.value)
            }
            className={inputClassName}
            placeholder="Repetir contraseña"
            autoComplete="new-password"
          />
        </div>

        <div className={step === 2 ? "space-y-4" : "hidden"} aria-hidden={step !== 2}>
          <p className="text-sm text-stone-600">
            Contanos sobre la pareja y la fecha del evento.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="bride_name"
              value={fields.bride_name}
              onChange={(event) => updateField("bride_name", event.target.value)}
              className={inputClassName}
              placeholder="Nombre novia/o 1"
              autoComplete="given-name"
            />
            <input
              name="bride_lastname"
              value={fields.bride_lastname}
              onChange={(event) =>
                updateField("bride_lastname", event.target.value)
              }
              className={inputClassName}
              placeholder="Apellido novia/o 1"
              autoComplete="family-name"
            />
            <input
              name="groom_name"
              value={fields.groom_name}
              onChange={(event) => updateField("groom_name", event.target.value)}
              className={inputClassName}
              placeholder="Nombre novia/o 2"
              autoComplete="given-name"
            />
            <input
              name="groom_lastname"
              value={fields.groom_lastname}
              onChange={(event) =>
                updateField("groom_lastname", event.target.value)
              }
              className={inputClassName}
              placeholder="Apellido novia/o 2"
              autoComplete="family-name"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="phone"
              value={fields.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className={inputClassName}
              placeholder="Teléfono"
              autoComplete="tel"
            />
            <input
              name="event_date"
              value={fields.event_date}
              onChange={(event) => updateField("event_date", event.target.value)}
              className={inputClassName}
              placeholder="Fecha de la boda (dd/mm/aaaa)"
            />
          </div>

          <textarea
            name="our_story"
            rows={3}
            value={fields.our_story}
            onChange={(event) => updateField("our_story", event.target.value)}
            className={inputClassName}
            placeholder="¿Cómo se conocieron? (opcional)"
          />

          <div>
            <label
              htmlFor="site_source"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              ¿Cómo nos conociste?
            </label>
            <select
              id="site_source"
              name="site_source"
              value={siteSource}
              onChange={(event) => {
                setSiteSource(event.target.value);
                setStepError(null);
              }}
              className={inputClassName}
            >
              <option value="">Seleccioná una opción</option>
              {SITE_SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <input
            name="site_source_other"
            value={siteSource === "other" ? siteSourceOther : ""}
            onChange={(event) => {
              setSiteSourceOther(event.target.value);
              setStepError(null);
            }}
            className={siteSource === "other" ? inputClassName : "hidden"}
            placeholder="Contanos cómo nos conociste"
          />

          <ImageFileInput
            name="banner_file"
            label="Foto del banner (opcional)"
            hint="JPG, PNG, WebP o GIF. Máximo 5 MB."
          />
        </div>

        <div className={step === 3 ? "space-y-4" : "hidden"} aria-hidden={step !== 3}>
          <p className="text-sm text-stone-600">
            Elegí con qué plan querés empezar. Los planes pagos se confirman
            luego desde el panel.
          </p>

          <div className="space-y-3">
            {REGISTER_PLANS.map((plan) => (
              <label
                key={plan.slug}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 p-4 transition hover:border-[#556B2F]/40 has-checked:border-[#556B2F] has-checked:bg-[#556B2F]/5"
              >
                <input
                  type="radio"
                  name="selected_plan"
                  value={plan.slug}
                  checked={selectedPlan === plan.slug}
                  onChange={() => {
                    setSelectedPlan(plan.slug);
                    setStepError(null);
                  }}
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold text-stone-800">
                    {plan.name}{" "}
                    <span className="font-normal text-stone-500">
                      · {plan.price}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-stone-600">
                    {plan.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div ref={errorRef}>
          {stepError ? <StepError message={stepError} /> : null}
          {state.error ? <StepError message={state.error} /> : null}
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isPending}
              className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 disabled:opacity-60"
            >
              Anterior
            </button>
          ) : (
            <span />
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full bg-[#556B2F] px-5 py-3 text-sm font-semibold text-white"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[#556B2F] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
