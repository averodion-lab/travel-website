"use client";

import { useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, parseISO, startOfMonth } from "date-fns";
import { toISO } from "@/lib/format";
import { STATUS_LABEL, type Brief, type Overview } from "../types";

const DAY_STYLE: Record<string, string> = {
  confirmed: "bg-pine text-cream hover:bg-pine-dark",
  pending: "bg-[#e9c46a] text-ink hover:bg-[#ddb450]",
  completed: "bg-bark/15 text-bark hover:bg-bark/25",
};

/** A year at a glance: every night coloured by the booking that holds it. */
export default function CalendarView({ data, onOpen }: { data: Overview; onOpen: (id: number) => void }) {
  const [offset, setOffset] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  // Night -> booking. A booking holds its pickup day up to the day before its return.
  const byNight = useMemo(() => {
    const map = new Map<string, Brief>();
    for (const b of data.calendar) {
      const nights = eachDayOfInterval({ start: parseISO(b.start_date), end: parseISO(b.end_date) }).slice(0, -1);
      for (const night of nights) map.set(toISO(night), b);
    }
    return map;
  }, [data.calendar]);

  const first = addMonths(startOfMonth(parseISO(data.today)), offset);
  const months = Array.from({ length: 12 }, (_, i) => addMonths(first, i));

  return (
    <div className="rounded-2xl bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">
            {format(months[0], "MMM yyyy")} to {format(months[11], "MMM yyyy")}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
            {(["confirmed", "pending", "completed"] as const).map((s) => (
              <li key={s} className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-[3px] ${DAY_STYLE[s].split(" ")[0]}`} /> {STATUS_LABEL[s]}
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-[3px] border border-line" /> Available
            </li>
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setOffset((o) => o - 6)} className="rounded-full border border-line px-4 py-2 text-sm hover:bg-sand/60">← Earlier</button>
          <button type="button" onClick={() => setOffset(0)} className="rounded-full border border-line px-4 py-2 text-sm hover:bg-sand/60">Today</button>
          <button type="button" onClick={() => setOffset((o) => o + 6)} className="rounded-full border border-line px-4 py-2 text-sm hover:bg-sand/60">Later →</button>
        </div>
      </div>

      <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {months.map((month) => {
          const days = eachDayOfInterval({ start: month, end: endOfMonth(month) });
          const booked = days.filter((d) => byNight.has(toISO(d))).length;
          return (
            <div key={month.toISOString()}>
              <div className="flex items-baseline justify-between">
                <p className="font-display text-xl">{format(month, "MMMM yyyy")}</p>
                <p className="text-[0.6875rem] tabular-nums text-muted">{booked}/{days.length} nights</p>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-[3px] text-center text-[0.6875rem]">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span key={i} className="pb-1 text-muted">{d}</span>
                ))}
                {Array.from({ length: getDay(month) }, (_, i) => <span key={`pad${i}`} />)}
                {days.map((day) => {
                  const iso = toISO(day);
                  const booking = byNight.get(iso);
                  const isToday = iso === data.today;
                  const ring = isToday ? "ring-2 ring-clay ring-offset-1" : "";
                  if (!booking) {
                    return (
                      <span key={iso} className={`flex aspect-square items-center justify-center rounded-[5px] border border-line/70 tabular-nums ${iso < data.today ? "text-muted/50" : "text-bark"} ${ring}`}>
                        {day.getDate()}
                      </span>
                    );
                  }
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => onOpen(booking.id)}
                      onMouseEnter={() => setHover(booking.id)}
                      onMouseLeave={() => setHover(null)}
                      title={`${booking.customer_name} · ${format(parseISO(booking.start_date), "MMM d")} to ${format(parseISO(booking.end_date), "MMM d")} · ${STATUS_LABEL[booking.status]}`}
                      className={`flex aspect-square items-center justify-center rounded-[5px] font-medium tabular-nums transition-colors ${DAY_STYLE[booking.status] ?? ""} ${hover === booking.id ? "brightness-90" : ""} ${ring}`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
