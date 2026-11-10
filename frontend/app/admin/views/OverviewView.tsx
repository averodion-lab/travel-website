"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { money, shortDate } from "@/lib/format";
import type { Brief, Month, Overview } from "../types";

const whole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compact = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`);

function Tile({ label, value, note, children }: { label: string; value: string; note: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-white p-6 shadow-[0_1px_0_rgba(33,29,26,0.06)]">
      <div>
        <p className="eyebrow text-muted">{label}</p>
        <p className="mt-3 font-display text-5xl leading-none">{value}</p>
        <p className="mt-3 text-xs text-muted">{note}</p>
      </div>
      {children}
    </div>
  );
}

function Ring({ percent }: { percent: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-sand)" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-pine)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(c * Math.min(percent, 100)) / 100} ${c}`} />
    </svg>
  );
}

/** Revenue by pickup month. One series, so one color; the current month is labelled. */
function RevenueChart({ months, today }: { months: Month[]; today: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const values = months.map((m) => Number(m.revenue));
  const top = Math.max(...values, 1);
  const step = [500, 1000, 2000, 2500, 5000, 10000, 20000, 50000].find((s) => top / s <= 4) ?? 100000;
  const max = Math.ceil(top / step) * step;
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
  const thisMonth = today.slice(0, 7);
  const best = values.indexOf(Math.max(...values));

  return (
    <div>
      <div className="relative ml-12 h-64">
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-line/60" style={{ bottom: `${(t / max) * 100}%` }}>
            <span className="absolute -left-12 -top-2 w-10 text-right text-[0.6875rem] tabular-nums text-muted">{compact(t)}</span>
          </div>
        ))}
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {months.map((m, i) => {
            const value = values[i];
            const active = hover === i;
            return (
              <div
                key={m.month}
                className="group relative flex h-full flex-1 items-end justify-center"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${format(parseISO(`${m.month}-01`), "MMMM yyyy")}: ${money(m.revenue)}, ${m.nights} nights`}
              >
                {(i === best && value > 0 && hover === null) && (
                  <span className="absolute text-[0.6875rem] font-semibold tabular-nums text-ink" style={{ bottom: `calc(${(value / max) * 100}% + 6px)` }}>
                    {whole.format(value)}
                  </span>
                )}
                <div
                  className={`w-full max-w-10 rounded-t-[4px] transition-colors ${active ? "bg-pine-dark" : "bg-pine"}`}
                  style={{ height: value > 0 ? `max(${(value / max) * 100}%, 3px)` : "0" }}
                />
                {active && (
                  <div className="pointer-events-none absolute bottom-full z-10 mb-2 w-max rounded-lg bg-ink px-3 py-2 text-left text-xs text-cream shadow-lg">
                    <p className="font-semibold">{format(parseISO(`${m.month}-01`), "MMMM yyyy")}</p>
                    <p className="mt-1 tabular-nums">{money(m.revenue)}</p>
                    <p className="text-cream/70">{m.bookings} {m.bookings === 1 ? "booking" : "bookings"}, {m.nights} nights</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="ml-12 mt-2 flex gap-[2px]">
        {months.map((m) => (
          <div key={m.month} className={`flex-1 text-center text-[0.6875rem] ${m.month === thisMonth ? "font-semibold text-ink" : "text-muted"}`}>
            {format(parseISO(`${m.month}-01`), "MMM")}
            {m.month === thisMonth && <span className="mx-auto mt-1 block h-1 w-1 rounded-full bg-clay" />}
          </div>
        ))}
      </div>
      <details className="mt-5 text-sm">
        <summary className="eyebrow cursor-pointer text-muted hover:text-ink">View as table</summary>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 font-medium">Month</th>
              <th className="py-2 text-right font-medium">Revenue</th>
              <th className="py-2 text-right font-medium">Bookings</th>
              <th className="py-2 text-right font-medium">Nights</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {months.map((m) => (
              <tr key={m.month}>
                <td className="py-2">{format(parseISO(`${m.month}-01`), "MMMM yyyy")}</td>
                <td className="py-2 text-right tabular-nums">{money(m.revenue)}</td>
                <td className="py-2 text-right tabular-nums">{m.bookings}</td>
                <td className="py-2 text-right tabular-nums">{m.nights}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function Event({ label, booking, date, onOpen }: { label: string; booking: Brief; date: string; onOpen: (id: number) => void }) {
  return (
    <button type="button" onClick={() => onOpen(booking.id)} className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-sand/50">
      <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-cream">
        <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-clay">{format(parseISO(date), "MMM")}</span>
        <span className="font-display text-2xl leading-none">{format(parseISO(date), "d")}</span>
      </span>
      <span className="min-w-0">
        <span className="eyebrow block text-muted">{label}</span>
        <span className="mt-1 block truncate font-medium">{booking.customer_name}</span>
        <span className="block text-xs text-muted">{booking.days} nights · {money(booking.total_price)}</span>
      </span>
    </button>
  );
}

export default function OverviewView({ data, onOpen }: { data: Overview; onOpen: (id: number) => void }) {
  const { revenue, counts, occupancy, current } = data;
  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-5 ${current ? "bg-pine text-cream" : "bg-white"}`}>
        <div className="flex items-center gap-4">
          <span className={`h-3 w-3 rounded-full ${current ? "animate-pulse bg-[#e9c46a]" : "bg-pine"}`} />
          <p className="font-display text-3xl">
            {current ? `Out with ${current.customer_name}` : "The trailer is home"}
          </p>
        </div>
        <p className={`text-sm ${current ? "text-cream/80" : "text-muted"}`}>
          {current
            ? `Returns ${format(parseISO(current.end_date), "EEEE, MMM d")}`
            : data.next_pickup
              ? `Next pickup ${format(parseISO(data.next_pickup.start_date), "EEEE, MMM d")}`
              : "No upcoming bookings"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Booked revenue" value={whole.format(Number(revenue.booked))} note={`${counts.total} paid bookings · ${whole.format(Number(revenue.average_booking))} average`} />
        <Tile label="Collected" value={whole.format(Number(revenue.collected))} note="Deposits, plus completed trips in full" />
        <Tile label="Due at pickup" value={whole.format(Number(revenue.outstanding))} note={`${counts.upcoming} upcoming ${counts.upcoming === 1 ? "trip" : "trips"}${counts.pending ? ` · ${counts.pending} awaiting payment` : ""}`} />
        <Tile label="Occupancy" value={`${occupancy.percent}%`} note={`${occupancy.nights_booked} of the next ${occupancy.days} nights booked`}>
          <Ring percent={occupancy.percent} />
        </Tile>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-2xl bg-white p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-3xl">Revenue by month</h2>
            <p className="text-xs text-muted">By pickup date · confirmed and completed bookings</p>
          </div>
          <div className="mt-8">
            <RevenueChart months={data.months} today={data.today} />
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-4">
            <h2 className="px-3 pt-2 font-display text-3xl">Next up</h2>
            <div className="mt-3">
              {current && <Event label="Returning" booking={current} date={current.end_date} onOpen={onOpen} />}
              {data.next_pickup && <Event label="Next pickup" booking={data.next_pickup} date={data.next_pickup.start_date} onOpen={onOpen} />}
              {!current && data.next_return && <Event label="Next return" booking={data.next_return} date={data.next_return.end_date} onOpen={onOpen} />}
              {!current && !data.next_pickup && <p className="px-3 py-6 text-sm text-muted">Nothing on the calendar yet.</p>}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6">
            <h2 className="font-display text-3xl">Open dates</h2>
            <p className="mt-1 text-xs text-muted">Bookable gaps through {shortDate(data.open_until)}</p>
            <ul className="mt-4 divide-y divide-line/60">
              {data.open_windows.map((w, i) => {
                const last = i === data.open_windows.length - 1 && w.end === data.open_until;
                return (
                  <li key={w.start} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span>
                      {format(parseISO(w.start), "MMM d")} <span className="text-muted">to</span>{" "}
                      {last ? "onward" : format(parseISO(w.end), "MMM d")}
                    </span>
                    <span className="rounded-full bg-cream px-2.5 py-1 text-xs tabular-nums text-bark">
                      {last ? "open" : `${w.nights} nights`}
                    </span>
                  </li>
                );
              })}
              {data.open_windows.length === 0 && <li className="py-3 text-sm text-muted">Fully booked for the next six months.</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
