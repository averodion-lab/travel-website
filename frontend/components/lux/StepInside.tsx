"use client";

import Image from "next/image";
import useScrollProgress from "./useScrollProgress";

/** A small framed photo that grows until it fills the screen as you scroll,
 *  then the title fades in. With reduced motion it simply shows full size. */
export default function StepInside({ src, alt, eyebrow, title, accent }: { src: string; alt: string; eyebrow: string; title: string; accent: string }) {
  const [ref, p] = useScrollProgress<HTMLElement>();
  // From 15% to 50% of the way through the section the photo grows to full bleed.
  const t = Math.min(1, Math.max(0, (p - 0.15) / 0.35));
  return (
    <section ref={ref} className="step-inside relative h-[220vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0" style={{ clipPath: `inset(${((1 - t) * 22).toFixed(2)}% ${((1 - t) * 30).toFixed(2)}%)` }}>
          <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" style={{ transform: `scale(${(1.15 - t * 0.15).toFixed(3)})` }} />
          <div className="absolute inset-0 bg-black/30" style={{ opacity: t }} />
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center text-cream"
          style={{ opacity: t > 0.85 ? (t - 0.85) / 0.15 : 0 }}
        >
          <p className="lux-label">{eyebrow}</p>
          <h2 className="mt-5 font-display text-5xl sm:text-7xl">
            {title} <em>{accent}</em>
          </h2>
        </div>
      </div>
    </section>
  );
}
