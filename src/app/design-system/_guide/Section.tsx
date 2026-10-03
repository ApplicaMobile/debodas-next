import type { ReactNode } from "react";

export function Section({ id, overline, title, lead, children }: { id: string; overline: string; title: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-8 border-t border-border-subtle py-12 sm:py-16">
      <p className="type-overline text-text-accent">{overline}</p>
      <h2 id={`${id}-titulo`} className="mt-2 type-h2 text-text-primary">{title}</h2>
      {lead ? <p className="mt-3 max-w-3xl type-body-lg text-text-secondary">{lead}</p> : null}
      <div className="mt-8 sm:mt-10">{children}</div>
    </section>
  );
}

export function SubTitle({ children, id }: { children: ReactNode; id?: string }) {
  return <h3 id={id} className="mb-4 mt-10 type-h4 text-text-primary first:mt-0">{children}</h3>;
}

export function Spec({ children }: { children: ReactNode }) {
  return <code className="rounded-sm bg-surface-muted px-1 py-[2px] font-mono text-[0.9em] text-text-on-brand">{children}</code>;
}
