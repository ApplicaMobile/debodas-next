"use client";

import Link from "next/link";
import { themeList } from "@/lib/themes/registry";
import { useMicrositeTheme } from "./ThemeProvider";

interface ThemeSwitcherProps {
  weddingSlug: string;
}

export function ThemeSwitcher({ weddingSlug }: ThemeSwitcherProps) {
  const { slug: activeSlug } = useMicrositeTheme();

  return (
    <div className="sticky top-0 z-[100] border-b border-stone-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            ← Inicio
          </Link>
          <span className="hidden text-stone-300 sm:inline">|</span>
          <p className="text-sm text-stone-600">
            Probá los temas del micrositio
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {themeList.map((theme) => {
            const isActive = theme.slug === activeSlug;
            return (
              <Link
                key={theme.slug}
                href={`/bodas/${weddingSlug}?theme=${theme.slug}`}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-[#556B2F] text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {theme.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
