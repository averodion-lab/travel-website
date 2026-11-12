"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import useScrollProgress from "./useScrollProgress";

/** A paragraph whose words light up one by one as it scrolls through the
 *  screen. The last `accentWords` words are set in brass italics. */
export function LitStatement({ text, accentWords = 4 }: { text: string; accentWords?: number }) {
  const [ref, p] = useScrollProgress<HTMLParagraphElement>();
  const words = text.split(" ");
  const lit = Math.round(Math.min(1, Math.max(0, (p - 0.2) / 0.4)) * words.length);
  return (
    <p ref={ref} className="font-display text-[2rem] leading-[1.3] sm:text-[3.2rem]">
      {words.map((w, i) => (
        <span key={i} className="transition-opacity duration-500 motion-reduce:!opacity-100" style={{ opacity: i < lit ? 1 : 0.16 }}>
          {i >= words.length - accentWords ? <em className="text-clay">{w}</em> : w}{" "}
        </span>
      ))}
    </p>
  );
}

/** A photo that moves a little slower than the page (parallax). */
export function ParallaxPhoto({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [ref, p] = useScrollProgress<HTMLDivElement>();
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-x-0 -inset-y-[12%]" style={{ transform: `translateY(${(0.5 - p) * 18}%)` }}>
        <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" />
      </div>
    </div>
  );
}

/** A full-width photo section; the photo slowly settles (zooms out) as the
 *  section scrolls into place. */
export function SettlingPhotoSection({
  src,
  className = "",
  overlay = "bg-black/40",
  children,
}: {
  src: string;
  className?: string;
  overlay?: string;
  children: ReactNode;
}) {
  const [ref, p] = useScrollProgress<HTMLElement>();
  return (
    <section ref={ref} className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0" style={{ transform: `scale(${1.18 - p * 0.18})` }}>
        <Image src={src} alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div className={`absolute inset-0 ${overlay}`} />
      {children}
    </section>
  );
}
