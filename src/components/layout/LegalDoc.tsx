import type { ReactNode } from "react";

interface LegalDocProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export function LegalDoc({ title, updatedAt, children }: LegalDocProps) {
  return (
    <article className="mx-auto max-w-3xl px-6">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
        DeBodas
      </p>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        Última actualización: {updatedAt}
      </p>
      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-stone-700 sm:text-base">
        {children}
      </div>
    </article>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-serif text-xl font-semibold text-stone-800">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
