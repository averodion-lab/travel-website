import Image from "next/image";
import Link from "next/link";
import CardLogos from "@/components/CardLogos";
import { SITE_NAME } from "@/lib/api";

const STRIP = [
  ["/images/smoky-stream.jpg", "A mountain stream in the Smokies"],
  ["/images/montana/living-1.jpg", "The trailer's living room"],
  ["/images/blueridge-road.jpg", "A road through the Blue Ridge"],
  ["/images/campfire-night.jpg", "A campfire at night"],
  ["/images/montana/bedroom-1.jpg", "The trailer's king bedroom"],
  ["/images/lake-tent.jpg", "Camping beside a lake"],
];

export default function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="grid grid-cols-3 sm:grid-cols-6">
        {STRIP.map(([src, alt]) => (
          <div key={src} className="relative aspect-square">
            <Image src={src} alt={alt} fill sizes="(min-width:640px) 17vw, 34vw" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl tracking-[0.12em] uppercase">{SITE_NAME}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/70">
            A luxury fifth-wheel rental for the mountains and lakes of the Southeast.
          </p>
          <Link href="/fleet#book" className="btn btn-light mt-7">Check availability</Link>
        </div>
        <div>
          <p className="eyebrow text-cream/50">Explore</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li><Link href="/fleet" className="hover:text-clay">The Trailer</Link></li>
            <li><Link href="/gallery" className="hover:text-clay">Gallery</Link></li>
            <li><Link href="/how-it-works" className="hover:text-clay">How It Works</Link></li>
            <li><Link href="/destinations" className="hover:text-clay">Destinations</Link></li>
            <li><Link href="/faq" className="hover:text-clay">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-cream/50">Serving</p>
          <p className="mt-5 text-sm leading-relaxed text-cream/80">
            Alabama, Georgia, Florida, North Carolina, South Carolina and Tennessee
          </p>
          <p className="eyebrow mt-8 text-cream/50">We accept</p>
          <CardLogos className="mt-4" />
        </div>
      </div>
      <div className="border-t border-cream/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {SITE_NAME}. All rights reserved.</p>
          <Link href="/admin" className="hover:text-cream">Owner sign in</Link>
        </div>
      </div>
    </footer>
  );
}
