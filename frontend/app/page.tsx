import { Suspense, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import BookCta from "@/components/BookCta";
import Header from "@/components/Header";
import MapAndBooking from "@/components/MapAndBooking";
import InView from "@/components/lux/InView";
import Balance from "@/components/lux/Balance";
import Moments from "@/components/lux/Moments";
import RollingNumber from "@/components/lux/RollingNumber";
import { LitStatement } from "@/components/lux/ScrollEffects";
import StepInside from "@/components/lux/StepInside";
import { rate } from "@/lib/format";
import { getParks } from "@/lib/parks";
import { getTrailer } from "@/lib/trailer";

/* Home page, design option E: option A's quiet luxury look (ivory, black,
   brass) with option C's motion. */

const HERO_SLIDES = [
  { src: "/images/lake-fall.jpg", alt: "An autumn forest reflected in a still lake" },
  { src: "/images/smoky-sunset.jpg", alt: "Sunset over the Great Smoky Mountains" },
  { src: "/images/lake-jetski.jpg", alt: "A jet ski crossing a lake at golden hour" },
];

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const WAITING: { title: string; text: string; icon: ReactNode }[] = [
  {
    title: "Your home, set up",
    text: "Delivered to your site, levelled, slide-outs open, power and water connected.",
    icon: <path d="M3 11 12 4l9 7M5 10v10h14V10M10 20v-5h4v5" />,
  },
  {
    title: "Chairs around the fire",
    text: "Outdoor chairs set out and the fire pit ready for your first evening.",
    icon: <path d="M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-8ZM4 21h16" />,
  },
  {
    title: "Bikes to explore",
    text: "Bikes waiting at the trailer for the trails and the lake path.",
    icon: (
      <path d="M5.5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM18.5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5.5 14.5 9 7h5l4.5 7.5M9 7l3.5 7.5h-7M13 5h3" />
    ),
  },
  {
    title: "Toys, ready to go",
    text: "Add a 4-wheeler in the mountains or a jet ski on the lake, fuelled and ready.",
    icon: <path d="M2 16c2 0 2-1.5 4-1.5S8 16 10 16s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M5 12l3-4h7l4 4H5Z" />,
  },
];

const STEPS = [
  ["Choose your place", "One of eighteen mountain and lakeside parks, or anywhere else you choose."],
  ["We prepare everything", "We deliver the residence and set up your campsite before you arrive."],
  ["Arrive and unwind", "Walk in to a home that is ready. We stay a phone call away."],
];

function Hero() {
  return (
    <section className="relative flex h-[100svh] min-h-[38rem] items-end overflow-hidden text-cream">
      {HERO_SLIDES.map((s, i) => (
        <div key={s.src} className="lux-slide absolute inset-0" style={{ animationDelay: `${i * 7}s` }}>
          <Image src={s.src} alt={i === 0 ? s.alt : ""} fill priority={i === 0} sizes="100vw" className="object-cover" />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/40" />
      <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 sm:pb-24">
        <p className="lux-label lux-fade text-cream/85" style={{ animationDelay: "0.2s" }}>
          Luxury camping in the Southeast
        </p>
        <h1 className="mt-5 font-display text-[3.2rem] font-normal leading-[1.02] sm:text-[5.5rem]">
          <span className="lux-line">
            <span style={{ animationDelay: "0.35s" }}>Nature, with</span>
          </span>
          <span className="lux-line">
            <em style={{ animationDelay: "0.55s" }}>hotel comfort.</em>
          </span>
        </h1>
        <div className="lux-fade mt-10 flex flex-wrap items-center gap-6" style={{ animationDelay: "0.95s" }}>
          <a href="#book-now" className="btn btn-light lux-shine">
            Reserve your stay
          </a>
          <a href="#experience" className="tap lux-label border-b border-current pb-1">
            Discover the experience
          </a>
        </div>
      </div>
      <div className="lux-cue absolute bottom-6 right-10 hidden h-14 w-px bg-white/50 sm:block" />
    </section>
  );
}

function Waiting() {
  return (
    <section className="bg-sand">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:py-32">
        <InView className="lux-clip relative aspect-[4/5] overflow-hidden">
          <Image
            src="/images/lake-jetski.jpg"
            alt="A jet ski crossing a lake at golden hour, framed by pines"
            fill
            sizes="(min-width:1024px) 45vw, 100vw"
            className="lux-settle object-cover object-[62%_50%]"
          />
        </InView>
        <div>
          <InView className="lux-rise">
            <p className="lux-label text-clay">When you arrive</p>
            <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">
              Everything is <em>already waiting.</em>
            </h2>
          </InView>
          {/* Phones: icon beside the title, tighter spacing. Larger screens: icon above, 2x2 grid. */}
          <ul className="mt-8 grid gap-x-10 gap-y-5 sm:mt-12 sm:grid-cols-2 sm:gap-y-10">
            {WAITING.map((w, i) => (
              <InView
                as="li"
                key={w.title}
                delay={150 + i * 140}
                className="lux-rise flex gap-4 border-t border-line pt-5 sm:block sm:pt-6"
              >
                <span className="mt-0.5 shrink-0 text-clay sm:mt-0 sm:block">
                  <Icon>{w.icon}</Icon>
                </span>
                <div>
                  <h3 className="font-display text-xl leading-snug sm:mt-4 sm:text-2xl">{w.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted sm:mt-2">{w.text}</p>
                </div>
              </InView>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Numbers that count up, from the trailer's live data. */
async function Numbers() {
  const camper = await getTrailer();
  const stats: [number, string, string][] = [
    [camper?.length_ft ? Math.round(camper.length_ft) : 40, " ft", "of private residence"],
    [camper?.sleeps ?? 6, "", "guests, two bedrooms"],
    [18, "", "mountain and lake places"],
    [4, "", "slide-outs of open space"],
  ];
  return (
    <dl className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
      {stats.map(([value, suffix, text], i) => (
        <InView key={text} delay={i * 120} className="lux-rise px-5 py-14 text-center">
          <dd className="font-display text-6xl sm:text-7xl">
            <RollingNumber value={value} suffix={suffix} delay={i * 150} />
          </dd>
          <dt className="lux-label mt-3 text-muted">{text}</dt>
        </InView>
      ))}
    </dl>
  );
}

/** The trailer: a wide photo that moves slower than the page, three smaller
 *  photos that unveil, and the live price. */
async function Residence() {
  const camper = await getTrailer();
  const href = camper ? `/fleet/${camper.slug}` : "/fleet";
  return (
    <>
      <InView className="lux-rise flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="lux-label text-clay">The residence</p>
          <h2 className="mt-5 font-display text-5xl sm:text-7xl">{camper?.name ?? "The Montana"}</h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          A king suite, a living room with a fireplace and theatre seating, and a full kitchen. Forty feet of quiet
          comfort for up to six.
        </p>
      </InView>
      <div className="mt-14 grid grid-cols-3 gap-3 sm:gap-5">
        {[
          ["/images/montana/bedroom-1.jpg", "The king bedroom"],
          ["/images/montana/kitchen.jpg", "The kitchen"],
          ["/images/montana/fireplace.jpg", "The electric fireplace"],
        ].map(([src, alt], i) => (
          <InView key={src} delay={i * 150} className="lux-clip relative aspect-[4/3] overflow-hidden">
            <Image src={src} alt={alt} fill sizes="33vw" className="object-cover" />
          </InView>
        ))}
      </div>
      <div className="mt-12 flex flex-wrap items-center gap-8">
        <Link href={href} className="btn btn-primary">
          View the residence
        </Link>
        {camper && (
          <p className="text-sm text-muted">
            From <span className="font-display text-2xl text-ink">{rate(camper.daily_rate)}</span> a night
          </p>
        )}
      </div>
    </>
  );
}

/** The parks map with the booking card under it. */
async function Parks() {
  const [data, trailer] = await Promise.all([getParks(), getTrailer()]);
  if (!data || !trailer)
    return <p className="text-muted">The campground map is loading slowly right now. Please refresh in a moment.</p>;
  return <MapAndBooking parks={data.parks} addons={data.addons} camper={trailer} transport={data.transport} />;
}

export default function Home() {
  return (
    <>
      <Header overlay />
      <Hero />

      {/* The experience, in one sentence */}
      <section id="experience" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-32 text-center sm:py-44">
        <p className="lux-label text-clay">The experience</p>
        <div className="mt-10">
          <LitStatement text="We bring a forty-foot luxury residence to the mountains or the lake, prepare every detail around it, and hand you the keys. All you do is arrive." />
        </div>
      </section>

      <Waiting />

      <section>
        <Suspense fallback={<div className="h-48" />}>
          <Numbers />
        </Suspense>
      </section>

      {/* A framed photo of the living room grows to fill the screen */}
      <StepInside
        src="/images/montana/living-1.jpg"
        alt="The living room, with theatre seating and a fireplace"
        eyebrow="The residence"
        title="Step"
        accent="inside."
      />

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 sm:pb-20">
        <Suspense fallback={<div className="h-[30rem] animate-pulse bg-sand/60" />}>
          <Residence />
        </Suspense>
      </section>

      <Moments />

      <Balance />

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-5 py-28 sm:px-8 sm:py-36">
        <p className="lux-label text-center text-clay">How it works</p>
        <h2 className="mt-5 text-center font-display text-5xl">Three simple steps</h2>
        <ol className="mt-16 grid gap-12 sm:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <InView as="li" key={title} delay={i * 160} className="lux-rise text-center">
              <p className="font-display text-6xl text-clay">
                <em>{["I", "II", "III"][i]}</em>
              </p>
              <div className="lux-grow mx-auto mt-6 h-px w-12 bg-clay" />
              <h3 className="mt-6 font-display text-3xl">{title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">{text}</p>
            </InView>
          ))}
        </ol>
        <p className="mt-14 text-center">
          <Link href="/how-it-works" className="tap lux-label border-b border-ink pb-1">
            Every detail of your stay
          </Link>
        </p>
      </section>

      {/* Where to stay: the parks map, with the booking card under it */}
      <section id="destinations" className="border-t border-line bg-sand/60">
        <div className="mx-auto max-w-7xl scroll-mt-20 px-5 py-28 sm:px-8 sm:py-32">
          <InView className="lux-rise flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="lux-label text-clay">Where to stay</p>
              <h2 className="mt-5 font-display text-5xl leading-[1.05] sm:text-6xl">
                Choose your place, <em>we&apos;ll prepare it.</em>
              </h2>
              <p className="mt-5 max-w-xl leading-relaxed text-muted">
                Eighteen mountain and lakeside parks across the Southeast, or type your own place when you book. Tap a pin to see the park, then reserve right
                below the map.
              </p>
            </div>
            <Link href="/destinations" className="tap lux-label border-b border-ink pb-1">
              All places and extras
            </Link>
          </InView>
          <div className="mt-12">
            <Suspense fallback={<div className="h-[34rem] animate-pulse bg-sand" />}>
              <Parks />
            </Suspense>
          </div>
        </div>
      </section>

      <BookCta />
    </>
  );
}
