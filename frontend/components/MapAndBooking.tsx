"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import BookNowForm from "@/components/BookNowForm";
import ParksMap from "@/components/ParksMap";
import type { Camper, Park, TransportInfo } from "@/lib/api";

/** Home page: the parks map, and right under it the booking card (campground,
 *  dates, extras, live price). "Book the trailer here" in a pin's popup fills
 *  that park in below and scrolls there. */
export default function MapAndBooking({
  parks,
  addons,
  camper,
  transport,
  heading = true,
}: {
  parks: Park[];
  addons: Park["addons"];
  camper: Camper;
  transport: TransportInfo;
  /** Show the "Plan your trip" heading above the booking card (the Reserve
   *  page has its own heading, so it turns this off). */
  heading?: boolean;
}) {
  // Start from a campground in the link (?park=…), e.g. "Choose your own".
  const params = useSearchParams();
  const [park, setPark] = useState(() => params.get("park") ?? "");
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
      <ParksMap parks={parks} compact onPick={pick} />
      <div
        ref={form}
        id="book-now"
        className="mt-10 scroll-mt-24 sm:mt-12 sm:scroll-mt-28"
      >
        {heading && (
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8 sm:gap-4">
            <div>
              <p className="eyebrow text-clay">Book now</p>
              <h3 className="mt-3 font-display text-5xl leading-[0.95] sm:text-6xl">
                Plan your trip
              </h3>
              <p className="script -mt-1 text-4xl sm:text-5xl">
                park, dates and extras
              </p>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              Tap a pin above or choose a park here, pick your dates, choose how
              the trailer gets there, add a 4-wheeler, a jet ski or e-bikes, and
              see your exact total.
            </p>
          </div>
        )}
        <BookNowForm
          camper={camper}
          parks={parks}
          addons={addons}
          transport={transport}
          park={park}
          onParkChange={setPark}
        />
      </div>
    </>
  );
}
