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

export default function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-5 pb-8 pt-12 text-center sm:px-8 sm:pb-12 sm:pt-20">
        <p className="font-display text-2xl uppercase tracking-[0.3em] sm:text-3xl">{SITE_NAME}</p>
        <p className="mt-3 max-w-md font-display text-lg italic leading-snug text-cream/70 sm:mt-5 sm:text-xl sm:leading-relaxed">
          A luxury residence, delivered and prepared in the mountains and by the lakes of the Southeast.
        </p>
        <nav className="mt-6 flex flex-wrap justify-center gap-x-5 sm:mt-10 sm:gap-x-6" aria-label="Footer">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="lux-label inline-block py-3 text-cream/80 transition-colors hover:text-clay">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-5 h-px w-16 bg-clay sm:mt-12" />
        <p className="lux-label mt-5 text-cream/50 sm:mt-12">Georgia · The Carolinas · Tennessee · Alabama</p>
        <CardLogos className="mt-5 justify-center sm:mt-8" />
      </div>
      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 px-5 py-3 text-xs text-cream/45 sm:justify-between sm:px-8 sm:py-6">
          <p>© {SITE_NAME}. All rights reserved.</p>
          <Link href="/admin" className="inline-block py-3 hover:text-cream">
            Owner sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
