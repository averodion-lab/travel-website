import type { ReactNode } from "react";

/** Layout for the privacy, terms and accessibility pages: a quiet heading
 *  (no photo banner) and readable prose. */
export default function LegalPage({
  eyebrow,
  title,
  accent,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-10 sm:px-8 sm:pb-24 sm:pt-14">
      <p className="lux-label text-clay">{eyebrow}</p>
      <h1 className="mt-3 font-display text-5xl leading-[1] sm:text-6xl">
        {title} <em>{accent}</em>
      </h1>
      <p className="mt-4 text-xs text-muted">Last updated {updated}</p>
      <div className="legal mt-8 space-y-6 leading-relaxed text-bark">{children}</div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-3xl text-ink">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
