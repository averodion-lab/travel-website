"use client";

import { useEffect, useRef, useState } from "react";

/** A number whose digits roll like an odometer when it scrolls into view
 *  (and again each time it comes back). Screen readers get the plain value;
 *  with reduced motion it simply shows the number. */
export default function RollingNumber({ value, suffix = "", delay = 0 }: { value: number; suffix?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  const [still, setStill] = useState(false); // reduced motion: no rolling

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Show the number at once (set from a callback, not during the effect).
      const id = requestAnimationFrame(() => {
        setStill(true);
        setOn(true);
      });
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(([entry]) => setOn(entry.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const digits = String(value).split("");
  return (
    <span ref={ref} className="inline-flex items-baseline">
      <span className="sr-only">
        {value}
        {suffix}
      </span>
      <span aria-hidden="true" className="inline-flex">
        {digits.map((d, i) => {
          const target = 10 + Number(d); // roll through one full turn, then land
          return (
            <span key={i} style={{ display: "inline-block", height: "1.4em", lineHeight: "1.4em", overflow: "hidden" }}>
              <span
                style={{
                  display: "flex",
                  flexDirection: "column",
                  transform: on ? `translateY(-${target * 1.4}em)` : "translateY(0)",
                  transitionProperty: "transform",
                  transitionTimingFunction: "cubic-bezier(0.16, 0.84, 0.24, 1)",
                  transitionDuration: on && !still ? `${1.6 + i * 0.35}s` : "0s",
                  transitionDelay: on && !still ? `${delay + i * 80}ms` : "0ms",
                }}
              >
                {Array.from({ length: 20 }, (_, n) => (
                  <span key={n} style={{ display: "block", height: "1.4em" }}>
                    {n % 10}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
        {suffix.trim() && (
          <span className="ml-[0.18em]" style={{ display: "inline-block", height: "1.4em", lineHeight: "1.4em" }}>
            {suffix.trim()}
          </span>
        )}
      </span>
    </span>
  );
}
