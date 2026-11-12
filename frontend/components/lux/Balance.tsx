"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/api";
import InView from "./InView";

const POINTS = [
  { name: "Comfort", text: "A king suite, a fireplace and a full kitchen, ready when you walk in.", angle: -60 },
  { name: "Adventure", text: "A jet ski on the lake or a 4-wheeler in the mountains.", angle: 30 },
  { name: "Rest", text: "Chairs by the fire and nothing on the schedule.", angle: 140 },
  { name: "Nature", text: "Trails from the door, bikes waiting, the lake a short walk away.", angle: 220 },
];
const R = 110; // circle radius in drawing units (the drawing is 320 wide)

/** "Everything, in balance": a thin circle that draws itself over a dusk
 *  photo, with four parts of a stay around the name. It cycles through them;
 *  hovering or focusing a label picks one (after the calmco reference). */
export default function Balance() {
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const current = picked ?? active;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((a) => (a + 1) % POINTS.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative flex items-center justify-center overflow-hidden px-5 py-16 text-center text-cream sm:min-h-[100svh] sm:py-24">
      <Image src="/images/lake-campsite.jpg" alt="" fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/65" />
      <InView className="balance relative w-full max-w-3xl">
        <p className="lux-label lux-rise text-[#d8bd86]">A stay in balance</p>
        <h2 className="lux-rise mt-5 font-display text-5xl leading-tight sm:text-7xl">
          Everything, <em>in balance.</em>
        </h2>
        <p className="lux-rise mt-4 text-cream/80">Comfort, adventure, nature and rest, prepared to work together.</p>

        <div className="relative mx-auto mt-8 aspect-square w-[80%] max-w-[26rem] sm:mt-12 sm:w-full">
          <svg viewBox="-160 -160 320 320" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <circle r={R} fill="none" stroke="rgba(247,243,236,0.55)" strokeWidth="1" className="balance-ring" pathLength={1} />
            {POINTS.map((pt, i) => {
              const a = (pt.angle * Math.PI) / 180;
              const on = i === current;
              return (
                <g key={pt.name} transform={`translate(${(R * Math.cos(a)).toFixed(2)} ${(R * Math.sin(a)).toFixed(2)})`}>
                  {on && <circle r="11" fill="none" stroke="#f7f3ec" strokeOpacity="0.5" className="balance-pulse" />}
                  <circle r={on ? 5 : 3.5} fill={on ? "#d8bd86" : "#f7f3ec"} className="transition-all duration-500" />
                </g>
              );
            })}
          </svg>
          {POINTS.map((pt, i) => {
            const a = (pt.angle * Math.PI) / 180;
            const x = 50 + ((R + 46) / 320) * 100 * Math.cos(a);
            const y = 50 + ((R + 30) / 320) * 100 * Math.sin(a);
            return (
              <button
                key={pt.name}
                type="button"
                aria-pressed={i === current}
                onMouseEnter={() => setPicked(i)}
                onMouseLeave={() => setPicked(null)}
                onFocus={() => setPicked(i)}
                onBlur={() => setPicked(null)}
                onClick={() => setPicked(i)}
                className={`lux-label absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-3 font-semibold transition-[opacity,color] duration-500 [text-shadow:0_1px_10px_rgba(0,0,0,0.75)] ${
                  i === current ? "text-[#e7cf9b] opacity-100" : "text-cream opacity-90"
                }`}
                style={{ left: `${x.toFixed(2)}%`, top: `${y.toFixed(2)}%` }}
              >
                {pt.name}
              </button>
            );
          })}
          <div className="absolute left-1/2 top-1/2 w-40 -translate-x-1/2 -translate-y-1/2 sm:w-48">
            <p className="font-display text-xl uppercase tracking-[0.2em] sm:text-2xl">{SITE_NAME}</p>
            <p key={current} className="balance-text mt-2 text-xs leading-relaxed text-cream/80" aria-live="polite">
              {POINTS[current].text}
            </p>
          </div>
        </div>

        <p className="lux-rise mt-8 font-display text-xl italic text-cream/85">Nothing to set up. Nothing to carry.</p>
      </InView>
    </section>
  );
}
