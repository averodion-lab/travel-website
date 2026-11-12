import { Suspense } from "react";
import type { Metadata } from "next";
import AddonIcon from "@/components/AddonIcon";
import BookCta from "@/components/BookCta";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import ParksMap from "@/components/ParksMap";
import Reveal from "@/components/Reveal";
import { rate } from "@/lib/format";
import { getParks } from "@/lib/parks";

export const metadata: Metadata = {
  title: "Destinations",
  description:
    "Mountain and lakeside RV parks in Georgia, the Carolinas, Tennessee and Alabama where we deliver the trailer, with 4-wheelers and jet skis as extras.",
};

const SITE_NEEDS = [
  ["Site length", "A pull-through or back-in site of 45 feet or more."],
  ["Power", "50 amp electric service."],
  ["Hookups", "Water and sewer at the site for the full-comfort experience."],
  [
    "Access",
    "Paved or well-graded roads without low bridges. The trailer stands 13 ft 4 in tall.",
  ],
];

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
      {/* In place of a long park list: what to add, depending on where you stay. */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <p className="flex items-center gap-4 rounded-2xl bg-white p-5 leading-relaxed text-bark">
          <AddonIcon code="atv" size={52} />
          <span>
            <strong className="font-semibold text-ink">
              In the mountains?
            </strong>{" "}
            Add a 4-wheeler and make the trails part of the fun.
          </span>
        </p>
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
  const cards = [
    {
      code: "atv",
      title: "4-wheelers",
      where: "At mountain parks",
      text: "Take the trails up to the overlooks. The 4-wheeler rides along on the trailer, whoever tows it.",
      price: atv ? `${rate(atv.daily_rate)} a day` : "",
      tone: "bg-pine text-cream",
    },
    {
      code: "jetski",
      title: "Jet skis",
      where: "At lake parks",
      text: "Spend the afternoon out on the water. The jet ski rides along on the trailer, ready to launch.",
      price: jetski ? `${rate(jetski.daily_rate)} a day` : "",
      tone: "bg-[#2f6f8f] text-cream",
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((c, i) => (
        <Reveal key={c.title} delay={i * 120}>
          <div
            className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[1.75rem] p-8 ${c.tone}`}
          >
            <AddonIcon
              code={c.code}
              size={96}
              className="mb-6 sm:absolute sm:right-8 sm:top-8 sm:mb-0"
            />
            <div className="relative sm:max-w-[70%]">
              <p className="eyebrow opacity-70">{c.where}</p>
              <h3 className="mt-3 font-display text-5xl uppercase leading-none tracking-tight">
                {c.title}
              </h3>
              <p className="mt-4 max-w-sm text-sm leading-relaxed opacity-85">
                {c.text}
              </p>
            </div>
            <p className="relative mt-8 font-display text-3xl">{c.price}</p>
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
        text="Eleven RV parks across five states where we deliver and set up the trailer. Tap a pin to see the park."
      />

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <Reveal>
          <p className="eyebrow text-clay">(01) Campgrounds we deliver to</p>
          <h2 className="mt-4 font-display text-5xl uppercase leading-[0.95] tracking-tight sm:text-6xl">
            Pick your park
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-bark">
            Tap a pin to see the park and its website, where you reserve your
            campsite. Then book the trailer and we&apos;ll have it waiting when
            you arrive.
          </p>
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
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <Reveal>
            <p className="eyebrow text-clay">(02) Optional extras</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-[0.95] tracking-tight sm:text-6xl">
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

      <section className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.2fr]">
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
              className="grid gap-1 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6"
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
