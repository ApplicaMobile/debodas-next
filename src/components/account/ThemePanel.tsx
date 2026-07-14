"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateThemeAction } from "@/lib/account/actions/theme";
import type { FormState } from "@/lib/account/form-state";
import { themeList } from "@/lib/themes/registry";
import { canUseTheme } from "@/lib/plans/features";
import { FormAlert } from "@/components/account/FormAlert";

interface ThemePanelProps {
  currentTheme: string;
  userPlan: string;
  slug: string;
}

const initialState: FormState = {};

export function ThemePanel({ currentTheme, userPlan, slug }: ThemePanelProps) {
  const [state, formAction, isPending] = useActionState(
    updateThemeAction,
    initialState,
  );

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <p className="text-sm text-stone-600">
        Elegí el tema visual de tu micrositio. Podés previsualizarlo antes de
        guardar.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {themeList.map((theme) => {
            const allowed = canUseTheme(userPlan, theme.plan);
            return (
              <label
                key={theme.slug}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  currentTheme === theme.slug
                    ? "border-[#556B2F] bg-[#556B2F]/5"
                    : "border-stone-200 hover:border-stone-300"
                } ${!allowed ? "opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="microsite_theme"
                  value={theme.slug}
                  defaultChecked={currentTheme === theme.slug}
                  disabled={!allowed}
                  className="mt-1"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-stone-800">
                    {theme.label}
                  </span>
                  <span className="block text-xs capitalize text-stone-500">
                    Plan {theme.plan}
                    {!allowed ? " · Requiere upgrade" : ""}
                  </span>
                  <Link
                    href={`/bodas/${slug}?theme=${theme.slug}`}
                    target="_blank"
                    className="mt-1 inline-block text-xs font-medium text-[#556B2F] hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Vista previa ↗
                  </Link>
                </span>
              </label>
            );
          })}
        </div>

        <FormAlert error={state.error} success={state.success} />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[#556B2F] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Aplicar tema"}
        </button>
      </form>
    </section>
  );
}
