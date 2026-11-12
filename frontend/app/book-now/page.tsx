import { Suspense } from "react";
import type { Metadata } from "next";
import BookNowForm from "@/components/BookNowForm";
import Header from "@/components/Header";
import { getParks } from "@/lib/parks";
import { getTrailer } from "@/lib/trailer";

export const metadata: Metadata = {
  title: "Book Now",
  description:
    "Pick your campground and dates, add a 4-wheeler or a jet ski, and book the trailer.",
};

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
    <BookNowForm
      camper={trailer}
      parks={data.parks}
      addons={data.addons}
      transport={data.transport}
    />
  );
}

export default function BookNowPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 pb-28 pt-12 sm:px-8">
        <p className="eyebrow text-clay">Book now</p>
        <h1 className="mt-3 font-display text-6xl uppercase leading-[0.9] tracking-tight sm:text-7xl">
          Plan your trip
        </h1>
        <p className="script -mt-1 text-5xl sm:text-6xl">in four steps</p>
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
