"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addMonths, differenceInCalendarDays, startOfDay } from "date-fns";
import { DayPicker, type DateRange } from "react-day-picker";
import AddonIcon from "@/components/AddonIcon";
import CardLogos from "@/components/CardLogos";
import TransportPicker, {
  parseTransport,
  transportLabel,
} from "@/components/TransportPicker";
import {
  api,
  type Camper,
  type Park,
  type QuoteResponse,
  type TransportInfo,
} from "@/lib/api";
import { STATE_ORDER } from "@/lib/parks";
import { fromISO, isISODate, money, rate, toISO } from "@/lib/format";
import {
  bookedNights as takenNights,
  disabledDays,
  nextRange,
  type Booked,
} from "@/lib/stay";

const dateLabel = (d: Date) =>
  d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const NEEDS = {
  mountains: "Mountain parks only",
  lake: "Lake parks only",
} as const;

/** Availability calendar + live estimate for one camper. The visitor clicks a
 *  pickup day, then a return day, picks a campground and switches extras in
 *  or out; the server prices every change. "Book now" goes straight to
 *  details and payment. */
export default function BookingWidget({
  camper,
  parks = [],
  addons = [],
  transport: transportInfo,
}: {
  camper: Camper;
  parks?: Park[];
  addons?: Park["addons"];
  transport?: TransportInfo;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [range, setRange] = useState<DateRange | undefined>(() => {
    const s = params.get("start");
    const e = params.get("end");
    return isISODate(s) && isISODate(e) && e > s
      ? { from: fromISO(s), to: fromISO(e) }
      : undefined;
  });
  const [booked, setBooked] = useState<Booked[]>([]);
  // Campground (from the map, if they came from there) and the extras switched on.
  const [park, setPark] = useState(params.get("park") ?? "");
  const [picked, setPicked] = useState<string[]>(() =>
    (params.get("addons") ?? "").split(",").filter(Boolean),
  );
  // How the trailer gets there, and (for our truck) the towing-experience confirmation.
  const [transport, setTransport] = useState(() =>
    parseTransport(params.get("transport")),
  );
  const [experience, setExperience] = useState(params.get("exp") === "1");
  const [calendarError, setCalendarError] = useState("");
  // The latest quote (or error), tagged with the dates it belongs to.
  const [result, setResult] = useState<{
    key: string;
    quote?: QuoteResponse;
    error?: string;
  } | null>(null);

  // Two months side by side when there is room for them.
  const calendarBox = useRef<HTMLDivElement>(null);
  const [months, setMonths] = useState(1);
  useEffect(() => {
    const box = calendarBox.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) =>
      setMonths(entry.contentRect.width >= 640 ? 2 : 1),
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    api<{ booked: Booked[] }>(`/api/campers/${camper.slug}/availability`)
      .then((r) => setBooked(r.booked))
      .catch(() =>
        setCalendarError(
          "We couldn't load the calendar. Please refresh the page.",
        ),
      );
  }, [camper.slug]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const pickup = range?.from;
  const choosingReturn = !!pickup && !range?.to;

  const bookedNights = useMemo(() => takenNights(booked), [booked]);
  const disabled = useMemo(
    () => disabledDays(range, booked, today, camper.min_nights),
    [range, booked, today, camper.min_nights],
  );
  const pickDay = (day: Date) => setRange(nextRange(range, day));

  const start = range?.from ? toISO(range.from) : "";
  const end = range?.to ? toISO(range.to) : "";
  const nights =
    range?.from && range?.to
      ? differenceInCalendarDays(range.to, range.from)
      : 0;
  const parkInfo = parks.find((p) => p.slug === park) ?? null;
  const parkSlug = parkInfo?.slug ?? "";
  const chosen = useMemo(
    () =>
      picked.filter((code) => parkInfo?.addons.some((a) => a.code === code)),
    [picked, parkInfo],
  );
  // Delivery is priced by distance, so it needs a campground from the list.
  const transportCode =
    transport === "delivery" && !parkInfo ? "self" : transport;
  const key =
    start && end && nights >= 1
      ? `${start}_${end}_${parkSlug}_${chosen.join(",")}_${transportCode}_${experience}`
      : "";

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    api<QuoteResponse>("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        camper: camper.slug,
        start,
        end,
        park: parkSlug,
        addons: chosen,
        transport: transportCode,
        towing_experience: experience,
      }),
    })
      .then((quote) => !cancelled && setResult({ key, quote }))
      .catch((e: Error) => !cancelled && setResult({ key, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [
    camper.slug,
    key,
    start,
    end,
    parkSlug,
    chosen,
    transportCode,
    experience,
  ]);

  const current = result?.key === key ? result : null;
  const loading = !!key && !current;
  const quote = current?.quote ?? null;
  const error =
    calendarError ||
    current?.error ||
    (quote && !quote.available
      ? "Those dates are already booked. Please choose different dates."
      : "");

  const canReserve = !!quote?.available && !loading;
  // Keep the last estimate on screen while a new one loads, so nothing jumps.
  const [shown, setShown] = useState<QuoteResponse | null>(null);
  if (quote && quote !== shown) setShown(quote);
  const estimate = key ? (quote ?? shown) : null;

  function bookNow() {
    const qs = new URLSearchParams({
      camper: camper.slug,
      start,
      end,
      step: "details",
    });
    if (parkSlug) qs.set("park", parkSlug);
    if (chosen.length) qs.set("addons", chosen.join(","));
    if (transportCode !== "self") qs.set("transport", transportCode);
    if (transportCode === "truck" && experience) qs.set("exp", "1");
    router.push(`/book?${qs}`);
  }
  const toggle = (code: string) =>
    setPicked((l) =>
      l.includes(code) ? l.filter((c) => c !== code) : [...l, code],
    );
  const groups = STATE_ORDER.map((state) => ({
    state,
    parks: parks.filter((p) => p.state === state),
  })).filter((g) => g.parks.length);
  const hint = !pickup
    ? "Choose your pickup day."
    : choosingReturn
      ? `Now choose your return day (${camper.min_nights}-night minimum).`
      : `${nights} nights selected.`;

  return (
    <div className="grid overflow-hidden rounded-md bg-white shadow-[0_24px_60px_-34px_rgba(33,29,26,0.45)] lg:grid-cols-[1fr_25rem]">
      {/* Calendar */}
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-display text-3xl" aria-live="polite">
            {hint}
          </p>
          {pickup && (
            <button
              type="button"
              onClick={() => setRange(undefined)}
              className="eyebrow text-clay hover:underline"
            >
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
            <span className="h-3.5 w-3.5 border border-line bg-white" />{" "}
            Available
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 bg-sand" />{" "}
            <span className="line-through">Booked</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 bg-pine" /> Your trip
          </li>
        </ul>
      </div>

      {/* Trip and estimate */}
      <div className="border-t border-line bg-cream/70 p-6 sm:p-8 lg:border-l lg:border-t-0">
        <p>
          <span className="font-display text-5xl">
            {rate(camper.daily_rate)}
          </span>
          <span className="text-sm text-muted"> / night</span>
        </p>
        <p className="mt-1 text-xs text-muted">
          {camper.min_nights}-night minimum
        </p>

        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line text-sm">
          <div className="bg-white px-4 py-3">
            <p className="label !mb-1">Pickup</p>
            <p>{pickup ? dateLabel(pickup) : "Select a date"}</p>
          </div>
          <div className="bg-white px-4 py-3">
            <p className="label !mb-1">Return</p>
            <p>
              {range?.to && nights > 0 ? dateLabel(range.to) : "Select a date"}
            </p>
          </div>
        </div>

        {parks.length > 0 && (
          <label className="mt-4 block">
            <span className="label">Campground</span>
            <select
              value={parkSlug}
              onChange={(e) => setPark(e.target.value)}
              className="field !py-2.5 text-sm"
            >
              <option value="">Another campground</option>
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
        )}

        {transportInfo && (
          <fieldset className="mt-4">
            <legend className="label">Getting there</legend>
            <TransportPicker
              info={transportInfo}
              park={parkInfo}
              nights={nights}
              value={transportCode}
              onChange={setTransport}
              experience={experience}
              onExperience={setExperience}
              compact
            />
          </fieldset>
        )}

        {addons.length > 0 && (
          <fieldset className="mt-4">
            <legend className="label">Extras</legend>
            <div className="space-y-2">
              {addons.map((a) => {
                const offered = !!parkInfo?.addons.some(
                  (x) => x.code === a.code,
                );
                const on = chosen.includes(a.code);
                return (
                  <label
                    key={a.code}
                    className={`flex items-center gap-3 rounded-xl border-2 bg-white px-3 py-2.5 transition-colors ${
                      !offered
                        ? "cursor-not-allowed border-line opacity-55"
                        : on
                          ? "cursor-pointer border-pine"
                          : "cursor-pointer border-line hover:border-pine"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={!offered}
                      onChange={() => toggle(a.code)}
                      className="h-4 w-4 shrink-0 accent-pine"
                    />
                    <AddonIcon
                      code={a.code}
                      size={34}
                      className={offered ? "" : "grayscale"}
                    />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="block font-medium">{a.name}</span>
                      <span className="block text-xs text-muted">
                        {offered
                          ? `+ ${rate(a.daily_rate)}/day`
                          : parkInfo
                            ? NEEDS[a.terrain]
                            : "Choose a campground"}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {estimate && estimate.available && (
          <dl
            className={`mt-6 space-y-2 text-sm transition-opacity ${loading ? "opacity-50" : ""}`}
            aria-busy={loading}
          >
            <p className="eyebrow !mb-3 text-clay">Your estimate</p>
            <div className="flex justify-between">
              <dt>
                {rate(estimate.quote.daily_rate)} × {estimate.quote.days} nights
              </dt>
              <dd>{money(estimate.quote.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Cleaning fee</dt>
              <dd>{money(estimate.quote.cleaning_fee)}</dd>
            </div>
            {estimate.quote.addons.map((a) => (
              <div key={a.code} className="flex justify-between">
                <dt>
                  {a.name} × {a.days} days
                </dt>
                <dd>{money(a.total)}</dd>
              </div>
            ))}
            {estimate.quote.transport &&
              estimate.quote.transport.code !== "self" && (
                <div className="flex justify-between">
                  <dt>{transportLabel(estimate.quote.transport)}</dt>
                  <dd>{money(estimate.quote.transport.total)}</dd>
                </div>
              )}
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{money(estimate.quote.total)}</dd>
            </div>
            <div className="flex justify-between text-pine">
              <dt>Pay now ({estimate.deposit_percent}% deposit)</dt>
              <dd className="font-semibold">
                {money(estimate.quote.deposit_due)}
              </dd>
            </div>
            <p className="pt-1 text-xs leading-relaxed text-muted">
              The balance of {money(estimate.quote.balance_due)} is due at
              pickup, along with a refundable{" "}
              {money(estimate.quote.security_deposit)} security deposit.
            </p>
          </dl>
        )}

        {error && (
          <p className="mt-4 text-sm text-clay-dark" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!canReserve}
          onClick={bookNow}
          className="btn btn-primary mt-6 w-full"
        >
          {loading
            ? "Updating estimate…"
            : canReserve && quote
              ? `Book now · pay ${money(quote.quote.deposit_due)}`
              : "Select your dates"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          Next: your details, then secure card payment.
        </p>
        <CardLogos className="mt-5 justify-center" />
      </div>
    </div>
  );
}
