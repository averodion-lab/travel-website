"use client";

import { useEffect, useState } from "react";

/** Phones: keeps the price and a booking button within thumb reach, and gets
 *  out of the way while the calendar or the footer is on screen. */
export default function MobileBookBar({ price }: { price: string }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const targets = [document.getElementById("book"), document.querySelector("footer")].filter(
      (el): el is HTMLElement => !!el,
    );
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setHidden(visible.size > 0);
    });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={hidden}
      className={`fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-line bg-cream/95 px-5 py-3 backdrop-blur-md transition-transform duration-300 lg:hidden ${
        hidden ? "translate-y-full" : ""
      }`}
    >
      <p>
        <span className="font-display text-3xl">{price}</span>
        <span className="text-xs text-muted"> / night</span>
      </p>
      <a href="#book" tabIndex={hidden ? -1 : undefined} className="btn btn-primary !py-3">
        Check availability
      </a>
    </div>
  );
}
