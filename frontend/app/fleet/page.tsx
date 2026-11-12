import { Suspense } from "react";
import type { Metadata } from "next";
import CamperCard from "@/components/CamperCard";
import CamperDetail from "@/components/CamperDetail";
import Header from "@/components/Header";
import { api, type Camper } from "@/lib/api";

export const metadata: Metadata = {
  title: "The Trailer",
  description: "See the trailer, check the calendar and book your dates.",
};

/** With a single trailer this page shows it directly (so links like /fleet#book
 *  work on a static host). If more are added later, it lists them. */
async function Fleet() {
  let campers: Camper[] = [];
  try {
    campers = (await api<{ campers: Camper[] }>("/api/campers")).campers;
  } catch (e) {
    return (
      <p className="border border-line bg-white/60 p-8 text-center text-muted">
        {e instanceof Error ? e.message : "Something went wrong."}
      </p>
    );
  }
  if (campers.length === 1) return <CamperDetail camper={campers[0]} />;

  return (
    <>
      <h1 className="font-display text-6xl sm:text-7xl">Choose your camper.</h1>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {campers.map((camper) => (
          <CamperCard key={camper.id} camper={camper} />
        ))}
      </div>
    </>
  );
}

export default function FleetPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-8 sm:pb-16">
        <Suspense fallback={<div className="h-96 animate-pulse border border-line bg-sand/60" />}>
          <Fleet />
        </Suspense>
      </main>
    </>
  );
}
