"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addDays, addMonths, differenceInCalendarDays, isSameDay, startOfDay } from "date-fns";
import { DayPicker, type DateRange, type Matcher } from "react-day-picker";
import CardLogos from "@/components/CardLogos";
import { api, type Camper, type QuoteResponse } from "@/lib/api";
import { fromISO, isISODate, money, rate, toISO } from "@/lib/format";

type Booked = { start: string; end: string };

const dateLabel = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

/** Availability calendar + live price for one camper.
 *  The visitor clicks a pickup day, then a return day. */
export default function BookingWidget({ camper }: { camper: Camper }) {
  const router = useRouter();
  const params = useSearchParams();

  const [range, setRange] = useState<DateRange | undefined>(() => {
    const s = params.get("start");
    const e = params.get("end");
    return isISODate(s) && isISODate(e) && e > s ? { from: fromISO(s), to: fromISO(e) } : undefined;
  });
  const [booked, setBooked] = useState<Booked[]>([]);
  const [calendarError, setCalendarError] = useState("");
  // The latest quote (or error), tagged with the dates it belongs to.
  const [result, setResult] = useState<{ key: string; quote?: QuoteResponse; error?: string } | null>(null);

  // Two months side by side when there is room for them.
  const calendarBox = useRef<HTMLDivElement>(null);
  const [months, setMonths] = useState(1);
  useEffect(() => {
    const box = calendarBox.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => setMonths(entry.contentRect.width >= 640 ? 2 : 1));
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    api<{ booked: Booked[] }>(`/api/campers/${camper.slug}/availability`)
      .then((r) => setBooked(r.booked))
      .catch(() => setCalendarError("We couldn't load the calendar. Please refresh the page."));
  }, [camper.slug]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const pickup = range?.from;
  const choosingReturn = !!pickup && !range?.to;

  // A booking occupies its pickup day up to (not including) its return day,
  // so someone else's return day is open for pickup.
  const bookedNights = useMemo<Matcher[]>(
    () => booked.map((b) => ({ from: fromISO(b.start), to: addDays(fromISO(b.end), -1) })),
    [booked],
  );

  // While the visitor is choosing a return day, the trip can run up to the
  // next booking's pickup day (returning that morning is fine) but not past it,
  // and must be at least the minimum stay.
  const disabled = useMemo<Matcher[]>(() => {
    if (!choosingReturn || !pickup) return [{ before: today }, ...bookedNights];
    const next = booked.map((b) => fromISO(b.start)).find((start) => start > pickup);
    const rules: Matcher[] = [
      { before: today },
      ...booked
        .filter((b) => fromISO(b.start) < pickup)
        .map((b) => ({ from: fromISO(b.start), to: addDays(fromISO(b.end), -1) })),
    ];
    if (camper.min_nights > 1) {
      rules.push({ from: addDays(pickup, 1), to: addDays(pickup, camper.min_nights - 1) });
    }
    if (next) rules.push({ after: next });
    return rules;
  }, [choosingReturn, pickup, today, bookedNights, booked, camper.min_nights]);

  function pickDay(day: Date) {
    if (!choosingReturn || !pickup) setRange({ from: day, to: undefined });
    else if (isSameDay(day, pickup)) setRange(undefined);
    else if (day < pickup) setRange({ from: day, to: undefined });
    else setRange({ from: pickup, to: day });
  }

  const start = range?.from ? toISO(range.from) : "";
  const end = range?.to ? toISO(range.to) : "";
  const nights = range?.from && range?.to ? differenceInCalendarDays(range.to, range.from) : 0;
  const key = start && end && nights >= 1 ? `${start}_${end}` : "";

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    api<QuoteResponse>("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ camper: camper.slug, start, end }),
    })
      .then((quote) => !cancelled && setResult({ key, quote }))
      .catch((e: Error) => !cancelled && setResult({ key, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [camper.slug, key, start, end]);

  const current = result?.key === key ? result : null;
  const loading = !!key && !current;
  const quote = current?.quote ?? null;
  const error =
    calendarError ||
    current?.error ||
    (quote && !quote.available ? "Those dates are already booked. Please choose different dates." : "");

  const canReserve = !!quote?.available && !loading;
  // A campground picked on the map carries through to the booking page.
  const park = params.get("park");
  const parkParam = park && /^[a-z0-9-]{1,60}$/.test(park) ? `&park=${park}` : "";
  const hint = !pickup
    ? "Choose your pickup day."
    : choosingReturn
      ? `Now choose your return day (${camper.min_nights}-night minimum).`
      : `${nights} nights selected.`;

  return (
    <div className="grid border border-line bg-white/70 lg:grid-cols-[1fr_22rem]">
      {/* Calendar */}
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-display text-3xl" aria-live="polite">{hint}</p>
          {pickup && (
            <button type="button" onClick={() => setRange(undefined)} className="eyebrow text-clay hover:underline">
              Clear dates
            </button>
          )}
        </div>

        <div ref={calendarBox} className="mt-6 flex justify-center">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={(_, day) => pickDay(day)}
            disabled={disabled}
            modifiers={{ booked: bookedNights }}
            modifiersClassNames={{ booked: "rdp-booked" }}
            numberOfMonths={months}
            captionLayout="dropdown"
            startMonth={today}
            endMonth={addMonths(today, 24)}
            defaultMonth={range?.from ?? today}
          />
        </div>

        <ul className="mt-6 flex flex-wrap gap-x-7 gap-y-2 border-t border-line pt-5 text-xs text-muted">
          <li className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 border border-line bg-white" /> Available
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 bg-sand" /> <span className="line-through">Booked</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 bg-pine" /> Your trip
          </li>
        </ul>
      </div>

      {/* Summary */}
      <div className="border-t border-line bg-cream/70 p-6 sm:p-8 lg:border-l lg:border-t-0">
        <p>
          <span className="font-display text-5xl">{rate(camper.daily_rate)}</span>
          <span className="text-sm text-muted"> / night</span>
        </p>
        <p className="mt-1 text-xs text-muted">{camper.min_nights}-night minimum</p>

        <div className="mt-6 grid grid-cols-2 gap-px border border-line bg-line text-sm">
          <div className="bg-white px-4 py-3">
            <p className="label !mb-1">Pickup</p>
            <p>{pickup ? dateLabel(pickup) : "Select a date"}</p>
          </div>
          <div className="bg-white px-4 py-3">
            <p className="label !mb-1">Return</p>
            <p>{range?.to && nights > 0 ? dateLabel(range.to) : "Select a date"}</p>
          </div>
        </div>

        {quote && quote.available && (
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>{rate(quote.quote.daily_rate)} × {quote.quote.days} nights</dt>
              <dd>{money(quote.quote.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Cleaning fee</dt>
              <dd>{money(quote.quote.cleaning_fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{money(quote.quote.total)}</dd>
            </div>
            <div className="flex justify-between text-pine">
              <dt>Due today ({quote.deposit_percent}% deposit)</dt>
              <dd className="font-semibold">{money(quote.quote.deposit_due)}</dd>
            </div>
            <p className="pt-1 text-xs leading-relaxed text-muted">
              The balance of {money(quote.quote.balance_due)} is due at pickup, along with a refundable{" "}
              {money(quote.quote.security_deposit)} security deposit.
            </p>
          </dl>
        )}

        {error && <p className="mt-4 text-sm text-clay-dark" role="alert">{error}</p>}

        <button
          type="button"
          disabled={!canReserve}
          onClick={() => router.push(`/book?camper=${camper.slug}&start=${start}&end=${end}${parkParam}`)}
          className="btn btn-primary mt-6 w-full"
        >
          {loading ? "Checking dates…" : canReserve ? "Reserve" : "Select your dates"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">You won&apos;t be charged yet.</p>
        <CardLogos className="mt-5 justify-center" />
      </div>
    </div>
  );
}
