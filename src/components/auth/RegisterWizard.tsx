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
import { HoneypotField } from "@/components/ui/HoneypotField";
import { PasswordField } from "@/components/ui/PasswordField";

const initialState: RegisterState = {};
const TOTAL_STEPS = 3;
const STEP_LABELS = ["Cuenta", "Tu boda", "Plan"];

const FIELD_NAMES = [
  "email",
  "password",
  "password_confirm",
  "bride_name",
  "bride_lastname",
  "groom_name",
  "groom_lastname",
  "phone",
  "event_date",
  "our_story",
] as const;

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

function readFormValue(form: HTMLFormElement | null, name: string): string {
  if (!form) {
    return "";
  }

  const element = form.elements.namedItem(name);
  if (element instanceof RadioNodeList) {
    for (let index = 0; index < element.length; index += 1) {
      const radio = element[index];
      if (radio instanceof HTMLInputElement && radio.checked) {
        return radio.value;
      }
    }
    return "";
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return element.value;
  }

  return "";
}

export function RegisterWizard() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [showSiteSourceOther, setShowSiteSourceOther] = useState(false);
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

  function buildFormData(): FormData {
    const form = formRef.current;
    const formData = new FormData();

    for (const name of FIELD_NAMES) {
      formData.set(name, readFormValue(form, name));
    }

    formData.set("site_source", readFormValue(form, "site_source"));
    formData.set("site_source_other", readFormValue(form, "site_source_other"));
    formData.set("selected_plan", readFormValue(form, "selected_plan") || "gratuito");

    const acceptTerms = form?.elements.namedItem("accept_terms");
    if (acceptTerms instanceof HTMLInputElement && acceptTerms.checked) {
      formData.set("accept_terms", acceptTerms.value || "1");
    }

    const bannerInput = form?.elements.namedItem("banner_file");
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
    const formData = buildFormData();
    return (
      validateRegisterStep1(formData) ??
      validateRegisterStep2(formData) ??
      validateRegisterStep3(formData)
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

  function clearStepError() {
    setStepError(null);
  }

  function handleNext(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

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
              aria-current={isActive ? "step" : undefined}
              className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold sm:text-sm ${
                isActive
                  ? "bg-[#e6dac7] text-stone-800"
                  : isDone
                    ? "bg-[#e6dac7]/40 text-stone-700"
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
        aria-busy={isPending}
        className="mt-6 space-y-4"
      >
        <HoneypotField id="register-website" />
        <div className={step === 1 ? "space-y-4" : "hidden"}>
          <p className="text-sm text-stone-600">
            Creá tu acceso al panel de DeBodas.
          </p>
          <input
            name="email"
            aria-label="Email"
            type="email"
            maxLength={254}
            className={inputClassName}
            placeholder="Email"
            autoComplete="email"
            onInput={clearStepError}
          />
          <PasswordField
            name="password"
            aria-label="Contraseña"
            maxLength={72}
            inputClassName={`${inputClassName} pr-12`}
            placeholder="Contraseña (mín. 8 caracteres)"
            autoComplete="new-password"
            onInput={clearStepError}
          />
          <PasswordField
            name="password_confirm"
            aria-label="Repetir contraseña"
            maxLength={72}
            inputClassName={`${inputClassName} pr-12`}
            placeholder="Repetir contraseña"
            autoComplete="new-password"
            onInput={clearStepError}
          />
          {step === 1 && stepError ? <StepError message={stepError} /> : null}
        </div>

        <div className={step === 2 ? "space-y-4" : "hidden"}>
          <p className="text-sm text-stone-600">
            Contanos sobre la pareja y la fecha del evento.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="bride_name"
              maxLength={100}
              aria-label="Nombre de la primera persona"
              className={inputClassName}
              placeholder="Nombre novia/o 1"
              autoComplete="given-name"
              onInput={clearStepError}
            />
            <input
              name="bride_lastname"
              maxLength={100}
              aria-label="Apellido de la primera persona"
              className={inputClassName}
              placeholder="Apellido novia/o 1"
              autoComplete="family-name"
              onInput={clearStepError}
            />
            <input
              name="groom_name"
              maxLength={100}
              aria-label="Nombre de la segunda persona"
              className={inputClassName}
              placeholder="Nombre novia/o 2"
              autoComplete="given-name"
              onInput={clearStepError}
            />
            <input
              name="groom_lastname"
              maxLength={100}
              aria-label="Apellido de la segunda persona"
              className={inputClassName}
              placeholder="Apellido novia/o 2"
              autoComplete="family-name"
              onInput={clearStepError}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="phone"
              maxLength={40}
              aria-label="Teléfono"
              className={inputClassName}
              placeholder="Teléfono"
              autoComplete="tel"
              onInput={clearStepError}
            />
            <input
              name="event_date"
              maxLength={20}
              aria-label="Fecha de la boda"
              className={inputClassName}
              placeholder="Fecha de la boda (dd/mm/aaaa)"
              onInput={clearStepError}
            />
          </div>

          <textarea
            name="our_story"
            aria-label="Historia de la pareja"
            rows={3}
            maxLength={3000}
            className={inputClassName}
            placeholder="¿Cómo se conocieron? (opcional)"
            onInput={clearStepError}
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
              defaultValue=""
              onChange={(event) => {
                setShowSiteSourceOther(event.target.value === "other");
                clearStepError();
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
            maxLength={200}
            aria-label="Cómo conociste DeBodas"
            className={showSiteSourceOther ? inputClassName : "hidden"}
            placeholder="Contanos cómo nos conociste"
            onInput={clearStepError}
          />

          <ImageFileInput
            name="banner_file"
            label="Foto del banner (opcional)"
            hint="JPG, PNG, WebP o GIF. Máximo 5 MB."
          />
          {step === 2 && stepError ? <StepError message={stepError} /> : null}
        </div>

        <div className={step === 3 ? "space-y-4" : "hidden"}>
          <p className="text-sm text-stone-600">
            Elegí con qué plan querés empezar. Los planes pagos se confirman
            luego desde el panel.
          </p>

          <div className="space-y-3">
            {REGISTER_PLANS.map((plan) => (
              <label
                key={plan.slug}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 p-4 transition hover:border-[#e6dac7]/40 has-checked:border-[#e6dac7] has-checked:bg-[#e6dac7]/5"
              >
                <input
                  type="radio"
                  name="selected_plan"
                  value={plan.slug}
                  defaultChecked={plan.slug === "gratuito"}
                  className="mt-1"
                  onChange={clearStepError}
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

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 p-4 text-sm text-stone-700">
            <input
              type="checkbox"
              name="accept_terms"
              value="1"
              required
              className="mt-1"
              onChange={clearStepError}
            />
            <span>
              Acepto los{" "}
              <a
                href="/terminos"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#6f5f47] underline"
              >
                términos y condiciones
              </a>{" "}
              y la{" "}
              <a
                href="/privacidad"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#6f5f47] underline"
              >
                política de privacidad
              </a>
              .
            </span>
          </label>
          {step === 3 && stepError ? <StepError message={stepError} /> : null}
        </div>

        <div ref={errorRef}>
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
              className="rounded-full bg-[#e6dac7] px-5 py-3 text-sm font-semibold text-stone-800"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[#e6dac7] px-5 py-3 text-sm font-semibold text-stone-800 disabled:opacity-60"
            >
              {isPending ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
