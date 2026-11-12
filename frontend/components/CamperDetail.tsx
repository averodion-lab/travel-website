import { Suspense } from "react";
import Image from "next/image";
import BookingWidget from "@/components/BookingWidget";
import Gallery from "@/components/Gallery";
import MobileBookBar from "@/components/MobileBookBar";
import type { Camper } from "@/lib/api";
import { rate } from "@/lib/format";
import { getParks } from "@/lib/parks";

function Spec({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[13rem_1fr] sm:gap-6">
      <dt className="eyebrow pt-0.5 text-bark">{label}</dt>
      <dd className="text-sm leading-relaxed">{value}</dd>
    </div>
  );
}

/** Everything on a trailer's page: gallery, specs, calendar and floor plan. */
/** The calendar, with the campgrounds and extras it offers. */
async function Widget({ camper }: { camper: Camper }) {
  const data = await getParks();
  return (
    <BookingWidget
      camper={camper}
      parks={data?.parks}
      addons={data?.addons}
      transport={data?.transport}
    />
  );
}

export default function CamperDetail({ camper }: { camper: Camper }) {
  const all = camper.gallery.length
    ? camper.gallery
    : camper.image_url
      ? [camper.image_url]
      : [];
  // A gallery file named "floorplan" gets its own section instead of a spot in the photo grid.
  const floorplan = all.find((src) => src.includes("floorplan"));
  const photos = all.filter((src) => src !== floorplan);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-clay">{camper.class_type}</p>
          <h1 className="mt-3 font-display text-6xl leading-none sm:text-8xl">
            {camper.name}
          </h1>
          {camper.tagline && (
            <p className="mt-4 max-w-2xl font-display text-2xl italic text-bark">
              {camper.tagline}
            </p>
          )}
        </div>
        <div className="flex items-center gap-6">
          <p>
            <span className="font-display text-4xl">
              {rate(camper.daily_rate)}
            </span>
            <span className="text-sm text-muted"> / night</span>
          </p>
          <a href="#book" className="btn btn-primary">
            Check availability
          </a>
        </div>
      </div>

      <div className="mt-10">
        <Gallery photos={photos} name={camper.name} />
      </div>

      <div className="mt-10 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
        {[
          ["Sleeps", String(camper.sleeps)],
          [
            "Length",
            camper.length_ft ? `${Math.round(camper.length_ft)} ft` : "—",
          ],
          [
            "Dry weight",
            camper.towing_weight_lbs
              ? `${camper.towing_weight_lbs.toLocaleString()} lbs`
              : "Drivable",
          ],
          ["Minimum", `${camper.min_nights} nights`],
        ].map(([label, value]) => (
          <div key={label} className="bg-cream px-5 py-5">
            <p className="eyebrow text-muted">{label}</p>
            <p className="mt-2 font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>

      <section id="book" className="mt-12 scroll-mt-28">
        <p className="eyebrow text-clay">Availability</p>
        <h2 className="mt-3 font-display text-5xl">Pick your dates.</h2>
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="h-[34rem] animate-pulse border border-line bg-sand/60" />
            }
          >
            <Widget camper={camper} />
          </Suspense>
        </div>
      </section>

      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        <div>
          {camper.description && (
            <section>
              <h2 className="font-display text-4xl">About this trailer</h2>
              <p className="mt-5 leading-relaxed text-bark">
                {camper.description}
              </p>
            </section>
          )}

          <section className="mt-12">
            <h2 className="font-display text-4xl">Specifications</h2>
            <dl className="mt-5 divide-y divide-line border-y border-line">
              <Spec label="Layout" value={camper.layout} />
              <Spec label="Class" value={camper.class_type} />
              <Spec
                label="Length"
                value={camper.length_ft ? `${camper.length_ft} ft` : null}
              />
              <Spec
                label="Dry weight"
                value={
                  camper.towing_weight_lbs
                    ? `${camper.towing_weight_lbs.toLocaleString()} lbs`
                    : "Not towed (drivable)"
                }
              />
              <Spec label="Towing" value={camper.hitch_type} />
              <Spec label="Hookups" value={camper.hookups} />
            </dl>
          </section>
        </div>

        <div>
          {camper.amenities.length > 0 && (
            <section>
              <h2 className="font-display text-4xl">What&apos;s included</h2>
              <ul className="mt-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                {camper.amenities.map((a) => (
                  <li key={a} className="flex items-start gap-3">
                    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {floorplan && (
            <section className="mt-12">
              <h2 className="font-display text-4xl">Floor plan</h2>
              <div className="mt-6 border border-line bg-white p-3">
                <Image
                  src={floorplan}
                  alt={`${camper.name} floor plan`}
                  width={2000}
                  height={1500}
                  sizes="(min-width:1024px) 50vw, 100vw"
                  className="h-auto w-full"
                />
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="mt-14 text-center">
        <a href="#book" className="btn btn-primary">
          Check availability
        </a>
      </div>

      <MobileBookBar price={rate(camper.daily_rate)} />
    </>
  );
}
