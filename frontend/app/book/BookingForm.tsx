"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CardLogos, { Lock } from "@/components/CardLogos";
import { PREVIEW } from "@/lib/preview";
import { api, ApiError, type Camper, type QuoteResponse } from "@/lib/api";
import { isISODate, longDate, money, rate } from "@/lib/format";

export default function BookingForm() {
  const params = useSearchParams();
  const slug = params.get("camper") ?? "";
  const start = params.get("start");
  const end = params.get("end");
  const valid = !!slug && isISODate(start) && isISODate(end);

  const [camper, setCamper] = useState<Camper | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [datesTaken, setDatesTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Preview site: the last step explains that nothing was booked.
  const [previewDone, setPreviewDone] = useState(false);
  // "details" collects the traveller's information; "payment" reviews it and pays.
  const [step, setStep] = useState<"details" | "payment">("details");
  const [review, setReview] = useState({ name: "", email: "", phone: "" });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!valid) return;
    Promise.all([
      api<{ camper: Camper }>(`/api/campers/${encodeURIComponent(slug)}`),
      api<QuoteResponse>("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ camper: slug, start, end }),
      }),
    ])
      .then(([c, q]) => {
        setCamper(c.camper);
        setQuote(q);
        if (!q.available) setDatesTaken(true);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [valid, slug, start, end]);

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
  if (!camper || !quote) {
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
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-line bg-white/80 px-6 py-14 text-center sm:px-12">
        <p className="eyebrow text-clay">Online booking opens soon</p>
        <h2 className="mt-4 font-display text-5xl leading-none sm:text-6xl">Almost there.</h2>
        <p className="mx-auto mt-6 max-w-md leading-relaxed text-bark">
          This is a preview of our booking system, which isn&apos;t switched on yet. Your card was not charged, no
          booking was made, and the details you entered were not sent anywhere.
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
          <Link href={`/fleet/${slug}?start=${start}&end=${end}#book`} className="btn btn-primary">Back to the calendar</Link>
          <Link href="/" className="btn btn-outline">Home</Link>
        </div>
      </div>
    );
  }

  const steps = [
    { id: "dates", label: "Dates" },
    { id: "details", label: "Your details" },
    { id: "payment", label: "Payment" },
  ];
  const stepIndex = step === "details" ? 1 : 2;

  return (
    <>
      <ol className="mb-12 grid grid-cols-3 border border-line bg-white/60 text-left">
        {steps.map((item, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <li
              key={item.id}
              className={`flex items-center gap-3 px-4 py-4 sm:px-6 ${i > 0 ? "border-l border-line" : ""} ${active ? "bg-cream" : ""}`}
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
                className={`eyebrow ${active || done ? "text-ink" : "text-muted"}`}
              >
                <span className="hidden sm:inline">Step {i + 1}: </span>
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
        <form ref={formRef} onSubmit={onSubmit} className="space-y-12">
          {/* Step 2: details. Kept in the page (hidden) during payment so the fields are still submitted. */}
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
                    className="field !py-[0.55rem] text-sm file:mr-3 file:border-0 file:bg-sand file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-widest"
                  />
                  <p className="mt-2 text-xs text-muted">
                    JPG, PNG, HEIC or PDF, up to 10 MB.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <button
                type="button"
                onClick={goToPayment}
                className="btn btn-primary w-full sm:w-auto sm:min-w-72"
              >
                Continue to payment →
              </button>
            </section>
          </div>

          {/* Step 3: payment */}
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
                <dl className="mt-5 grid gap-px border border-line bg-line text-sm sm:grid-cols-3">
                  {[
                    ["Name", review.name],
                    ["Email", review.email],
                    ["Phone", review.phone],
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
                <div className="mt-5 border-2 border-pine bg-white">
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
                  disabled={submitting}
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

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="border border-line bg-white/70">
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
              <dl className="mt-5 grid grid-cols-2 gap-px bg-line text-sm">
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
                href={`/fleet/${slug}?start=${start}&end=${end}`}
                className="eyebrow mt-3 inline-block text-clay hover:underline"
              >
                Change dates
              </Link>
              <dl className="mt-6 space-y-2 text-sm">
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
    <div className="border border-line bg-white/60 px-6 py-16 text-center">
      <p className="font-display text-4xl">{title}</p>
      {text && <p className="mx-auto mt-4 max-w-md text-muted">{text}</p>}
      {children}
    </div>
  );
}
