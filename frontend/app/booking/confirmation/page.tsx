import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Confirmation from "./Confirmation";

export const metadata: Metadata = { title: "Booking confirmation", robots: { index: false } };

export default function ConfirmationPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 pb-28 pt-16 sm:px-8">
        <Suspense fallback={<div className="h-[32rem] animate-pulse bg-sand/60" />}>
          <Confirmation />
        </Suspense>
      </main>
    </>
  );
}
