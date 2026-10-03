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
import { canUseTheme, normalizePlan } from "@/lib/plans/features";
import { AccountSection } from "@/components/account/AccountPage";
import { ChoiceTile } from "@/components/account/ChoiceTile";
import { FormAlert } from "@/components/account/FormAlert";
import { Badge, Button, IconExternalLink, PlanBadge } from "@/components/ui";

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

  const micrositeHref = useMemo(
    () => `/bodas/${slug}?theme=${selectedTheme}`,
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

  const someThemeLocked = themeList.some(
    (theme) => !canUseTheme(userPlan, theme.plan),
  );
  const someFontLocked = fontList.some((font) => !canUseFont(userPlan, font.plan));

  function statusBadge(applied: boolean, savingThis: boolean, appliedLabel: string) {
    if (applied) {
      return <Badge tone="aprobado">{appliedLabel}</Badge>;
    }
    if (savingThis) {
      return (
        <Badge tone="pendiente" icon={false}>
          Guardando…
        </Badge>
      );
    }
    return null;
  }

  return (
    <>
      <AccountSection
        id="tema-diseno"
        title="Diseño"
        description="Tocá un diseño para aplicarlo al momento. Después podés verlo en tu micrositio público."
        actions={
          <Button
            href={micrositeHref}
            target="_blank"
            variant="secundario"
            icon={<IconExternalLink />}
            iconPosition="end"
          >
            Ver en el micrositio
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </Button>
        }
      >
        <ul role="list" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
          {themeList.map((theme) => {
            const allowed = canUseTheme(userPlan, theme.plan);
            const selected = selectedTheme === theme.slug;
            const applied = savedTheme === theme.slug;
            const assets = getThemePreviewAssets(theme.slug);

            return (
              <li key={theme.slug}>
                <ChoiceTile
                  selected={selected}
                  disabled={!allowed || isPending}
                  onSelect={() => {
                    if (!allowed || isPending) return;
                    setSelectedTheme(theme.slug);
                    applySelection(theme.slug, selectedFont);
                  }}
                  media={
                    <span className="relative block aspect-[4/3] w-full overflow-hidden bg-surface-muted">
                      <span
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                        style={{
                          backgroundImage: `url('${assets.bannerImage}')`,
                        }}
                      />
                      <span className="absolute inset-0 bg-surface-inverse/10" />
                      <span className="absolute inset-3 overflow-hidden rounded-sm border border-surface-default/40 bg-surface-default/90 shadow-elevation-2">
                        <Image
                          src={assets.previewImage}
                          alt={`Tema ${theme.label}`}
                          fill
                          className="object-cover object-top"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      </span>
                    </span>
                  }
                  title={theme.label}
                  status={statusBadge(applied, selected && isPending, "Aplicado")}
                  subtitle={
                    <span className="flex flex-wrap items-center gap-2">
                      <PlanBadge plan={normalizePlan(theme.plan)} />
                      {!allowed ? (
                        <span className="font-semibold text-status-warning-fg">
                          Requiere upgrade
                        </span>
                      ) : null}
                    </span>
                  }
                />
              </li>
            );
          })}
        </ul>
        {someThemeLocked ? (
          <p className="mt-4 type-body-sm text-text-secondary">
            Algunos diseños son de otros planes.{" "}
            <Link
              href="/mi-cuenta/plan"
              className="focus-ring rounded-sm font-semibold text-text-link underline underline-offset-2"
            >
              Ver planes
            </Link>
          </p>
        ) : null}
      </AccountSection>

      <AccountSection
        id="tema-tipografia"
        title="Tipografía"
        description="La letra de los títulos del micrositio. También se guarda al tocar (según tu plan)."
      >
        {fontList
          .filter((font) => font.googleFontsHref)
          .map((font) => (
            <link key={font.slug} rel="stylesheet" href={font.googleFontsHref} />
          ))}
        <ul role="list" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
              <li key={font.slug}>
                <ChoiceTile
                  selected={selected}
                  disabled={!allowed || isPending}
                  onSelect={() => {
                    if (!allowed || isPending) return;
                    setSelectedFont(font.slug);
                    applySelection(selectedTheme, font.slug);
                  }}
                  title={font.label}
                  status={statusBadge(applied, selected && isPending, "Aplicada")}
                  subtitle={
                    <span className="flex flex-wrap items-center gap-2">
                      <PlanBadge plan={normalizePlan(font.plan)} />
                      {!allowed ? (
                        <span className="font-semibold text-status-warning-fg">
                          Requiere upgrade
                        </span>
                      ) : null}
                    </span>
                  }
                >
                  <span
                    className="my-1 block text-2xl leading-snug text-text-primary"
                    style={sampleStyle}
                  >
                    {font.previewText ?? font.label}
                  </span>
                </ChoiceTile>
              </li>
            );
          })}
        </ul>
        {someFontLocked && !someThemeLocked ? (
          <p className="mt-4 type-body-sm text-text-secondary">
            Algunas tipografías son de otros planes.{" "}
            <Link
              href="/mi-cuenta/plan"
              className="focus-ring rounded-sm font-semibold text-text-link underline underline-offset-2"
            >
              Ver planes
            </Link>
          </p>
        ) : null}
        <div className="mt-6 empty:hidden">
          <FormAlert error={state.error} success={state.success} />
        </div>
      </AccountSection>
    </>
  );
}
