"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import DateRangeField from "@/components/DateRangeField";
import type { Park } from "@/lib/api";
import { fromISO, money, rate } from "@/lib/format";
import { STATE_ORDER } from "@/lib/parks";

/** Home page "Book now" bar: campground and dates (pop-up calendar). Opens the
 *  Book Now page with both filled in, where extras are added and the exact
 *  price is shown. */
export default function BookingBar({
  parks,
  park,
  onParkChange,
  camperSlug,
  dailyRate,
  minNights,
}: {
  parks: Park[];
  park: string;
  onParkChange: (slug: string) => void;
  camperSlug: string;
  dailyRate: string;
  minNights: number;
}) {
  const router = useRouter();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const nights =
    start && end ? differenceInCalendarDays(fromISO(end), fromISO(start)) : 0;

  function go() {
    const q = new URLSearchParams();
    if (park) q.set("park", park);
    if (start && end) {
      q.set("start", start);
      q.set("end", end);
    }
    const qs = q.toString();
    router.push(`/book-now${qs ? `?${qs}` : ""}`);
  }

  const groups = STATE_ORDER.map((state) => ({
    state,
    parks: parks.filter((p) => p.state === state),
  })).filter((g) => g.parks.length);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
      className="rounded-[1.75rem] border border-line bg-white shadow-[0_24px_60px_-30px_rgba(33,29,26,0.45)]"
    >
      <div className="grid gap-px overflow-hidden rounded-t-[1.75rem] bg-line md:grid-cols-[1.2fr_1.4fr_auto]">
        <label className="bg-white px-5 py-4">
          <span className="label">Campground</span>
          <select
            value={park}
            onChange={(e) => onParkChange(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          >
            <option value="">Any campground</option>
            {groups.map((g) => (
              <optgroup key={g.state} label={g.state}>
                {g.parks.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="bg-white px-5 py-4">
          <span className="label">Dates</span>
          <DateRangeField
            camperSlug={camperSlug}
            minNights={minNights}
            start={start}
            end={end}
            onChange={(s, e) => {
              setStart(s);
              setEnd(e);
            }}
          />
        </div>
        <div className="flex items-center bg-white p-3">
          <button
            type="submit"
            className="btn btn-primary w-full !py-4 md:w-auto md:!px-8"
          >
            Book now
          </button>
        </div>
      </div>
      <p
        className="rounded-b-[1.75rem] border-t border-line bg-cream/60 px-5 py-3 text-xs text-muted"
        aria-live="polite"
      >
        {nights > 0
          ? `${nights} nights · from ${money(Number(dailyRate) * nights)} before cleaning and extras. Add a 4-wheeler or jet ski on the next step.`
          : `${rate(dailyRate)} a night · ${minNights}-night minimum · 4-wheelers and jet skis available as extras.`}
      </p>
    </form>
  );
}
