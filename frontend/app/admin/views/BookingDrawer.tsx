"use client";

import { useEffect, useState, type FormEvent } from "react";
import { money, longDate } from "@/lib/format";
import { StatusPill, pillStatus, type Detail } from "../types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words text-right">{value || "—"}</dd>
    </div>
  );
}

/** Phone bookings: the owner records what the guest has paid so far. */
function PaidSoFar({ booking, onAmountPaid }: { booking: Detail; onAmountPaid: (id: number, amount: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    await onAmountPaid(booking.id, String(new FormData(event.currentTarget).get("amount") ?? "0"));
    setBusy(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <Row
        label="Paid so far"
        value={
          <span>
            {money(booking.deposit_due)}{" "}
            {booking.status === "confirmed" && (
              <button type="button" onClick={() => setEditing(true)} className="tap ml-2 text-clay-dark underline">Change</button>
            )}
          </span>
        }
      />
    );
  }
  return (
    <form onSubmit={submit} className="flex items-center justify-between gap-3 py-2.5">
      <label htmlFor="paid-so-far" className="text-muted">Paid so far ($)</label>
      <span className="flex items-center gap-2">
        <input id="paid-so-far" name="amount" type="number" min="0" step="0.01" max={booking.total_price} defaultValue={booking.deposit_due} className="w-28 border border-line bg-white px-2 py-1 text-right" autoFocus />
        <button type="submit" disabled={busy} className="btn btn-dark !px-3 !py-1">Save</button>
      </span>
    </form>
  );
}

/** Slide-over with everything about one booking, including the customer's contact details. */
export default function BookingDrawer({
  booking,
  onClose,
  onStatus,
  onLicense,
  onAmountPaid,
}: {
  booking: Detail;
  onClose: () => void;
  onStatus: (id: number, next: "completed" | "cancelled", kind: Detail["kind"]) => void;
  onLicense: (id: number) => void;
  onAmountPaid: (id: number, amount: string) => Promise<void>;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const c = booking.customer;
  const isBlock = booking.kind === "block";
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Booking ${booking.reference}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
      <aside className="drawer-in relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-cream shadow-2xl">
        <div className="bg-pine-dark px-7 pb-7 pt-6 text-cream">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-cream/70">{booking.reference}</p>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/30 text-lg hover:bg-cream hover:text-ink" aria-label="Close">×</button>
          </div>
          <p className="mt-5 font-display text-4xl leading-none">{isBlock ? "Blocked dates" : booking.customer_name}</p>
          <div className="mt-4 flex items-center gap-3">
            <StatusPill status={pillStatus(booking)} />
            {booking.kind === "phone" && <span className="text-xs text-cream/70">Taken by phone</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-line text-sm">
          <div className="bg-white px-7 py-4">
            <p className="label !mb-1">{isBlock ? "First night" : "Pickup"}</p>
            <p>{longDate(booking.start_date)}</p>
          </div>
          <div className="bg-white px-7 py-4">
            <p className="label !mb-1">{isBlock ? "Free again on" : "Return"}</p>
            <p>{longDate(booking.end_date)}</p>
          </div>
        </div>

        <div className="flex-1 space-y-7 px-7 py-7 text-sm">
          {booking.note && (
            <section>
              <h3 className="eyebrow text-clay">Your note</h3>
              <p className="mt-2 whitespace-pre-line">{booking.note}</p>
            </section>
          )}
          {isBlock && (
            <p className="text-muted">
              {booking.days} {booking.days === 1 ? "night" : "nights"} kept for you. Guests see these dates as taken.
            </p>
          )}
          {c && (
          <section>
            <h3 className="eyebrow text-clay">Contact</h3>
            <dl className="mt-2 divide-y divide-line/70">
              <Row label="Email" value={c.email && <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>} />
              <Row label="Phone" value={c.phone && <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a>} />
              <Row label="Address" value={c.address} />
              <Row label="License no." value={c.license_purged ? "Deleted (retention period ended)" : c.license_number} />
            </dl>
          </section>
          )}

          {!isBlock && (
          <>
          <section>
            <h3 className="eyebrow text-clay">Trip</h3>
            <dl className="mt-2 divide-y divide-line/70">
              <Row
                label="Campground"
                value={
                  booking.place
                    ? `${booking.place.name} (typed in by the guest)`
                    : booking.park
                      ? `${booking.park.name}${booking.park.state ? `, ${booking.park.state}` : ""}`
                      : "Not chosen (confirm with customer)"
                }
              />
              {booking.place && (
                <Row
                  label="Map"
                  value={
                    <a
                      href={`https://www.google.com/maps?q=${booking.place.lat},${booking.place.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-clay underline"
                    >
                      Open on the map ↗
                    </a>
                  }
                />
              )}
              {booking.addons.length === 0 && <Row label="Extras" value="None" />}
              {booking.addons.map((a) => (
                <Row key={a.code} label={`${a.name}, ${a.days} days`} value={money(a.total)} />
              ))}
              {booking.transport && (
                <Row
                  label={
                    booking.transport.code === "delivery"
                      ? `Getting there: delivery and setup${booking.transport.miles ? `, ${booking.transport.miles} mi from base` : ""}`
                      : booking.transport.code === "truck"
                        ? `Getting there: renting our truck${booking.towing_experience ? " (towing experience confirmed)" : ""}`
                        : "Getting there: customer tows it"
                  }
                  value={booking.transport.code === "self" ? "Own truck" : money(booking.transport.total)}
                />
              )}
            </dl>
          </section>

          <section>
            <h3 className="eyebrow text-clay">Money</h3>
            <dl className="mt-2 divide-y divide-line/70">
              <Row label={`Total, ${booking.days} nights${booking.addons.length ? " + extras" : ""}`} value={money(booking.total_price)} />
              {booking.kind === "phone" ? (
                <PaidSoFar key={booking.deposit_due} booking={booking} onAmountPaid={onAmountPaid} />
              ) : (
                <Row label="Deposit paid" value={booking.status === "pending" ? "Not yet" : money(booking.deposit_due)} />
              )}
              {booking.free_change_until && booking.kind === "guest" && <Row label="Free date changes until" value={booking.free_change_until} />}
              {booking.refunded_amount != null && <Row label="Refunded on cancelling" value={`$${booking.refunded_amount}`} />}
              <Row label="Due at pickup" value={<span className="font-semibold">{money(booking.balance_due)}</span>} />
              <Row label="Security hold" value={money(booking.security_deposit)} />
              <Row label="Emails sent" value={booking.emails_sent ? "Yes" : "No"} />
            </dl>
          </section>
          </>
          )}
        </div>

        <div className="space-y-2 border-t border-line bg-white px-7 py-5">
          {c?.has_license_file && (
            <button type="button" onClick={() => onLicense(booking.id)} className="btn btn-outline w-full">View license photo</button>
          )}
          {booking.status === "confirmed" && !isBlock && (
            <button type="button" onClick={() => onStatus(booking.id, "completed", booking.kind)} className="btn btn-dark w-full">Mark returned &amp; inspected</button>
          )}
          {(booking.status === "confirmed" || booking.status === "pending") && (
            <button type="button" onClick={() => onStatus(booking.id, "cancelled", booking.kind)} className="btn w-full text-clay-dark hover:underline">
              {isBlock ? "Remove block (open these dates)" : "Cancel booking"}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
