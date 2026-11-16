import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import ManageBooking from "./ManageBooking";

export const metadata: Metadata = {
  title: "Manage your booking",
  description: "Cancel or change the dates of your booking, free of charge up to 24 hours before pickup.",
  robots: { index: false },
};

export default function ManageBookingPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pb-16">
        <p className="lux-label text-clay">Your booking</p>
        <h1 className="mt-3 font-display text-5xl leading-[1] sm:text-6xl">
          Manage <em>your stay.</em>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Cancel or change your dates free of charge up to 24 hours before pickup.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="h-80 animate-pulse bg-sand/60" />}>
            <ManageBooking />
          </Suspense>
        </div>
      </main>
    </>
  );
}
