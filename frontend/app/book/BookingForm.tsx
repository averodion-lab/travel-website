"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AddonIcon from "@/components/AddonIcon";
import CardLogos, { Lock } from "@/components/CardLogos";
import PlacePicker from "@/components/PlacePicker";
import TransportPicker, {
  parseTransport,
  transportLabel,
} from "@/components/TransportPicker";
import { PREVIEW } from "@/lib/preview";
import {
  api,
  ApiError,
  type Camper,
  type ParksResponse,
  type QuoteResponse,
  type TypedPlace,
} from "@/lib/api";
import { STATE_ORDER } from "@/lib/parks";
import { CUSTOM, placeFromParams, setPlaceParams, usePlaceMiles } from "@/lib/place";
import { isISODate, longDate, money, rate } from "@/lib/format";

export default function BookingForm() {
  const params = useSearchParams();
  const slug = params.get("camper") ?? "";
  const start = params.get("start");
  const end = params.get("end");
  const valid = !!slug && isISODate(start) && isISODate(end);

  const [camper, setCamper] = useState<Camper | null>(null);
  const [catalog, setCatalog] = useState<ParksResponse | null>(null);
  // Latest quote, tagged with the choices it was priced for.
  const [priced, setPriced] = useState<{
    key: string;
    quote: QuoteResponse;
  } | null>(null);
  const [quoteError, setQuoteError] = useState("");
  // Campground (slug, "" = somewhere else) and the extras switched on.
  const [park, setPark] = useState(params.get("park") ?? "");
  // "Somewhere else": a place they type in; the server measures the miles.
  const [place, setPlace] = useState<TypedPlace | null>(() => placeFromParams(params));
  const [addons, setAddons] = useState<string[]>(() =>
    (params.get("addons") ?? "").split(",").filter(Boolean),
  );
  // How the trailer gets there, and (for our truck) the towing-experience confirmation.
  const [transport, setTransport] = useState(() =>
    parseTransport(params.get("transport")),
  );
  const [experience, setExperience] = useState(params.get("exp") === "1");
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [datesTaken, setDatesTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Preview site: the last step explains that nothing was booked.
  const [previewDone, setPreviewDone] = useState(false);
  // "details" collects the traveller's information; "payment" reviews it and pays.
  // Coming from the Book Now page, the trip is already planned.
  const [step, setStep] = useState<"trip" | "details" | "payment">(() =>
    params.get("step") === "details" ? "details" : "trip",
  );
  const [review, setReview] = useState({ name: "", email: "", phone: "" });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!valid) return;
    Promise.all([
      api<{ camper: Camper }>(`/api/campers/${encodeURIComponent(slug)}`),
      api<ParksResponse>("/api/parks"),
    ])
      .then(([c, p]) => {
        setCamper(c.camper);
        setCatalog(p);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [valid, slug]);

  // A park from the list (and the extras it offers), or a typed place.
  const parkInfo = catalog?.parks.find((p) => p.slug === park) ?? null;
  const isCustom = park === CUSTOM;
  const typed = isCustom ? place : null;
  const measured = usePlaceMiles(typed);
  const placeReady = !!typed && measured.miles !== undefined;
  const parkSlug = isCustom ? (placeReady ? CUSTOM : "") : parkInfo ? parkInfo.slug : "";
  const offeredCodes = useMemo(
    () =>
      placeReady
        ? (catalog?.addons.map((a) => a.code) ?? [])
        : (parkInfo?.addons.map((a) => a.code) ?? []),
    [placeReady, catalog, parkInfo],
  );
  const chosen = useMemo(() => addons.filter((code) => offeredCodes.includes(code)), [addons, offeredCodes]);
  // Delivery is priced by distance: a campground from the list or a measured
  // place. Our truck needs the towing-experience box ticked before it is priced.
  const deliveryTo =
    parkInfo ?? (placeReady && typed ? { name: typed.name, delivery_miles: measured.miles! } : null);
  const transportCode = transport === "delivery" && !deliveryTo ? "self" : transport;
  const quotedTransport =
    transportCode === "truck" && !experience ? "self" : transportCode;
  const placeKey = typed && parkSlug === CUSTOM ? `${typed.lat},${typed.lng}` : "";
  const choiceKey = `${parkSlug}|${placeKey}|${chosen.join(",")}|${quotedTransport}`;

  // The server prices the trip, extras included, whenever the choices change.
  useEffect(() => {
    if (!valid || !catalog) return;
    let cancelled = false;
    api<QuoteResponse>("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        camper: slug,
        start,
        end,
        park: parkSlug,
        place: parkSlug === CUSTOM ? typed : undefined,
        addons: chosen,
        transport: quotedTransport,
        towing_experience: experience,
      }),
    })
      .then((q) => {
        if (cancelled) return;
        setPriced({ key: choiceKey, quote: q });
        setQuoteError("");
        if (!q.available) setDatesTaken(true);
      })
      .catch((e: Error) => {
        if (!cancelled) setQuoteError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [
    valid,
    catalog,
    slug,
    start,
    end,
    parkSlug,
    typed,
    chosen,
    choiceKey,
    quotedTransport,
    experience,
  ]);

  const quote = priced?.quote ?? null;
  const repricing = !!priced && priced.key !== choiceKey && !quoteError;

  if (!valid) {
    return (
      <Notice title="Let's pick your dates first.">
        <Link href="/fleet" className="btn btn-primary mt-8">
          See the trailer
        </Link>
      </Notice>
    );
  }
  if (loadError) {
    return (
      <Notice title="We couldn't start this booking." text={loadError}>
        <Link href={`/fleet/${slug}`} className="btn btn-primary mt-8">
          Back to the trailer
        </Link>
      </Notice>
    );
  }
  if (quoteError && !quote) {
    return (
      <Notice title="We couldn't price this trip." text={quoteError}>
        <Link href={`/fleet/${slug}`} className="btn btn-primary mt-8">
          Back to the trailer
        </Link>
      </Notice>
    );
  }
  if (!camper || !catalog || !quote) {
    return <div className="h-[40rem] animate-pulse bg-sand/60" />;
  }
  if (datesTaken) {
    return (
      <Notice
        title="Those dates were just booked."
        text="Someone reserved the trailer for overlapping dates. Please choose different dates."
      >
        <Link href={`/fleet/${slug}`} className="btn btn-primary mt-8">
          Choose new dates
        </Link>
      </Notice>
    );
  }

  function goToPayment() {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;
    const data = new FormData(form);
    setReview({
      name: `${data.get("first_name")} ${data.get("last_name")}`,
      email: String(data.get("email")),
      phone: String(data.get("phone")),
    });
    setError("");
    setStep("payment");
    window.scrollTo({ top: 0 });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === "trip") return setStep("details");
    if (step === "details") return goToPayment();
    if (PREVIEW) {
      // No booking system online yet: nothing is sent anywhere.
      setPreviewDone(true);
      window.scrollTo({ top: 0 });
      return;
    }
    setError("");
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    data.set("camper", slug);
    data.set("start", start!);
    data.set("end", end!);
    data.set("park", parkSlug);
    if (parkSlug === CUSTOM && typed) {
      data.set("place_name", typed.name);
      data.set("place_lat", String(typed.lat));
      data.set("place_lng", String(typed.lng));
    }
    data.delete("addons");
    chosen.forEach((code) => data.append("addons", code));
    data.set("transport", transportCode);
    data.set("towing_experience", experience ? "1" : "0");
    try {
      const res = await api<{ reference: string; checkout_url: string }>(
        "/api/bookings",
        {
          method: "POST",
          body: data,
        },
      );
      // Off to Stripe Checkout (or straight to the confirmation in test mode).
      window.location.assign(res.checkout_url);
    } catch (e) {
      if (e instanceof ApiError && e.code === "dates_unavailable")
        setDatesTaken(true);
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  }

  const q = quote.quote;

  if (previewDone) {
    return (
      <div className="mx-auto max-w-2xl rounded-md border border-line bg-white/80 px-6 py-14 text-center sm:px-12">
        <p className="eyebrow text-clay">Online booking opens soon</p>
        <h2 className="mt-4 font-display text-5xl leading-none sm:text-6xl">
          Almost there.
        </h2>
        <p className="mx-auto mt-6 max-w-md leading-relaxed text-bark">
          This is a preview of our booking system, which isn&apos;t switched on
          yet. Your card was not charged, no booking was made, and the details
          you entered were not sent anywhere.
        </p>
        <dl className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-px border border-line bg-line text-left text-sm">
          <div className="bg-cream px-4 py-3">
            <dt className="label !mb-1">Pickup</dt>
            <dd>{longDate(start!)}</dd>
          </div>
          <div className="bg-cream px-4 py-3">
            <dt className="label !mb-1">Return</dt>
            <dd>{longDate(end!)}</dd>
          </div>
          <div className="col-span-2 flex justify-between bg-cream px-4 py-3">
            <dt>{q.days} nights, total</dt>
            <dd className="font-semibold">{money(q.total)}</dd>
          </div>
        </dl>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href={`/fleet/${slug}?start=${start}&end=${end}#book`}
            className="btn btn-primary"
          >
            Back to the calendar
          </Link>
          <Link href="/" className="btn btn-outline">
            Home
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { id: "dates", label: "Dates" },
    { id: "trip", label: "Your trip" },
    { id: "details", label: "Your details" },
    { id: "payment", label: "Payment" },
  ];
  const stepIndex = { trip: 1, details: 2, payment: 3 }[step];
  const parksByState = STATE_ORDER.map((state) => ({
    state,
    parks: catalog.parks.filter((p) => p.state === state),
  })).filter((g) => g.parks.length > 0);
  const toggle = (code: string) =>
    setAddons((list) =>
      list.includes(code) ? list.filter((c) => c !== code) : [...list, code],
    );
  const needs = { mountains: "mountain parks", lake: "lake parks" } as const;
  const goTo = (next: "trip" | "details") => {
    setStep(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <ol className="mb-10 grid grid-cols-4 overflow-hidden rounded-2xl border border-line bg-white/60 text-left">
        {steps.map((item, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <li
              key={item.id}
              className={`flex items-center justify-center gap-3 px-2 py-4 sm:justify-start sm:px-5 ${i > 0 ? "border-l border-line" : ""} ${active ? "bg-cream" : ""}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-pine text-cream"
                    : active
                      ? "bg-ink text-cream"
                      : "border border-line text-muted"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`eyebrow ${active || done ? "text-ink" : "text-muted"} ${active ? "" : "hidden lg:inline"} max-sm:sr-only`}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="space-y-12 rounded-md bg-white p-6 shadow-[0_24px_60px_-34px_rgba(33,29,26,0.45)] sm:p-9"
        >
          <p className="eyebrow text-clay sm:hidden">
            Step {stepIndex + 1} of 4: {steps[stepIndex].label}
          </p>

          {/* Step 2: campground and extras */}
          {step === "trip" && (
            <div className="space-y-12">
              <section>
                <h2 className="font-display text-4xl">
                  Where are you staying?
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                  Reserve your site with the park directly. If we deliver, we
                  set the trailer up there for you.{" "}
                  <Link href="/destinations" className="text-clay underline">
                    See all parks on the map
                  </Link>
                </p>
                <label className="label mt-6" htmlFor="park">
                  Campground
                </label>
                <select
                  id="park"
                  value={isCustom ? CUSTOM : parkSlug}
                  onChange={(e) => setPark(e.target.value)}
                  className="field"
                >
                  <option value="">Not sure yet (we&apos;ll confirm it with you)</option>
                  <option value={CUSTOM}>Somewhere else: type the place</option>
                  {parksByState.map((g) => (
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
                    perMile={catalog.transport.delivery.per_mile}
                    base={catalog.transport.base}
                  />
                )}
                {parkInfo && (
                  <div className="mt-4 rounded-2xl bg-cream p-5 text-sm">
                    <p className="eyebrow text-muted">
                      {parkInfo.city}, {parkInfo.state} ·{" "}
                      {parkInfo.terrain.length
                        ? parkInfo.terrain
                            .map((t) => (t === "lake" ? "Lake" : "Mountains"))
                            .join(" and ")
                        : "Foothills"}
                    </p>
                    <p className="mt-2 leading-relaxed text-bark">
                      {parkInfo.description}
                    </p>
                    <a
                      href={parkInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="eyebrow mt-3 inline-block text-clay hover:underline"
                    >
                      Park website ↗
                    </a>
                  </div>
                )}
              </section>

              <section>
                <h2 className="font-display text-4xl">Getting there</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                  Tow it yourself, rent our truck, or let us deliver it and set
                  it up at your campsite.
                </p>
                <div className="mt-6 max-w-2xl">
                  <TransportPicker
                    info={catalog.transport}
                    park={deliveryTo}
                    nights={q.days}
                    value={transportCode}
                    onChange={setTransport}
                    experience={experience}
                    onExperience={setExperience}
                  />
                </div>
              </section>

              <section>
                <h2 className="font-display text-4xl">Extras</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                  Optional. They ride along on the trailer and are charged per day of
                  your trip.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {catalog.addons.map((a) => {
                    const offered = offeredCodes.includes(a.code);
                    const on = chosen.includes(a.code);
                    const tripTotal = Number(a.daily_rate) * quote.quote.days;
                    return (
                      <button
                        key={a.code}
                        type="button"
                        role="switch"
                        aria-checked={on}
                        disabled={!offered}
                        onClick={() => toggle(a.code)}
                        className={`flex flex-col rounded-2xl border-2 p-5 text-left transition-colors disabled:cursor-not-allowed ${
                          on
                            ? "border-pine bg-pine text-cream"
                            : offered
                              ? "border-line bg-white hover:border-pine"
                              : "border-line bg-white/50 opacity-60"
                        }`}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="flex items-center gap-3">
                            <AddonIcon
                              code={a.code}
                              size={52}
                              className={`transition-transform duration-300 ${on ? "scale-110" : ""} ${offered ? "" : "grayscale"}`}
                            />
                            <span className="font-display text-3xl leading-none">
                              {a.name}
                            </span>
                          </span>
                          <span
                            aria-hidden="true"
                            className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-cream/30" : "bg-sand"}`}
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full shadow transition-all ${on ? "left-[1.375rem] bg-cream" : "left-0.5 bg-white"}`}
                            />
                          </span>
                        </span>
                        <span
                          className={`mt-3 text-sm leading-relaxed ${on ? "text-cream/85" : "text-bark"}`}
                        >
                          {a.description}
                        </span>
                        <span
                          className={`mt-4 text-sm font-semibold ${on ? "" : "text-ink"}`}
                        >
                          {offered
                            ? `${rate(a.daily_rate)}/day · ${money(tripTotal)} for ${quote.quote.days} days`
                            : `Only at ${needs[a.terrain]}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {!parkInfo && !placeReady && (
                  <p className="mt-4 text-sm text-muted">
                    Choose a campground, or type where you&apos;re staying, to
                    see which extras you can add.
                  </p>
                )}
                {quoteError && (
                  <p
                    className="mt-4 border border-clay bg-clay/10 px-4 py-3 text-sm text-clay-dark"
                    role="alert"
                  >
                    {quoteError}
                  </p>
                )}
              </section>

              <section>
                {/* Phones: the summary is further down, so show the running total here. */}
                <div
                  className={`mb-5 flex items-baseline justify-between rounded-2xl bg-white px-5 py-4 transition-opacity lg:hidden ${repricing ? "opacity-50" : ""}`}
                  aria-live="polite"
                >
                  <span className="text-sm text-muted">Trip total</span>
                  <span>
                    <span className="font-display text-3xl">
                      {money(quote.quote.total)}
                    </span>
                    <span className="block text-right text-xs text-muted">
                      {money(quote.quote.deposit_due)} due today
                    </span>
                  </span>
                </div>
                {transportCode === "truck" && !experience && (
                  <p className="mb-3 text-sm text-clay">
                    Please confirm your towing experience to rent our truck, or
                    choose another option.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => goTo("details")}
                  disabled={
                    (transportCode === "truck" && !experience) || repricing
                  }
                  className="btn btn-primary w-full disabled:opacity-50 sm:w-auto sm:min-w-72"
                >
                  Continue to your details →
                </button>
              </section>
            </div>
          )}

          {/* Step 3: details. Kept in the page (hidden) on the other steps so the fields are still submitted. */}
          <div className={step === "details" ? "space-y-12" : "hidden"}>
            <section>
              <h2 className="font-display text-4xl">Your details</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="first_name">
                    First name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    required
                    maxLength={80}
                    autoComplete="given-name"
                    className="field"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="last_name">
                    Last name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    required
                    maxLength={80}
                    autoComplete="family-name"
                    className="field"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    maxLength={200}
                    autoComplete="email"
                    className="field"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="phone">
                    Mobile phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    maxLength={40}
                    autoComplete="tel"
                    className="field"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="address">
                    Home address{" "}
                    <span className="font-normal normal-case tracking-normal text-muted">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="address"
                    name="address"
                    maxLength={300}
                    autoComplete="street-address"
                    className="field"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-4xl">Driver&apos;s license</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                We need the license of the person responsible for the rental. It
                is stored encrypted, seen only by our staff, and deleted 30 days
                after your trip.
              </p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="license_number">
                    License number
                  </label>
                  <input
                    id="license_number"
                    name="license_number"
                    required
                    maxLength={60}
                    autoComplete="off"
                    className="field"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="license">
                    Photo of license
                  </label>
                  <input
                    id="license"
                    name="license"
                    type="file"
                    required
                    accept=".jpg,.jpeg,.png,.webp,.heic,.pdf,image/*,application/pdf"
                    className="field !py-[0.55rem] text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sand file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-widest"
                  />
                  <p className="mt-2 text-xs text-muted">
                    JPG, PNG, HEIC or PDF, up to 10 MB.
                  </p>
                </div>
              </div>
            </section>

            <section className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={goToPayment}
                className="btn btn-primary w-full sm:w-auto sm:min-w-72"
              >
                Continue to payment →
              </button>
              <button
                type="button"
                onClick={() => goTo("trip")}
                className="eyebrow text-muted hover:text-ink"
              >
                ← Back to your trip
              </button>
            </section>
          </div>

          {/* Step 4: payment */}
          {step === "payment" && (
            <div className="space-y-10">
              <section>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-4xl">Review</h2>
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="eyebrow text-clay hover:underline"
                  >
                    Edit details
                  </button>
                </div>
                <dl className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-line bg-line text-sm sm:grid-cols-3 [&>div:nth-child(4)]:sm:col-span-2 [&>div:nth-child(6)]:sm:col-span-3">
                  {[
                    ["Name", review.name],
                    ["Email", review.email],
                    ["Phone", review.phone],
                    [
                      "Campground",
                      parkInfo ? parkInfo.name : typed ? typed.name : "Not chosen yet",
                    ],
                    [
                      "Extras",
                      q.addons.length
                        ? q.addons.map((a) => a.name).join(", ")
                        : "None",
                    ],
                    [
                      "Getting there",
                      q.transport.code === "truck"
                        ? `${q.transport.name} (towing experience confirmed)`
                        : transportLabel(q.transport),
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white px-4 py-3">
                      <dt className="label !mb-1">{label}</dt>
                      <dd className="break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section>
                <h2 className="font-display text-4xl">Payment</h2>
                <div className="mt-5 overflow-hidden rounded-2xl border-2 border-pine bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-pine"
                        aria-hidden="true"
                      >
                        <span className="h-2.5 w-2.5 rounded-full bg-pine" />
                      </span>
                      <span className="font-semibold">
                        Credit or debit card
                      </span>
                    </div>
                    <CardLogos />
                  </div>
                  <div className="flex items-start gap-3 border-t border-line bg-cream/60 px-5 py-4 text-sm leading-relaxed text-bark">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-pine" />
                    <p>
                      You&apos;ll enter your card on Stripe&apos;s secure
                      payment page in the next step. We never see or store your
                      card number.
                    </p>
                  </div>
                </div>

                <dl className="mt-6 space-y-2 text-sm">
                  <div className="flex justify-between text-base font-semibold">
                    <dt>Due today ({quote.deposit_percent}% deposit)</dt>
                    <dd>{money(q.deposit_due)}</dd>
                  </div>
                  <div className="flex justify-between text-muted">
                    <dt>Due at pickup</dt>
                    <dd>{money(q.balance_due)}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <label className="flex items-start gap-3 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    name="agree_terms"
                    value="1"
                    required
                    className="mt-1 h-4 w-4 accent-pine"
                  />
                  <span>
                    I agree to the rental terms, and I confirm the driver is at
                    least 25 years old and holds a valid driver&apos;s license.
                  </span>
                </label>

                {error && (
                  <p
                    className="mt-6 border border-clay bg-clay/10 px-4 py-3 text-sm text-clay-dark"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || repricing}
                  className="btn btn-primary mt-8 w-full sm:w-auto sm:min-w-80"
                >
                  <Lock />
                  {submitting
                    ? "Reserving your dates…"
                    : `Pay ${money(q.deposit_due)} deposit`}
                </button>
                <p className="mt-3 text-xs text-muted">
                  {PREVIEW
                    ? "Preview site: online booking isn't switched on yet, so you won't be charged."
                    : "Your dates are held for 30 minutes while you pay."}
                </p>
              </section>
            </div>
          )}
        </form>

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
              <p className="mt-2 font-display text-3xl">{camper.name}</p>
              <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line text-sm">
                <div className="bg-cream px-4 py-3">
                  <dt className="label !mb-1">Pickup</dt>
                  <dd>{longDate(start!)}</dd>
                </div>
                <div className="bg-cream px-4 py-3">
                  <dt className="label !mb-1">Return</dt>
                  <dd>{longDate(end!)}</dd>
                </div>
              </dl>
              <Link
                href={`/book-now?${new URLSearchParams({ start: start!, end: end!, ...(parkSlug ? { park: parkSlug } : {}), ...(parkSlug === CUSTOM && typed ? Object.fromEntries((() => { const q = new URLSearchParams(); setPlaceParams(q, typed); return [...q]; })()) : {}), ...(chosen.length ? { addons: chosen.join(",") } : {}), ...(transportCode !== "self" ? { transport: transportCode } : {}), ...(transportCode === "truck" && experience ? { exp: "1" } : {}) })}`}
                className="eyebrow mt-3 inline-block text-clay hover:underline"
              >
                Change trip
              </Link>
              <p className="mt-5 text-sm">
                <span className="text-muted">Campground: </span>
                {parkInfo
                  ? `${parkInfo.name}, ${parkInfo.state}`
                  : typed
                    ? typed.name
                    : "Not chosen yet"}
              </p>
              <dl
                className={`mt-6 space-y-2 text-sm transition-opacity ${repricing ? "opacity-50" : ""}`}
                aria-busy={repricing}
              >
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
                {q.transport.code !== "self" && (
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
                  <dt>Due today ({quote.deposit_percent}%)</dt>
                  <dd className="font-semibold">{money(q.deposit_due)}</dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>Due at pickup</dt>
                  <dd>{money(q.balance_due)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                A refundable {money(q.security_deposit)} security deposit is
                held at pickup and released after the trailer is returned and
                inspected.
              </p>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-5">
                <p className="flex items-center gap-2 text-xs text-muted">
                  <Lock /> Secure checkout
                </p>
                <CardLogos />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function Notice({
  title,
  text,
  children,
}: {
  title: string;
  text?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-md bg-white px-6 py-16 text-center shadow-[0_24px_60px_-34px_rgba(33,29,26,0.45)]">
      <p className="font-display text-4xl">{title}</p>
      {text && <p className="mx-auto mt-4 max-w-md text-muted">{text}</p>}
      {children}
    </div>
  );
}
