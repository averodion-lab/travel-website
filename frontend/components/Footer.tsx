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
      <div className="mx-auto flex max-w-7xl flex-col items-center px-5 pb-12 pt-20 text-center sm:px-8">
        <p className="font-display text-3xl uppercase tracking-[0.3em]">{SITE_NAME}</p>
        <p className="mt-5 max-w-md font-display text-xl italic leading-relaxed text-cream/70">
          A luxury residence, delivered and prepared in the mountains and by the lakes of the Southeast.
        </p>
        <nav className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-1" aria-label="Footer">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="lux-label inline-block py-3 text-cream/80 transition-colors hover:text-clay">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-12 h-px w-16 bg-clay" />
        <p className="lux-label mt-12 text-cream/50">Georgia · The Carolinas · Tennessee · Alabama</p>
        <CardLogos className="mt-8 justify-center" />
      </div>
      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 py-6 text-xs text-cream/45 sm:flex-row sm:justify-between sm:px-8">
          <p>© {SITE_NAME}. All rights reserved.</p>
          <Link href="/admin" className="inline-block py-3 hover:text-cream">
            Owner sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
