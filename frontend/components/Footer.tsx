import Link from "next/link";
import CardLogos from "@/components/CardLogos";
import { SITE_NAME } from "@/lib/api";

const LINKS = [
  { href: "/fleet", label: "The Residence" },
  { href: "/gallery", label: "Gallery" },
  { href: "/how-it-works", label: "Experience" },
  { href: "/destinations", label: "Places" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/book-now", label: "Reserve" },
];

/** Phones and tablets: everything centred and stacked. Computers (lg): one
 *  row (name and tagline, links, states and cards) over a thin copyright line. */
export default function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-5 pb-8 pt-12 text-center sm:px-8 sm:pb-10 sm:pt-14 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-10 lg:py-9 lg:text-left">
        <div>
          <p className="font-display text-2xl uppercase tracking-[0.3em] sm:text-3xl lg:text-2xl">{SITE_NAME}</p>
          <p className="mx-auto mt-3 max-w-md font-display text-lg italic leading-snug text-cream/70 sm:mt-5 sm:text-xl lg:mx-0 lg:mt-1.5 lg:max-w-xs lg:text-base">
            A luxury residence, delivered and prepared in the mountains and by the lakes of the Southeast.
          </p>
        </div>
        <nav
          className="mt-6 flex flex-wrap justify-center gap-x-5 sm:mt-8 sm:gap-x-6 lg:mt-0 lg:max-w-md lg:gap-x-6 lg:gap-y-0"
          aria-label="Footer"
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="lux-label inline-block py-3 text-cream/80 transition-colors hover:text-clay lg:py-2"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-5 h-px w-16 bg-clay sm:mt-8 lg:hidden" />
        <div className="flex flex-col items-center lg:items-end">
          <p className="lux-label mt-5 text-cream/50 sm:mt-8 lg:mt-0 lg:text-right">
            Georgia · The Carolinas · Tennessee · Alabama
          </p>
          <CardLogos className="mt-5 justify-center sm:mt-6 lg:mt-3" />
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 px-5 py-3 text-xs text-cream/45 sm:justify-between sm:px-8 sm:py-4 lg:py-1">
          <p>© {SITE_NAME}. All rights reserved.</p>
          <Link href="/admin" className="inline-block py-3 hover:text-cream">
            Owner sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
