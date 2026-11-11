"use client";

import { useRef, useState } from "react";
import BookingBar from "@/components/BookingBar";
import ParksMap from "@/components/ParksMap";
import type { Park } from "@/lib/api";

/** Home page: the "Book now" bar above the parks map. Choosing a park in the
 *  map's list fills it into the bar. */
export default function MapAndBooking({
  parks,
  camperSlug,
  dailyRate,
  minNights,
}: {
  parks: Park[];
  camperSlug: string;
  dailyRate: string;
  minNights: number;
}) {
  const [park, setPark] = useState("");
  const bar = useRef<HTMLDivElement>(null);

  function pick(slug: string) {
    setPark(slug);
    const el = bar.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 80 || r.bottom > window.innerHeight) el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.querySelector<HTMLButtonElement>("button[aria-haspopup]")?.focus({ preventScroll: true });
  }

  return (
    <>
      <div ref={bar} className="scroll-mt-28">
        <BookingBar
          parks={parks}
          park={park}
          onParkChange={setPark}
          camperSlug={camperSlug}
          dailyRate={dailyRate}
          minNights={minNights}
        />
      </div>
      <div className="mt-10">
        <ParksMap parks={parks} compact picked={park} onPick={pick} />
      </div>
    </>
  );
}
