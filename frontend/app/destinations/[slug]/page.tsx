import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddonIcon from "@/components/AddonIcon";
import BookCta from "@/components/BookCta";
import GearIcon from "@/components/GearIcon";
import Header from "@/components/Header";
import JsonLd from "@/components/JsonLd";
import PageHero from "@/components/PageHero";
import type { Park, ParksResponse } from "@/lib/api";
import { rate } from "@/lib/format";
import { SITE_NEEDS, getParks, parkHero, rampWhere, terrainLabel } from "@/lib/parks";
import { PREVIEW_PARKS, PREVIEW_TRAILER } from "@/lib/preview";
import { OG, SITE_URL, pageMeta } from "@/lib/seo";
import { getTrailer } from "@/lib/trailer";

/** One page per campground, so each one can be found by name: where it is,
 *  what delivery costs there, what can be added and how to book. */

async function load(slug: string): Promise<{ park: Park; data: ParksResponse } | null> {
  const data = await getParks();
  const park = data?.parks.find((p) => p.slug === slug);
  return data && park ? { park, data } : null;
}

export async function generateStaticParams() {
  try {
    const data = await getParks();
    if (data?.parks.length) return data.parks.map((p) => ({ slug: p.slug }));
  } catch {
    // API not running during the build: fall back to the built-in list.
  }
  return PREVIEW_PARKS.parks.map((p) => ({ slug: p.slug }));
}

/** "$414" for delivery to this park ("$413.50" when not whole). */
function deliveryPrice(park: Park, data: ParksResponse) {
  const total = Number(data.transport.delivery.per_mile) * park.delivery_miles * data.transport.delivery.trips;
  return rate(total);
}

/** "Vogel State Park RV Rental", or "… RV Park Rental" when the name already says RV. */
function parkTitle(park: Park) {
  return /\bRV\b/.test(park.name) ? `${park.name} Rental` : `${park.name} RV Rental`;
}

// From the built-in park list (kept in sync with catalog.py), so the metadata
// needs no request and is written into <head> at build time.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const park = PREVIEW_PARKS.parks.find((p) => p.slug === slug);
  if (!park) return { title: "Campground", robots: { index: false } };
  const data = PREVIEW_PARKS;
  const extras = park.addons.filter((a) => a.code !== "atv").map((a) => a.name.toLowerCase());
  const extraText = extras.length ? ` Add ${extras.length > 1 ? extras.slice(0, -1).join(", ") + " or " + extras.at(-1) : extras[0]}.` : "";
  const base = `We deliver and set up a luxury 40 ft fifth wheel at ${park.name} in ${park.city}, ${park.state}: ${deliveryPrice(park, data)} one way from Canton, GA.`;
  return pageMeta({
    title: parkTitle(park),
    // Under 155 characters: the extras sentence only when it fits.
    description: base.length + extraText.length <= 155 ? base + extraText : base,
    path: `/destinations/${park.slug}`,
    image: park.terrain.includes("lake") ? OG.lake : OG.mountains,
  });
}

async function Details({ slug }: { slug: string }) {
  const [found, trailer] = await Promise.all([load(slug), getTrailer()]);
  if (!found) notFound();
  const { park, data } = found;
  const t = trailer ?? PREVIEW_TRAILER;
  const delivery = deliveryPrice(park, data);
  const truck = data.transport.truck;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${park.lat},${park.lng}`;
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Destinations", item: `${SITE_URL}/destinations` },
      { "@type": "ListItem", position: 3, name: park.name, item: `${SITE_URL}/destinations/${park.slug}` },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <nav aria-label="Breadcrumb" className="eyebrow text-muted">
        <Link href="/" className="tap hover:text-clay">Home</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/destinations" className="tap hover:text-clay">Destinations</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{park.name}</span>
      </nav>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
        <div className="min-w-0 space-y-12">
          <section>
            <h2 className="font-display text-4xl">The park</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-bark">{park.description}</p>
            <p className="mt-4 max-w-2xl leading-relaxed text-bark">
              {park.name} is in {park.city}, {park.state}, {park.delivery_miles} road miles from our base in{" "}
              {data.transport.base}. {terrainLabel(park)}.
            </p>
            <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
              <a href={park.url} target="_blank" rel="noopener noreferrer" className="tap eyebrow text-clay hover:underline">
                Park website ↗
              </a>
              <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="tap eyebrow text-clay hover:underline">
                Open in Google Maps ↗
              </a>
              <Link href="/destinations" className="tap eyebrow text-pine hover:underline">
                See it on our map
              </Link>
            </p>
          </section>

          <section>
            <h2 className="font-display text-4xl">Getting the trailer there</h2>
            <dl className="mt-5 divide-y divide-line border-y border-line">
              {[
                [
                  "We deliver and set it up",
                  `${delivery} one way (${rate(data.transport.delivery.per_mile)} a mile × ${park.delivery_miles} miles). We bring the trailer to your campsite, level it and hook everything up, and collect it after your trip at no charge.`,
                ],
                ["Tow it with your own truck", "Free. You need a fifth-wheel hitch and a truck weighing at least 6,000 lb, plus experience towing a large trailer."],
                ["Rent our truck", `${rate(truck.daily_rate)} a day. ${truck.description}`],
              ].map(([title, text]) => (
                <div key={title} className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr] sm:gap-6">
                  <dt className="font-display text-2xl text-ink">{title}</dt>
                  <dd className="text-sm leading-relaxed text-bark">{text}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="font-display text-4xl">What you can add here</h2>
            {park.addons.some((a) => a.code !== "atv") ? (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {park.addons.filter((a) => a.code !== "atv").map((a) => (
                  <li key={a.code} className="flex items-start gap-4 rounded-md bg-white p-4">
                    <AddonIcon code={a.code} size={48} />
                    <div className="text-sm">
                      <p className="font-display text-2xl text-ink">
                        {a.name} <span className="font-sans text-sm text-muted">· {rate(a.daily_rate)}/day{a.max_qty > 1 ? " each" : ""}</span>
                      </p>
                      <p className="mt-1 leading-relaxed text-bark">{a.description}</p>
                      {a.gear && <GearIcon gear={a.gear} className="mt-1" />}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-bark">No motorized extras here; e-bikes and the rest of the trailer are the same everywhere.</p>
            )}
            {park.ramp && (
              <p className="mt-4 rounded-md bg-[#eef4f6] px-4 py-3 text-sm leading-relaxed text-[#24414c]">
                <strong className="font-semibold">Jet ski launch: {park.ramp.name}.</strong> {rampWhere(park.ramp)}.{" "}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${park.ramp.lat},${park.ramp.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap underline"
                >
                  Directions ↗
                </a>
              </p>
            )}
          </section>

          <section>
            <h2 className="font-display text-4xl">Your campsite</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-bark">
              Reserve your site with the park directly (its website is above), then book the trailer with us. The site needs:
            </p>
            <dl className="mt-4 divide-y divide-line border-y border-line">
              {SITE_NEEDS.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-3 sm:grid-cols-[14rem_1fr] sm:gap-6">
                  <dt className="eyebrow pt-0.5 text-bark">{k}</dt>
                  <dd className="text-sm leading-relaxed">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="min-w-0 self-start rounded-md bg-white p-6 sm:p-8 lg:sticky lg:top-28">
          <p className="lux-label text-clay">Book the trailer here</p>
          <p className="mt-3 font-display text-3xl leading-tight">
            {park.name}, <em>prepared for you.</em>
          </p>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Trailer</dt>
              <dd>
                {rate(t.daily_rate)} a night, {t.min_nights}-night minimum
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Delivery and setup</dt>
              <dd>{delivery} one way</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Pick-up afterwards</dt>
              <dd>Free</dd>
            </div>
          </dl>
          <Link href={`/book-now?park=${park.slug}`} className="btn btn-primary mt-6 w-full">
            Choose dates and book →
          </Link>
          <p className="mt-3 text-center text-xs text-muted">Free cancellation within 24 hours of payment.</p>
        </aside>
      </div>
    </>
  );
}

/** Everything that depends on which park it is, inside the Suspense boundary
 *  (reading the URL during prerendering must happen there). */
async function ParkBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const park = PREVIEW_PARKS.parks.find((p) => p.slug === slug);
  return (
    <>
      <PageHero
        image={parkHero(park?.terrain ?? [])}
        eyebrow={park ? `${park.city}, ${park.state}` : "Campground"}
        title={park?.name ?? "Campground"}
        accent="with the trailer waiting"
      />
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <Details slug={slug} />
      </main>
      <BookCta image={park?.terrain.includes("lake") ? "/images/lake-forest.jpg" : "/images/campfire-night.jpg"} />
    </>
  );
}

export default function ParkPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <>
      <Header overlay />
      <Suspense fallback={<div className="min-h-[32rem] animate-pulse bg-sand/60 sm:min-h-[34rem]" />}>
        <ParkBody params={params} />
      </Suspense>
    </>
  );
}
