import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import AddonIcon from "@/components/AddonIcon";
import GearIcon from "@/components/GearIcon";
import BookCta from "@/components/BookCta";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import ParksMap from "@/components/ParksMap";
import Reveal from "@/components/Reveal";
import { rate } from "@/lib/format";
import { getParks, SITE_NEEDS, STATE_ORDER, terrainLabel } from "@/lib/parks";
import { OG, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Lake and Mountain Campgrounds We Deliver To",
  description:
    "23 RV campgrounds in Georgia, Tennessee, the Carolinas and Alabama, from the Smokies to off-road parks. We deliver the trailer; add a jet ski or e-bikes.",
  path: "/destinations",
  image: OG.lake,
});

async function Parks() {
  const data = await getParks();
  if (!data)
    return (
      <p className="text-muted">
        The campground list is loading slowly right now. Please refresh in a
        moment.
      </p>
    );
  return (
    <>
      <ParksMap parks={data.parks} compact />
      {/* Every park by state, each linking to its own page (readable without the map). */}
      <div className="mt-10">
        <h3 className="font-display text-3xl">All 23, by state</h3>
        <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {STATE_ORDER.filter((s) => data.parks.some((p) => p.state === s)).map((state) => (
            <div key={state}>
              <p className="eyebrow text-clay">{state}</p>
              <ul className="mt-2 space-y-1.5">
                {data.parks
                  .filter((p) => p.state === state)
                  .map((p) => (
                    <li key={p.slug} className="text-sm leading-snug">
                      <Link href={`/destinations/${p.slug}`} className="tap font-medium text-ink underline-offset-2 hover:text-clay hover:underline">
                        {p.name}
                      </Link>
                      <span className="text-muted"> · {p.city} · {terrainLabel(p)}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {/* What to add, depending on where you stay. */}
      <div className="mt-8 grid gap-3">
        <p className="flex items-center gap-4 rounded-2xl bg-white p-5 leading-relaxed text-bark">
          <AddonIcon code="jetski" size={52} />
          <span>
            <strong className="font-semibold text-ink">By the lake?</strong> Add
            a jet ski for a better day on the water.
          </span>
        </p>
      </div>
    </>
  );
}

async function Extras() {
  const data = await getParks();
  const atv = data?.addons.find((a) => a.code === "atv");
  const jetski = data?.addons.find((a) => a.code === "jetski");
  const ebike = data?.addons.find((a) => a.code === "ebike");
  const cards = [
    {
      code: "atv",
      title: "4-wheelers",
      where: "On any trip",
      text: "The 4-wheeler rides along on the trailer, whoever tows it. Check that your campground allows riding.",
      price: atv ? `${rate(atv.daily_rate)} a day` : "",
      gear: atv?.gear ?? "",
      tone: "bg-pine text-cream",
    },
    {
      code: "jetski",
      title: "Jet skis",
      where: "At lake parks",
      text: "Spend the afternoon out on the water. The jet ski rides along on the trailer, ready to launch.",
      price: jetski ? `${rate(jetski.daily_rate)} a day` : "",
      gear: jetski?.gear ?? "",
      tone: "bg-[#2f6f8f] text-cream",
    },
    {
      code: "ebike",
      title: "E-bikes",
      where: "At every campground",
      text: "Electric bikes waiting at the trailer for the trails and the lake path. Add up to three.",
      price: ebike ? `${rate(ebike.daily_rate)} a day each` : "",
      gear: "",
      tone: "bg-[#9c7b4b] text-cream",
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c, i) => (
        <Reveal key={c.title} delay={i * 120}>
          <div
            className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-md p-5 sm:p-8 ${c.tone}`}
          >
            <AddonIcon
              code={c.code}
              size={96}
              className="absolute right-5 top-5 !h-16 !w-16 sm:right-8 sm:top-8 sm:!h-24 sm:!w-24"
            />
            <div className="relative max-w-[70%]">
              <p className="eyebrow opacity-70">{c.where}</p>
              <h3 className="mt-2 font-display text-4xl leading-none sm:mt-3 sm:text-5xl">
                {c.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-85 sm:mt-4">
                {c.text}
              </p>
            </div>
            {c.gear && <GearIcon gear={c.gear} className="relative mt-3 !text-cream/90" />}
            <p className="relative mt-4 font-display text-2xl sm:mt-6 sm:text-3xl">{c.price}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export default function DestinationsPage() {
  return (
    <>
      <Header overlay />
      <PageHero
        seed={31}
        image="/images/smoky-fall.jpg"
        eyebrow="Where to go"
        title="Mountains, lakes"
        accent="and open road"
        text="Twenty-three RV parks across five states, or anywhere else you choose. Tow the trailer there, or we deliver and set it up. Tap a pin to see the park."
      />

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-14">
        <Reveal>
          <p className="eyebrow text-clay">(01) Campgrounds we deliver to</p>
          <h2 className="mt-4 font-display text-5xl leading-[0.95] sm:text-6xl">
            Pick your park
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-bark">
            Tap a pin to see the park and its website, where you reserve your
            campsite. Then book the trailer and we&apos;ll have it waiting when
            you arrive.
          </p>
          {/* Somewhere not on the map: type it in when booking. */}
          <Link
            href="/book-now?park=custom"
            className="mt-6 flex items-center justify-between gap-4 rounded-md border border-ink/80 bg-white px-5 py-4 transition-colors hover:bg-ink hover:text-cream sm:inline-flex sm:justify-start"
          >
            <span>
              <span className="lux-label block text-clay">Or choose your own</span>
              <span className="mt-1 block font-display text-xl sm:text-2xl">Type any campground or place →</span>
            </span>
          </Link>
        </Reveal>
        <div className="mt-10">
          <Suspense
            fallback={
              <div className="h-[34rem] animate-pulse rounded-[1.75rem] bg-sand/60" />
            }
          >
            <Parks />
          </Suspense>
        </div>
      </section>

      <section className="border-y border-line bg-sand/50">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-14">
          <Reveal>
            <p className="eyebrow text-clay">(02) Optional extras</p>
            <h2 className="mt-4 font-display text-5xl leading-[0.95] sm:text-6xl">
              Make a day of it
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-bark">
              Add one when you book, or leave it off. Extras are charged per day
              of your trip.
            </p>
          </Reveal>
          <div className="mt-10">
            <Suspense
              fallback={
                <div className="h-64 animate-pulse rounded-[1.75rem] bg-sand" />
              }
            >
              <Extras />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:gap-14 sm:px-8 sm:py-14 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="eyebrow text-clay">(03) Somewhere else in mind?</p>
          <h2 className="mt-4 font-display text-5xl sm:text-6xl">
            What the trailer needs.
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-bark">
            At forty feet it is a big rig, so not every campsite fits. If your
            campground isn&apos;t on the map, look for these four things, or ask
            us before you book.
          </p>
        </div>
        <dl className="divide-y divide-line border-y border-line">
          {SITE_NEEDS.map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-6 sm:py-5"
            >
              <dt className="eyebrow pt-1 text-bark">{label}</dt>
              <dd className="text-sm leading-relaxed">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <BookCta image="/images/blueridge-pink.jpg" />
    </>
  );
}
