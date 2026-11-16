"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DateRangeField from "@/components/DateRangeField";
import { api, type PublicBooking } from "@/lib/api";
import { longDate, money } from "@/lib/format";

type Found = { booking: PublicBooking; can_change: boolean };

/** Guests find their booking (number + email) and cancel it or move the
 *  dates, free of charge up to 24 hours before pickup. */
export default function ManageBooking() {
  const params = useSearchParams();
  const [reference, setReference] = useState(params.get("ref") ?? "");
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [mode, setMode] = useState<"view" | "change" | "cancel">("view");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function call(
    action: "find" | "cancel" | "change",
    extra: Record<string, string> = {},
  ) {
    setBusy(true);
    setError("");
    try {
      const res = await api<Found>(`/api/manage/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, email, ...extra }),
      });
      setFound(res);
      setMode("view");
      return res;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function onFind(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    await call("find");
  }

  async function onCancel() {
    const res = await call("cancel");
    if (res)
      setNotice(
        "Your booking is cancelled. We've emailed you a confirmation; your deposit is being refunded.",
      );
  }

  async function onChange() {
    const res = await call("change", { start, end });
    if (res) {
      setNotice("Your dates are changed. We've emailed you the new details.");
      setStart("");
      setEnd("");
    }
  }

  // Step 1: find the booking
  if (!found) {
    return (
      <form onSubmit={onFind} className="max-w-xl bg-white p-6 sm:p-10">
        <p className="lux-label text-clay">Find your booking</p>
        <div className="mt-6 grid gap-5">
          <div>
            <label htmlFor="m-ref" className="label">
              Booking number
            </label>
            <input
              id="m-ref"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. BK-ABC123DEF4"
              autoComplete="off"
              className="field uppercase"
            />
          </div>
          <div>
            <label htmlFor="m-email" className="label">
              Email you booked with
            </label>
            <input
              id="m-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="field"
            />
          </div>
        </div>
        {error && (
          <p
            className="mt-5 border border-clay bg-clay/10 px-4 py-3 text-sm text-clay-dark"
            role="alert"
          >
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn btn-primary mt-8">
          {busy ? "Looking…" : "Find my booking"}
        </button>
        <p className="mt-4 text-xs text-muted">
          Your booking number is in your confirmation email.
        </p>
      </form>
    );
  }

  const b = found.booking;
  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="bg-white p-6 sm:p-10">
        <p className="lux-label text-clay">Booking {b.reference}</p>
        <h2 className="mt-3 font-display text-4xl">
          {b.status === "cancelled" ? (
            <>
              Cancelled. <em>We hope to see you another time.</em>
            </>
          ) : (
            <>
              {b.first_name}, <em>your stay.</em>
            </>
          )}
        </h2>

        {notice && (
          <p
            className="mt-5 bg-pine/10 px-4 py-3 text-sm text-pine"
            role="status"
          >
            {notice}
          </p>
        )}

        <dl className="mt-6 grid gap-px overflow-hidden rounded-md border border-line bg-line text-sm sm:grid-cols-2">
          {[
            ["Pickup", longDate(b.start_date)],
            ["Return", longDate(b.end_date)],
            ["Campground", b.park?.name ?? "Not chosen yet"],
            ["Nights", String(b.days)],
          ].map(([k, v]) => (
            <div key={k} className="bg-white px-4 py-3">
              <dt className="label !mb-1">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        {b.status === "confirmed" && found.can_change && mode === "view" && (
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMode("change")}
              className="btn btn-primary"
            >
              Change dates
            </button>
            <button
              type="button"
              onClick={() => setMode("cancel")}
              className="btn btn-outline"
            >
              Cancel booking
            </button>
          </div>
        )}

        {mode === "change" && (
          <div className="mt-8 border-t border-line pt-6">
            <p className="font-display text-2xl">Choose your new dates</p>
            <p className="mt-1 text-sm text-muted">
              Same campground, extras and transport. The new price is worked out
              for you; the deposit you paid stays and any difference is settled
              at pickup.
            </p>
            <div className="relative mt-4 rounded-md border border-line px-4 py-3.5 hover:border-pine">
              <span className="label !mb-1">New pickup and return</span>
              <DateRangeField
                camperSlug={b.camper.slug}
                minNights={2}
                start={start}
                end={end}
                onChange={(s, e) => {
                  setStart(s);
                  setEnd(e);
                }}
                ignore={{ start: b.start_date, end: b.end_date }}
                className="!text-base"
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!start || !end || busy}
                onClick={onChange}
                className="btn btn-primary"
              >
                {busy ? "Saving…" : "Confirm new dates"}
              </button>
              <button
                type="button"
                onClick={() => setMode("view")}
                className="btn btn-outline"
              >
                Keep my dates
              </button>
            </div>
          </div>
        )}

        {mode === "cancel" && (
          <div className="mt-8 border-t border-line pt-6">
            <p className="font-display text-2xl">Cancel this booking?</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your dates will be released and your deposit of{" "}
              {money(b.deposit_due)} refunded to your card. This can&apos;t be
              undone.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={onCancel}
                className="btn btn-dark"
              >
                {busy ? "Cancelling…" : "Yes, cancel my booking"}
              </button>
              <button
                type="button"
                onClick={() => setMode("view")}
                className="btn btn-outline"
              >
                Keep my booking
              </button>
            </div>
          </div>
        )}

        {b.status === "confirmed" && !found.can_change && (
          <p className="mt-8 rounded-md bg-sand px-4 py-3 text-sm leading-relaxed text-bark">
            Free cancellation and date changes ended 24 hours before pickup.{" "}
            <Link href="/contact" className="underline">
              Contact us
            </Link>{" "}
            and we&apos;ll see what we can do.
          </p>
        )}
        {(b.status === "pending" || b.status === "completed") && (
          <p className="mt-8 text-sm text-muted">
            This booking is {b.status}, so it can&apos;t be changed online.{" "}
            <Link href="/contact" className="underline">
              Contact us
            </Link>{" "}
            if you need help.
          </p>
        )}

        {error && (
          <p
            className="mt-5 border border-clay bg-clay/10 px-4 py-3 text-sm text-clay-dark"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>

      <aside className="self-start bg-white p-6 sm:p-8">
        <p className="lux-label text-clay">Your price</p>
        {b.status === "cancelled" ? (
          <p className="mt-4 text-sm leading-relaxed">
            Your deposit of <strong>{money(b.deposit_due)}</strong> is being
            refunded to your card. Nothing more is due.
          </p>
        ) : (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Rental total</dt>
              <dd>{money(b.total_price)}</dd>
            </div>
            <div className="flex justify-between text-pine">
              <dt>Deposit paid</dt>
              <dd className="font-semibold">{money(b.deposit_due)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 font-semibold">
              <dt>Balance due at pickup</dt>
              <dd>{money(b.balance_due)}</dd>
            </div>
          </dl>
        )}
        {b.status === "confirmed" && (
          <p className="mt-5 text-xs leading-relaxed text-muted">
            Free cancellation and date changes until{" "}
            {longDate(b.free_change_until)} (24 hours before pickup).
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setFound(null);
            setNotice("");
            setError("");
          }}
          className="tap mt-6 text-xs text-muted underline"
        >
          Look up a different booking
        </button>
      </aside>
    </div>
  );
}
