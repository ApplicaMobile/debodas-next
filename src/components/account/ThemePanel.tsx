"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, startTransition } from "react";
import { updateThemeAction } from "@/lib/account/actions/theme";
import type { FormState } from "@/lib/account/form-state";
import { themeList } from "@/lib/themes/registry";
import {
  canUseFont,
  fontList,
  getThemePreviewAssets,
  type MicrositeFontSlug,
} from "@/lib/themes/fonts";
import { canUseTheme, planLabels } from "@/lib/plans/features";
import { FormAlert } from "@/components/account/FormAlert";

interface ThemePanelProps {
  currentTheme: string;
  currentFont: MicrositeFontSlug;
  userPlan: string;
  slug: string;
}

const initialState: FormState = {};

export function ThemePanel({
  currentTheme,
  currentFont,
  userPlan,
  slug,
}: ThemePanelProps) {
  const [state, formAction, isPending] = useActionState(
    updateThemeAction,
    initialState,
  );
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [selectedFont, setSelectedFont] =
    useState<MicrositeFontSlug>(currentFont);
  const [savedTheme, setSavedTheme] = useState(currentTheme);
  const [savedFont, setSavedFont] = useState(currentFont);

  useEffect(() => {
    if (state.success) {
      setSavedTheme(selectedTheme);
      setSavedFont(selectedFont);
    }
  }, [state.success, selectedTheme, selectedFont]);

  const previewHref = useMemo(
    () => `/bodas/${slug}?theme=${selectedTheme}&embedded=1`,
    [selectedTheme, slug],
  );

  function applySelection(themeSlug: string, fontSlug: MicrositeFontSlug) {
    const fd = new FormData();
    fd.set("microsite_theme", themeSlug);
    fd.set("microsite_font", fontSlug);
    startTransition(() => {
      formAction(fd);
    });
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <p className="text-sm text-stone-600">
          Tocá un diseño o tipografía para aplicarlo al momento. Abajo ves la
          vista previa en vivo.
        </p>

        <div className="mt-6 space-y-8">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Diseño
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {themeList.map((theme) => {
                const allowed = canUseTheme(userPlan, theme.plan);
                const selected = selectedTheme === theme.slug;
                const applied = savedTheme === theme.slug;
                const assets = getThemePreviewAssets(theme.slug);

                return (
                  <button
                    key={theme.slug}
                    type="button"
                    disabled={!allowed || isPending}
                    onClick={() => {
                      if (!allowed || isPending) return;
                      setSelectedTheme(theme.slug);
                      applySelection(theme.slug, selectedFont);
                    }}
                    className={`group overflow-hidden rounded-2xl border text-left transition ${
                      selected
                        ? "border-[#e6dac7] ring-2 ring-[#e6dac7]/60"
                        : "border-stone-200 hover:border-stone-300"
                    } ${!allowed || isPending ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                        style={{
                          backgroundImage: `url('${assets.bannerImage}')`,
                        }}
                      />
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="absolute inset-x-3 bottom-3 top-3 overflow-hidden rounded-xl border border-white/40 bg-white/90 shadow-md">
                        <Image
                          src={assets.previewImage}
                          alt={`Tema ${theme.label}`}
                          fill
                          className="object-cover object-top"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-stone-800">
                          {theme.label}
                        </p>
                        <p className="text-xs capitalize text-stone-500">
                          Plan {planLabels[theme.plan] ?? theme.plan}
                          {!allowed ? " · Requiere upgrade" : ""}
                        </p>
                      </div>
                      {applied ? (
                        <span className="shrink-0 rounded-full bg-[#e6dac7] px-2.5 py-1 text-[11px] font-semibold text-stone-800">
                          Aplicado
                        </span>
                      ) : selected && isPending ? (
                        <span className="shrink-0 rounded-full bg-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                          Guardando…
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Tipografía
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              También se guarda al tocar (según tu plan).
            </p>
            {fontList
              .filter((font) => font.googleFontsHref)
              .map((font) => (
                <link
                  key={font.slug}
                  rel="stylesheet"
                  href={font.googleFontsHref}
                />
              ))}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {fontList.map((font) => {
                const allowed = canUseFont(userPlan, font.plan);
                const selected = selectedFont === font.slug;
                const applied = savedFont === font.slug;
                const sampleStyle =
                  font.inherit || !font.family
                    ? undefined
                    : {
                        fontFamily: `'${font.family}', ${font.fallback ?? "serif"}`,
                      };

                return (
                  <button
                    key={font.slug}
                    type="button"
                    disabled={!allowed || isPending}
                    onClick={() => {
                      if (!allowed || isPending) return;
                      setSelectedFont(font.slug);
                      applySelection(selectedTheme, font.slug);
                    }}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-[#e6dac7] bg-[#e6dac7]/10"
                        : "border-stone-200 hover:border-stone-300"
                    } ${!allowed || isPending ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <p className="text-sm font-medium text-stone-800">
                      {font.label}
                      {applied ? (
                        <span className="ml-2 text-[11px] font-semibold text-[#6f5f47]">
                          · Aplicada
                        </span>
                      ) : null}
                    </p>
                    <p
                      className="mt-1 text-lg text-stone-700"
                      style={sampleStyle}
                    >
                      {font.previewText ?? font.label}
                    </p>
                    <p className="mt-1 text-xs capitalize text-stone-500">
                      Plan {planLabels[font.plan] ?? font.plan}
                      {!allowed ? " · Requiere upgrade" : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <FormAlert error={state.error} success={state.success} />
          <Link
            href={previewHref}
            target="_blank"
            className="inline-flex text-sm font-medium text-[#6f5f47] hover:underline"
          >
            Abrir vista previa en pestaña ↗
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm sm:rounded-3xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-4 py-3 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-stone-800">
              Vista previa en vivo
            </p>
            <p className="text-xs text-stone-500">
              Tema: {selectedTheme}
              {isPending ? " · Guardando…" : ""}
            </p>
          </div>
          <Link
            href={previewHref}
            target="_blank"
            className="text-xs font-medium text-[#6f5f47] hover:underline"
          >
            Pantalla completa ↗
          </Link>
        </div>
        <div className="bg-stone-100">
          <iframe
            key={selectedTheme}
            title={`Vista previa del tema ${selectedTheme}`}
            src={previewHref}
            className="h-[70vh] w-full border-0 bg-white"
          />
        </div>
      </div>
    </section>
  );
}
