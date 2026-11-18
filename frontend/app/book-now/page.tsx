import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import MapAndBooking from "@/components/MapAndBooking";
import { getParks } from "@/lib/parks";
import { OG, pageMeta } from "@/lib/seo";
import { getTrailer } from "@/lib/trailer";

export const metadata: Metadata = pageMeta({
  title: "Book the Luxury Fifth Wheel Online",
  description:
    "Choose a campground on the map, pick your dates and add extras. See the exact price, pay a deposit by card and get your confirmation by email.",
  path: "/book-now",
  image: OG.campfire,
});

async function Planner() {
  const [trailer, data] = await Promise.all([getTrailer(), getParks()]);
  if (!trailer || !data) {
    return (
      <p className="rounded-2xl bg-white p-8 text-center text-muted">
        Booking is loading slowly right now. Please refresh in a moment.
      </p>
    );
  }
  return (
    <MapAndBooking
      camper={trailer}
      parks={data.parks}
      addons={data.addons}
      transport={data.transport}
      heading={false}
    />
  );
}

export default function BookNowPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-8 sm:pb-16">
        <p className="eyebrow text-clay">Book now</p>
        <h1 className="mt-3 font-display text-6xl leading-[0.9] sm:text-7xl">
          Plan your trip
        </h1>
        <p className="script -mt-1 text-5xl sm:text-6xl">in four steps</p>
        <ul className="mt-4 max-w-xl list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted marker:text-clay">
          <li>Tap a pin or pick a campground below.</li>
          <li>Change or cancel online.</li>
          <li>Free cancellation within 24 hours of payment.</li>
        </ul>
        <div className="mt-10">
          <Suspense
            fallback={
              <div className="h-[40rem] animate-pulse rounded-[2rem] bg-sand/60" />
            }
          >
            <Planner />
          </Suspense>
        </div>
      </main>
    </>
  );
}
