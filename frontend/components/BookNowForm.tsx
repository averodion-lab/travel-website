"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import AddonIcon from "@/components/AddonIcon";
import CardLogos from "@/components/CardLogos";
import DateRangeField from "@/components/DateRangeField";
import PlacePicker from "@/components/PlacePicker";
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
  type TypedPlace,
} from "@/lib/api";
import { isISODate, money, rate } from "@/lib/format";
import { STATE_ORDER } from "@/lib/parks";
import { CUSTOM, placeFromParams, setPlaceParams, usePlaceMiles } from "@/lib/place";

const NEEDS = {
  mountains: "Mountain parks only",
  lake: "Lake parks only",
} as const;

/** One card to plan the whole trip: campground, dates and extras, with the
 *  server's live price. Continues to /book for details and payment. */
export default function BookNowForm({
  camper,
  parks,
  addons,
  transport: transportInfo,
  park: parkProp,
  onParkChange,
}: {
  camper: Camper;
  parks: Park[];
  addons: Park["addons"];
  transport: TransportInfo;
  /** Optional: let the page control the campground (the home page map fills it in). */
  park?: string;
  onParkChange?: (slug: string) => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [ownPark, setOwnPark] = useState(params.get("park") ?? "");
  const park = parkProp ?? ownPark;
  const setPark = onParkChange ?? setOwnPark;
  const [start, setStart] = useState(() =>
    isISODate(params.get("start")) ? params.get("start")! : "",
  );
  const [end, setEnd] = useState(() =>
    isISODate(params.get("end")) ? params.get("end")! : "",
  );
  const [picked, setPicked] = useState<string[]>(() =>
    (params.get("addons") ?? "").split(",").filter(Boolean),
  );
  // How the trailer gets there, and (for our truck) the towing-experience confirmation.
  const [transport, setTransport] = useState(() =>
    parseTransport(params.get("transport")),
  );
  const [experience, setExperience] = useState(params.get("exp") === "1");
  // "Somewhere else": a place they type in; the server measures the miles.
  const [place, setPlace] = useState<TypedPlace | null>(() => placeFromParams(params));
  const [priced, setPriced] = useState<{
    key: string;
    quote?: QuoteResponse;
    error?: string;
  } | null>(null);

  const parkInfo = parks.find((p) => p.slug === park) ?? null;
  const isCustom = park === CUSTOM;
  const typed = isCustom ? place : null;
  const measured = usePlaceMiles(typed);
  const placeReady = !!typed && measured.miles !== undefined;
  const parkSlug = isCustom ? (placeReady ? CUSTOM : "") : (parkInfo?.slug ?? "");
  // A typed place may ask for either extra (we confirm it with them).
  const offeredCodes = useMemo(
    () => (placeReady ? addons.map((a) => a.code) : (parkInfo?.addons.map((a) => a.code) ?? [])),
    [placeReady, addons, parkInfo],
  );
  const chosen = useMemo(() => picked.filter((c) => offeredCodes.includes(c)), [picked, offeredCodes]);
  // Delivery is priced by distance: a campground from the list or a measured place.
  const deliveryTo =
    parkInfo ?? (placeReady && typed ? { name: typed.name, delivery_miles: measured.miles! } : null);
  const transportCode = transport === "delivery" && !deliveryTo ? "self" : transport;
  const placeKey = typed && parkSlug === CUSTOM ? `${typed.lat},${typed.lng}` : "";
  const datesReady = !!start && !!end;
  const key = datesReady
    ? `${start}|${end}|${parkSlug}|${placeKey}|${chosen.join(",")}|${transportCode}|${experience}`
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
        place: parkSlug === CUSTOM ? typed : undefined,
        addons: chosen,
        transport: transportCode,
        towing_experience: experience,
      }),
    })
      .then((quote) => !cancelled && setPriced({ key, quote }))
      .catch((e: Error) => !cancelled && setPriced({ key, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [
    key,
    camper.slug,
    start,
    end,
    parkSlug,
    typed,
    chosen,
    transportCode,
    experience,
  ]);

  const current = priced?.key === key ? priced : null;
  const loading = !!key && !current;
  const q = current?.quote?.quote;
  const error =
    current?.error ||
    (current?.quote && !current.quote.available
      ? "Those dates are already booked. Please choose others."
      : "");
  const canContinue = !!current?.quote?.available && !loading;

  // Phones: a bar pinned to the bottom of the screen keeps the total and the
  // button in view while filling in the card; it hides once the summary's
  // own button is on screen.
  const datesRef = useRef<HTMLElement>(null);
  const summaryButton = useRef<HTMLButtonElement>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  useEffect(() => {
    const el = summaryButton.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) =>
      setSummaryVisible(entry.isIntersecting),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  function toDates() {
    datesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const groups = STATE_ORDER.map((state) => ({
    state,
    parks: parks.filter((p) => p.state === state),
  })).filter((g) => g.parks.length);
  const toggle = (code: string) =>
    setPicked((l) =>
      l.includes(code) ? l.filter((c) => c !== code) : [...l, code],
    );

  function next() {
    const qs = new URLSearchParams({
      camper: camper.slug,
      start,
      end,
      step: "details",
    });
    if (parkSlug) qs.set("park", parkSlug);
    if (parkSlug === CUSTOM) setPlaceParams(qs, typed);
    if (chosen.length) qs.set("addons", chosen.join(","));
    if (transportCode !== "self") qs.set("transport", transportCode);
    if (transportCode === "truck" && experience) qs.set("exp", "1");
    router.push(`/book?${qs}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <div className="rounded-md bg-white p-6 shadow-[0_24px_60px_-34px_rgba(33,29,26,0.45)] sm:p-8">
        {/* Campground */}
        <section>
          <p className="eyebrow text-clay">(01) Where</p>
          <label htmlFor="bn-park" className="mt-2 block font-display text-3xl">
            Campground
          </label>
          <select
            id="bn-park"
            value={isCustom ? CUSTOM : parkSlug}
            onChange={(e) => setPark(e.target.value)}
            className="field mt-4"
          >
            <option value="">Not sure yet</option>
            <option value={CUSTOM}>Somewhere else: type the place</option>
            {groups.map((g) => (
              <optgroup key={g.state} label={g.state}>
                {g.parks.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}, {p.city}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {isCustom && (
            <PlacePicker
              value={place}
              onChange={setPlace}
              measured={measured}
              perMile={transportInfo.delivery.per_mile}
              base={transportInfo.base}
            />
          )}
        </section>

        {/* Dates */}
        <section ref={datesRef} className="mt-7 border-t border-line pt-6">
          <p className="eyebrow text-clay">(02) When</p>
          <p className="mt-2 font-display text-3xl">Availability</p>
          <div className="relative mt-4 rounded-md border border-line px-4 py-3.5 transition-colors focus-within:border-pine hover:border-pine">
            <span className="label !mb-1">Pickup and return</span>
            <DateRangeField
              camperSlug={camper.slug}
              minNights={camper.min_nights}
              start={start}
              end={end}
              onChange={(s, e) => {
                setStart(s);
                setEnd(e);
              }}
              className="!text-base"
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            {rate(camper.daily_rate)} a night · {camper.min_nights}-night
            minimum
          </p>
        </section>

        {/* Getting there */}
        <section className="mt-7 border-t border-line pt-6">
          <p className="eyebrow text-clay">(03) Getting there</p>
          <p className="mt-2 font-display text-3xl">
            How will the trailer get there?
          </p>
          <div className="mt-5">
            <TransportPicker
              info={transportInfo}
              park={deliveryTo}
              nights={q?.days ?? 0}
              value={transportCode}
              onChange={setTransport}
              experience={experience}
              onExperience={setExperience}
            />
          </div>
        </section>

        {/* Extras */}
        <section className="mt-7 border-t border-line pt-6">
          <p className="eyebrow text-clay">(04) Extras</p>
          <p className="mt-2 font-display text-3xl">Add to your trip</p>
          <ul className="mt-5 space-y-3">
            {addons.map((a) => {
              const offered = offeredCodes.includes(a.code);
              const on = chosen.includes(a.code);
              return (
                <li key={a.code}>
                  <label
                    className={`flex items-center gap-4 rounded-2xl border-2 px-4 py-3 transition-colors ${
                      !offered
                        ? "cursor-not-allowed border-line opacity-55"
                        : on
                          ? "cursor-pointer border-pine bg-pine/5"
                          : "cursor-pointer border-line hover:border-pine"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={!offered}
                      onChange={() => toggle(a.code)}
                      className="h-5 w-5 shrink-0 accent-pine"
                    />
                    <AddonIcon
                      code={a.code}
                      size={44}
                      className={offered ? "" : "grayscale"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-medium">{a.name}</span>
                        {/* Phones: price next to the name, so the text has room. */}
                        <span className="text-sm font-semibold sm:hidden">
                          + {rate(a.daily_rate)}/day
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {offered
                          ? placeReady
                            ? `${a.description} We'll confirm it for your place.`
                            : a.description
                          : parkInfo
                            ? NEEDS[a.terrain]
                            : `${NEEDS[a.terrain]} · choose a campground first`}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-sm font-semibold sm:inline">
                      + {rate(a.daily_rate)}/day
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="overflow-hidden rounded-md bg-white shadow-[0_24px_60px_-34px_rgba(33,29,26,0.45)]">
          {camper.image_url && (
            <div className="relative aspect-[3/2]">
              <Image
                src={camper.image_url}
                alt={camper.name}
                fill
                sizes="24rem"
                className="object-cover"
              />
            </div>
          )}
          <div className="p-6">
            <p className="eyebrow text-clay">{camper.class_type}</p>
            <p className="mt-1 font-display text-3xl">{camper.name}</p>
            <p className="mt-3 text-sm">
              <span className="text-muted">Campground: </span>
              {parkInfo
                ? `${parkInfo.name}, ${parkInfo.state}`
                : typed
                  ? typed.name
                  : "Not chosen yet"}
            </p>

            {!datesReady ? (
              <p className="mt-6 rounded-xl bg-cream px-4 py-4 text-sm text-muted">
                Choose your dates to see the price.
              </p>
            ) : (
              <dl
                className={`mt-6 space-y-2 text-sm transition-opacity ${loading ? "opacity-50" : ""}`}
                aria-busy={loading}
              >
                {q && (
                  <>
                    <div className="flex justify-between">
                      <dt>
                        {rate(q.daily_rate)} × {q.days} nights
                      </dt>
                      <dd>{money(q.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Cleaning fee</dt>
                      <dd>{money(q.cleaning_fee)}</dd>
                    </div>
                    {q.addons.map((a) => (
                      <div key={a.code} className="flex justify-between">
                        <dt>
                          {a.name} × {a.days} days
                        </dt>
                        <dd>{money(a.total)}</dd>
                      </div>
                    ))}
                    {q.transport && q.transport.code !== "self" && (
                      <div className="flex justify-between">
                        <dt>{transportLabel(q.transport)}</dt>
                        <dd>{money(q.transport.total)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
                      <dt>Total</dt>
                      <dd>{money(q.total)}</dd>
                    </div>
                    <div className="flex justify-between text-pine">
                      <dt>Due today ({current?.quote?.deposit_percent}%)</dt>
                      <dd className="font-semibold">{money(q.deposit_due)}</dd>
                    </div>
                  </>
                )}
                {loading && !q && <p className="text-muted">Checking dates…</p>}
              </dl>
            )}

            {error && (
              <p className="mt-4 text-sm text-clay-dark" role="alert">
                {error}
              </p>
            )}

            <button
              ref={summaryButton}
              type="button"
              disabled={!canContinue}
              onClick={next}
              className="btn btn-primary mt-6 w-full"
            >
              {loading
                ? "Checking dates…"
                : datesReady
                  ? "Book now"
                  : "Choose your dates"}
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              Next: your details and payment. You won&apos;t be charged yet.
            </p>
            <CardLogos className="mt-5 justify-center" />
          </div>
        </div>
      </aside>

      {/* Phones: total and button pinned to the bottom of the screen. */}
      <div
        aria-hidden={summaryVisible}
        className={`sticky bottom-0 z-20 -mx-5 -mt-8 flex items-center justify-between gap-4 border-t border-line bg-white/95 px-5 py-3 shadow-[0_-10px_24px_-16px_rgba(33,29,26,0.45)] backdrop-blur-md transition-opacity sm:-mx-8 sm:px-8 lg:hidden ${
          summaryVisible ? "pointer-events-none opacity-0" : ""
        }`}
      >
        <div className={`min-w-0 transition-opacity ${loading ? "opacity-50" : ""}`}>
          {q && current?.quote?.available ? (
            <>
              <p className="text-xs text-muted">Total · {q.days} nights</p>
              <p className="font-display text-2xl leading-none">{money(q.total)}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted">{datesReady ? "Checking dates…" : "From"}</p>
              <p className="font-display text-2xl leading-none">
                {datesReady ? " " : `${rate(camper.daily_rate)}/night`}
              </p>
            </>
          )}
        </div>
        {datesReady ? (
          <button
            type="button"
            tabIndex={summaryVisible ? -1 : 0}
            disabled={!canContinue}
            onClick={next}
            className="btn btn-primary shrink-0 !px-5"
          >
            Book now
          </button>
        ) : (
          <button
            type="button"
            tabIndex={summaryVisible ? -1 : 0}
            onClick={toDates}
            className="btn btn-primary shrink-0 !px-5"
          >
            Choose dates
          </button>
        )}
      </div>
    </div>
  );
}
