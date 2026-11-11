"use client";

import { useRef, useState } from "react";
import BookNowForm from "@/components/BookNowForm";
import ParksMap from "@/components/ParksMap";
import type { Camper, Park } from "@/lib/api";

/** Home page: the parks map, and right under it the booking card (campground,
 *  dates, extras, live price). Choosing a park in the map's list fills it in
 *  below and scrolls there. */
export default function MapAndBooking({
  parks,
  addons,
  camper,
}: {
  parks: Park[];
  addons: Park["addons"];
  camper: Camper;
}) {
  const [park, setPark] = useState("");
  const form = useRef<HTMLDivElement>(null);

  function pick(slug: string) {
    setPark(slug);
    const el = form.current;
    if (!el) return;
    el.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }

  return (
    <>
      <ParksMap parks={parks} compact picked={park} onPick={pick} />
      <div ref={form} id="book-now" className="mt-16 scroll-mt-28">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-clay">Book now</p>
            <h3 className="mt-3 font-display text-5xl uppercase leading-[0.95] tracking-tight sm:text-6xl">
              Plan your trip
            </h3>
            <p className="script -mt-1 text-4xl sm:text-5xl">
              park, dates and extras
            </p>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Pick a park above or from the list, choose your dates, add a
            4-wheeler or jet ski, and see your exact total.
          </p>
        </div>
        <BookNowForm
          camper={camper}
          parks={parks}
          addons={addons}
          park={park}
          onParkChange={setPark}
        />
      </div>
    </>
  );
}
