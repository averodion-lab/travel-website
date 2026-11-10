"use client";

import { useEffect } from "react";
import { money, longDate } from "@/lib/format";
import { StatusPill, type Detail } from "../types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words text-right">{value || "—"}</dd>
    </div>
  );
}

/** Slide-over with everything about one booking, including the customer's contact details. */
export default function BookingDrawer({
  booking,
  onClose,
  onStatus,
  onLicense,
}: {
  booking: Detail;
  onClose: () => void;
  onStatus: (id: number, next: "completed" | "cancelled") => void;
  onLicense: (id: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const c = booking.customer;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Booking ${booking.reference}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
      <aside className="drawer-in relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-cream shadow-2xl">
        <div className="bg-pine-dark px-7 pb-7 pt-6 text-cream">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-cream/70">{booking.reference}</p>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/30 text-lg hover:bg-cream hover:text-ink" aria-label="Close">×</button>
          </div>
          <p className="mt-5 font-display text-4xl leading-none">{booking.customer_name}</p>
          <div className="mt-4"><StatusPill status={booking.status} /></div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-line text-sm">
          <div className="bg-white px-7 py-4">
            <p className="label !mb-1">Pickup</p>
            <p>{longDate(booking.start_date)}</p>
          </div>
          <div className="bg-white px-7 py-4">
            <p className="label !mb-1">Return</p>
            <p>{longDate(booking.end_date)}</p>
          </div>
        </div>

        <div className="flex-1 space-y-7 px-7 py-7 text-sm">
          <section>
            <h3 className="eyebrow text-clay">Contact</h3>
            <dl className="mt-2 divide-y divide-line/70">
              <Row label="Email" value={c.email && <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>} />
              <Row label="Phone" value={c.phone && <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a>} />
              <Row label="Address" value={c.address} />
              <Row label="License no." value={c.license_purged ? "Deleted (retention period ended)" : c.license_number} />
            </dl>
          </section>

          <section>
            <h3 className="eyebrow text-clay">Money</h3>
            <dl className="mt-2 divide-y divide-line/70">
              <Row label={`${booking.days} nights`} value={money(booking.total_price)} />
              <Row label="Deposit paid" value={booking.status === "pending" ? "Not yet" : money(booking.deposit_due)} />
              <Row label="Due at pickup" value={<span className="font-semibold">{money(booking.balance_due)}</span>} />
              <Row label="Security hold" value={money(booking.security_deposit)} />
              <Row label="Emails sent" value={booking.emails_sent ? "Yes" : "No"} />
            </dl>
          </section>
        </div>

        <div className="space-y-2 border-t border-line bg-white px-7 py-5">
          {c.has_license_file && (
            <button type="button" onClick={() => onLicense(booking.id)} className="btn btn-outline w-full">View license photo</button>
          )}
          {booking.status === "confirmed" && (
            <button type="button" onClick={() => onStatus(booking.id, "completed")} className="btn btn-dark w-full">Mark returned &amp; inspected</button>
          )}
          {(booking.status === "confirmed" || booking.status === "pending") && (
            <button type="button" onClick={() => onStatus(booking.id, "cancelled")} className="btn w-full text-clay-dark hover:underline">Cancel booking</button>
          )}
        </div>
      </aside>
    </div>
  );
}
