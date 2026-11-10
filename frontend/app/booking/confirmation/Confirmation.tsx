"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, type PublicBooking } from "@/lib/api";
import { longDate, money } from "@/lib/format";

const MAX_POLLS = 15; // ~30 seconds while Stripe tells us the payment went through

export default function Confirmation() {
  const ref = useSearchParams().get("ref") ?? "";
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [error, setError] = useState("");
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (!ref) return;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    api<{ booking: PublicBooking }>(`/api/bookings/${encodeURIComponent(ref)}`)
      .then(({ booking }) => {
        if (cancelled) return;
        setBooking(booking);
        if (booking.status === "pending" && polls < MAX_POLLS) {
          timer = setTimeout(() => setPolls((n) => n + 1), 2000);
        }
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ref, polls]);

  if (!ref || error) {
    return (
      <Panel>
        <h1 className="font-display text-5xl">We couldn&apos;t find that booking.</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          {error || "The link is missing a booking number."} If you just paid, check your email for the confirmation.
        </p>
        <Link href="/fleet" className="btn btn-primary mt-8">See the trailer</Link>
      </Panel>
    );
  }
  if (!booking) return <div className="h-[32rem] animate-pulse bg-sand/60" />;

  if (booking.status === "pending") {
    const waiting = polls < MAX_POLLS;
    return (
      <Panel>
        <p className="eyebrow text-clay">Booking {booking.reference}</p>
        <h1 className="mt-4 font-display text-5xl">{waiting ? "Confirming your payment…" : "Payment not received yet."}</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          {waiting
            ? "This usually takes a few seconds. Please keep this page open."
            : "If you completed payment, your confirmation email will arrive shortly. If you didn't finish checkout, your dates are released after a short hold and you can book again."}
        </p>
      </Panel>
    );
  }

  if (booking.status === "cancelled") {
    return (
      <Panel>
        <p className="eyebrow text-clay">Booking {booking.reference}</p>
        <h1 className="mt-4 font-display text-5xl">This booking was cancelled.</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">The dates were not held. You can start a new booking any time.</p>
        <Link href={`/fleet/${booking.camper.slug}`} className="btn btn-primary mt-8">Book again</Link>
      </Panel>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <p className="eyebrow text-pine">Booking confirmed</p>
        <h1 className="mt-4 font-display text-6xl leading-none sm:text-7xl">
          You&apos;re all set,
          <span className="block italic">{booking.first_name}.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-muted">
          A confirmation email is on its way. We&apos;ll be in touch before your trip with pickup instructions.
        </p>
      </div>

      <div className="mt-12 border border-line bg-white/70">
        {booking.camper.image_url && (
          <div className="relative aspect-[5/2]">
            <Image src={booking.camper.image_url} alt={booking.camper.name} fill sizes="48rem" className="object-cover" />
          </div>
        )}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-display text-4xl">{booking.camper.name}</p>
            <p className="eyebrow text-bark">Booking no. {booking.reference}</p>
          </div>
          <dl className="mt-6 grid gap-px bg-line text-sm sm:grid-cols-3">
            <div className="bg-cream px-4 py-4">
              <dt className="label !mb-1">Pickup</dt>
              <dd>{longDate(booking.start_date)}</dd>
            </div>
            <div className="bg-cream px-4 py-4">
              <dt className="label !mb-1">Return</dt>
              <dd>{longDate(booking.end_date)}</dd>
            </div>
            <div className="bg-cream px-4 py-4">
              <dt className="label !mb-1">Length</dt>
              <dd>{booking.days} nights</dd>
            </div>
          </dl>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Rental total</dt>
              <dd>{money(booking.total_price)}</dd>
            </div>
            <div className="flex justify-between text-pine">
              <dt>Deposit paid</dt>
              <dd className="font-semibold">{money(booking.deposit_due)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 font-semibold">
              <dt>Balance due at pickup</dt>
              <dd>{money(booking.balance_due)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            A refundable {money(booking.security_deposit)} security deposit is held at pickup. Bring the driver&apos;s
            license you uploaded.
          </p>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link href="/" className="btn btn-outline">Back to home</Link>
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-2xl border border-line bg-white/60 px-6 py-16 text-center">{children}</div>;
}
