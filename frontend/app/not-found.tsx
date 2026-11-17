import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

const PLACES = [
  ["/fleet/montana", "The trailer"],
  ["/destinations", "Where we deliver"],
  ["/how-it-works", "How it works"],
  ["/faq", "Questions answered"],
  ["/book-now", "Book your dates"],
  ["/contact", "Contact us"],
];

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-5 py-24 text-center sm:py-32">
        <p className="eyebrow text-clay">Page not found</p>
        <h1 className="mt-4 font-display text-6xl">This trail ends here.</h1>
        <p className="mt-5 leading-relaxed text-bark">
          The page may have moved, or the link had a typo. These will get you back on the road:
        </p>
        <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3">
          {PLACES.map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="tap lux-label border-b border-ink pb-1 hover:text-clay">
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/" className="btn btn-primary mt-10">
          Back to home
        </Link>
      </main>
    </>
  );
}
