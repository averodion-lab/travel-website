import { Suspense } from "react";
import type { Metadata } from "next";
import BookCta from "@/components/BookCta";
import Gallery from "@/components/Gallery";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { getTrailer } from "@/lib/trailer";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photos of the trailer inside and out: living room, kitchen, king bedroom and bathroom.",
};

async function Photos() {
  const trailer = await getTrailer();
  if (!trailer)
    return (
      <p className="text-center text-muted">
        The photos are loading slowly right now. Please refresh in a moment.
      </p>
    );
  const photos = trailer.gallery.filter((src) => !src.includes("floorplan"));
  return <Gallery photos={photos} name={trailer.name} layout="slideshow" />;
}

export default function GalleryPage() {
  return (
    <>
      <Header overlay />
      <PageHero
        seed={5}
        image="/images/montana/living-1.jpg"
        eyebrow="Gallery"
        title="Step inside"
        accent="take a look around"
      />
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-14">
        <p className="mb-8 text-center text-sm text-muted">
          Slide left and right to see every photo. Tap one to see it full
          screen.
        </p>
        <Suspense
          fallback={
            <div className="h-[40rem] animate-pulse rounded-2xl bg-sand/60" />
          }
        >
          <Photos />
        </Suspense>
      </main>
      <BookCta image="/images/blueridge-pink.jpg" />
    </>
  );
}
