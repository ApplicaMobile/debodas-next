"use client";

import type { ReactNode } from "react";
import { useMicrositeTheme } from "./ThemeProvider";

interface ThemeSectionProps {
  id?: string;
  soft?: boolean;
  /** Decoración con *-informacion.svg (temas svg-hero como hojas/flores). */
  decor?: boolean;
  className?: string;
  children: ReactNode;
}

export function ThemeSection({
  id,
  soft,
  decor,
  className,
  children,
}: ThemeSectionProps) {
  const classNames = [
    "microsite-section",
    soft ? "microsite-section--soft" : "",
    decor ? "microsite-section--decor" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classNames} id={id}>
      {children}
    </section>
  );
}

interface MicrositeSectionTitleProps {
  className: string;
  children: ReactNode;
}

export function MicrositeSectionTitle({
  className,
  children,
}: MicrositeSectionTitleProps) {
  const { theme } = useMicrositeTheme();
  const separator = theme.assets.separatorSvg;

  return (
    <>
      <h2 className={className}>{children}</h2>
      {theme.showSeparator !== false && separator ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={separator} alt="" className="microsite-separator" />
      ) : null}
    </>
  );
}
