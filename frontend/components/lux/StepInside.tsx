"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type Room = { src: string; alt: string; eyebrow: string; title: string; accent: string };

/** "Step inside": a small framed photo grows until it fills the screen, then,
 *  as you keep scrolling, it changes room by room (crossfade, with a caption
 *  and a 01/04 counter). The section stays pinned while this happens.
 *  With reduced motion the photo is full size and rooms simply switch. */
export default function StepInside({ rooms }: { rooms: Room[] }) {
  const ref = useRef<HTMLElement>(null);
  // How far through the pinned section we are, 0 → 1.
  const [s, setS] = useState(0);
  // Starting frame, as % cut from top/bottom and from the sides. Portrait
  // screens (phones) start wider and shorter so it reads as a framed photo.
  const [frame, setFrame] = useState({ y: 12, x: 20 });
  const [still, setStill] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-aspect-ratio: 1/1)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId = 0;
    const update = () => {
      frameId = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      setS(Math.min(1, Math.max(0, -r.top / total)));
    };
    const onScroll = () => {
      if (!frameId) frameId = requestAnimationFrame(update);
    };
    const pick = () => {
      setFrame(mq.matches ? { y: 12, x: 6 } : { y: 12, x: 20 });
      setStill(reduce);
      onScroll();
    };
    const first = requestAnimationFrame(pick);
    mq.addEventListener("change", pick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(frameId);
      mq.removeEventListener("change", pick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const n = rooms.length;
  // The first ~22% of the scroll grows the photo; the rest walks the rooms.
  const GROW = 0.22;
  const t = still ? 1 : Math.min(1, s / GROW);
  const active = s <= GROW ? 0 : Math.min(n - 1, Math.floor(((s - GROW) / (1 - GROW)) * n));
  const captionOn = t >= 0.95;

  return (
    // Height: room to grow, then about one screen per room.
    <section ref={ref} className="step-inside relative" style={{ height: `${110 + n * 55}vh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(${((1 - t) * frame.y).toFixed(2)}% ${((1 - t) * frame.x).toFixed(2)}%)` }}
        >
          {rooms.map((room, i) => (
            <div
              key={room.src}
              className="absolute inset-0 transition-[opacity,transform] duration-[1100ms] ease-out"
              style={{
                opacity: i === active ? 1 : 0,
                transform: i === active ? `scale(${(1.15 - t * 0.15).toFixed(3)})` : "scale(1.08)",
              }}
            >
              <Image src={room.src} alt={room.alt} fill sizes="100vw" className="object-cover" />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/35" style={{ opacity: t }} />
        </div>

        {/* Caption for the room on screen */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-cream">
          {rooms.map((room, i) => (
            <div
              key={room.src}
              className="absolute px-6 transition-[opacity,transform] duration-700 ease-out"
              style={{
                opacity: captionOn && i === active ? 1 : 0,
                transform: captionOn && i === active ? "none" : "translateY(14px)",
              }}
              aria-hidden={!(captionOn && i === active)}
            >
              <p className="lux-label">{room.eyebrow}</p>
              <h2 className="mt-5 font-display text-5xl sm:text-7xl">
                {room.title} <em>{room.accent}</em>
              </h2>
            </div>
          ))}
        </div>

        {/* Counter and progress */}
        <div
          className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-4 text-cream transition-opacity duration-500"
          style={{ opacity: captionOn ? 1 : 0 }}
        >
          <span className="lux-label tabular-nums">
            {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
          <span className="flex gap-1.5" aria-hidden="true">
            {rooms.map((room, i) => (
              <span
                key={room.src}
                className={`h-px transition-all duration-500 ${i === active ? "w-8 bg-cream" : "w-4 bg-cream/40"}`}
              />
            ))}
          </span>
        </div>
      </div>
    </section>
  );
}
