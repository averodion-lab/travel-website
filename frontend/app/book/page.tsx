import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import BookingForm from "./BookingForm";

export const metadata: Metadata = { title: "Complete your booking", robots: { index: false } };

export default function BookPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-8 sm:pb-16 sm:pt-14">
        <p className="eyebrow text-clay">Checkout</p>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl">Complete your booking.</h1>
        <div className="mt-12">
          <Suspense fallback={<div className="h-[40rem] animate-pulse bg-sand/60" />}>
            <BookingForm />
          </Suspense>
        </div>
      </main>
    </>
  );
}
