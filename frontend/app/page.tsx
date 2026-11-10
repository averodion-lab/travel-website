import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import BookCta from "@/components/BookCta";
import CountUp from "@/components/CountUp";
import Header from "@/components/Header";
import Reveal from "@/components/Reveal";
import RoomTour, { type Room } from "@/components/RoomTour";
import { rate } from "@/lib/format";
import { getTrailer } from "@/lib/trailer";

const MARQUEE = [
  "Full hookup ready",
  "Great Smoky Mountains",
  "Blue Ridge Parkway",
  "Lakeside camping",
  "Delivered and set up",
  "Sleeps six",
  "Cleaned and inspected",
];

const STEPS = [
  { title: "Pick your dates", text: "The live calendar shows which days are open. Click your pickup day, then your return day." },
  { title: "Reserve with a deposit", text: "Enter your details and pay a deposit online. Your confirmation arrives by email." },
  { title: "We deliver and set up", text: "We bring the trailer to your campsite, level it and connect power, water and sewer." },
  { title: "Settle in", text: "We walk you through everything, hand over the keys and stay a phone call away." },
];

const EXPLORE = [
  { title: "The trailer", text: "Photos, the floor plan, full specs and the live calendar.", href: "/fleet" },
  { title: "How it works", text: "Booking, payment, delivery and what happens at handover.", href: "/how-it-works" },
  { title: "Good to know", text: "Cards we accept, campsite requirements, towing and more.", href: "/faq" },
];

const DESTINATIONS = [
  { name: "Great Smoky Mountains", place: "Tennessee", image: "/images/smoky-valley.jpg", text: "Misty ridgelines, waterfall hikes and quiet valley roads." },
  { name: "Blue Ridge Parkway", place: "North Carolina", image: "/images/blueridge-rays.jpg", text: "Overlook after overlook along the crest of the mountains." },
  { name: "Autumn Ridgelines", place: "Southern Appalachians", image: "/images/blueridge-fall.jpg", text: "Gold and red hillsides well into November." },
  { name: "Quiet Lakes", place: "Across the Southeast", image: "/images/lake-fall.jpg", text: "Waterfront sites, kayaks and cool evenings by the fire." },
];

// Rooms for the tour, matched to the trailer's photos by file name.
const ROOMS = [
  { file: "living-1", name: "Living room", text: "Theater seating, two sofas and an electric fireplace under a ceiling fan, with windows on three sides." },
  { file: "kitchen", name: "Front kitchen", text: "A raised kitchen with a residential refrigerator, gas range, oven and a walk-in pantry." },
  { file: "bedroom-1", name: "King bedroom", text: "A private bedroom with a king bed and its own closet." },
  { file: "bathroom-1", name: "Bathroom", text: "Double sinks, plenty of storage and a glass-door shower." },
  { file: "exterior", name: "Outside", text: "Four slide-outs, power awnings, outdoor speakers and pass-through storage." },
];

/** The trailer, with its live price and specs from the API. */
async function Trailer() {
  const camper = await getTrailer();
  if (!camper) {
    return <p className="text-muted">The trailer details are loading slowly right now. Please refresh in a moment.</p>;
  }
  const href = `/fleet/${camper.slug}`;
  const rooms: Room[] = ROOMS.flatMap((room) => {
    const image = camper.gallery.find((src) => src.includes(`/${room.file}.`));
    return image ? [{ name: room.name, text: room.text, image }] : [];
  });

  return (
    <>
      <Reveal>
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-clay">(01) {camper.class_type}</p>
            <h2 className="mt-4 font-display text-6xl uppercase leading-[0.9] tracking-tight sm:text-8xl">{camper.name}</h2>
            {camper.tagline && <p className="mt-4 max-w-xl font-display text-2xl italic text-bark">{camper.tagline}</p>}
          </div>
          <div className="flex items-center gap-6">
            <p>
              <span className="font-display text-5xl">{rate(camper.daily_rate)}</span>
              <span className="text-sm text-muted"> / night</span>
            </p>
            <Link href={`${href}#book`} className="btn btn-primary">
              Check availability →
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <RoomTour rooms={rooms} />
      </Reveal>

      <Reveal>
        <div className="mt-14 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <p className="text-lg leading-relaxed text-bark">{camper.description}</p>
          <div>
            <ul className="flex flex-wrap gap-2">
              {camper.amenities.slice(0, 12).map((a) => (
                <li key={a} className="rounded-full border border-ink/20 px-4 py-2 text-sm">
                  {a}
                </li>
              ))}
            </ul>
            <Link href={href} className="btn btn-outline mt-8">
              Photos, floor plan and specs →
            </Link>
          </div>
        </div>
      </Reveal>
    </>
  );
}

/** Big numbers under the hero. */
async function Stats() {
  const camper = await getTrailer();
  const stats = [
    { value: camper?.length_ft ? Math.round(camper.length_ft) : 40, suffix: " ft", label: "of living space" },
    { value: camper?.sleeps ?? 6, suffix: "", label: "guests sleep comfortably" },
    { value: 4, suffix: "", label: "slide-outs" },
    { value: camper ? Number(camper.daily_rate) : 249, prefix: "$", suffix: "", label: "per night" },
  ];
  return (
    <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-5 py-16 sm:px-8 lg:grid-cols-4">
      {stats.map((s, i) => (
        <div key={s.label} className={`px-2 text-center ${i > 0 ? "lg:border-l lg:border-ink/15" : ""}`}>
          <dd className="font-display text-7xl leading-none sm:text-8xl">
            <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} />
          </dd>
          <dt className="eyebrow mt-4 text-muted">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}

export default function Home() {
  return (
    <>
      <Header overlay />

      {/* Hero */}
      <section className="relative flex min-h-[46rem] flex-col items-center justify-center overflow-hidden px-5 pb-28 pt-36 text-center text-cream sm:min-h-screen">
        <Image src="/images/blueridge-rays.jpg" alt="" fill priority sizes="100vw" className="hero-zoom object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/20 to-ink/80" />
        <div className="relative flex w-full flex-col items-center">
          <p className="script rise text-6xl sm:text-7xl">The</p>
          <h1 className="font-display text-[3.4rem] uppercase leading-[0.88] tracking-tight sm:text-[9.5rem]">
            <span className="rise block" style={{ animationDelay: "0.12s" }}>Mountains</span>
            <span className="rise block" style={{ animationDelay: "0.24s" }}>are calling</span>
          </h1>
          <p className="script rise mt-2 text-5xl sm:text-8xl" style={{ animationDelay: "0.4s" }}>Book your luxury getaway</p>
          <p className="rise mt-8 max-w-xl text-base leading-relaxed text-cream/85" style={{ animationDelay: "0.55s" }}>
            One forty-foot luxury fifth wheel, delivered and set up for the Smokies, the Blue Ridge and every lake in between.
          </p>
          <div className="rise mt-9 flex flex-wrap justify-center gap-4" style={{ animationDelay: "0.7s" }}>
            <Link href="/fleet#book" className="btn btn-primary">Check availability</Link>
            <Link href="/gallery" className="btn btn-light">Step inside</Link>
          </div>
        </div>
        <p className="eyebrow absolute bottom-8 left-5 hidden text-left leading-relaxed sm:left-8 sm:block">
          Delivered
          <br />
          across the Southeast
        </p>
        <p className="eyebrow absolute bottom-8 right-5 hidden text-right leading-relaxed sm:right-8 sm:block">
          Sleeps six
          <br />
          Forty feet
        </p>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden bg-ink py-4 text-cream" aria-hidden="true">
        <div className="marquee flex w-max">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0">
              {MARQUEE.map((item) => (
                <span key={item} className="eyebrow px-6 whitespace-nowrap">
                  {item} <span className="ml-12 text-clay">—</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Numbers */}
      <section className="border-b border-line">
        <Suspense fallback={<div className="h-56" />}>
          <Stats />
        </Suspense>
      </section>

      {/* The trailer */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <Suspense fallback={<div className="h-[44rem] animate-pulse rounded-[2rem] bg-sand/60" />}>
          <Trailer />
        </Suspense>
      </section>

      {/* Intro */}
      <section className="bg-pine-dark text-cream">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow text-cream/60">(02) Why rent with us</p>
            <h2 className="mt-5 font-display text-5xl uppercase leading-[0.95] tracking-tight sm:text-7xl">More than a rental.</h2>
            <p className="script mt-1 text-5xl sm:text-6xl">A better way to get away</p>
            <p className="mt-8 max-w-lg leading-relaxed text-cream/75">
              Wake up to mountain light, cook breakfast with the door open, and fall asleep to a campfire. We rent
              one trailer and look after it like our own home, so every trip starts clean, stocked and ready.
            </p>
            <Link href="/how-it-works" className="btn btn-light mt-9">
              How it works →
            </Link>
          </Reveal>
          <div className="grid grid-cols-5 gap-4">
            <Reveal className="col-span-3">
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-full">
                <Image src="/images/smoky-fall.jpg" alt="Fall color in the Smoky Mountains" fill sizes="(min-width:1024px) 30vw, 60vw" className="object-cover" />
              </div>
            </Reveal>
            <div className="col-span-2 flex flex-col gap-4 pt-16">
              <Reveal delay={120}>
                <div className="relative aspect-square overflow-hidden rounded-2xl">
                  <Image src="/images/montana/bedroom-2.jpg" alt="King bedroom in the trailer" fill sizes="(min-width:1024px) 20vw, 40vw" className="object-cover" />
                </div>
              </Reveal>
              <Reveal delay={240}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                  <Image src="/images/campfire-night.jpg" alt="Campfire beside a glowing tent at night" fill sizes="(min-width:1024px) 20vw, 40vw" className="object-cover" />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative scroll-mt-20 px-5 py-28 text-cream sm:px-8">
        <Image src="/images/lake-campsite.jpg" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-ink/70" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal className="text-center">
            <p className="eyebrow">(03) How it works</p>
            <h2 className="mt-4 font-display text-5xl uppercase tracking-tight sm:text-7xl">From booking</h2>
            <p className="script text-5xl sm:text-6xl">to campfire</p>
          </Reveal>
          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <Reveal delay={i * 110} className="h-full">
                  <div className="h-full rounded-2xl border border-cream/40 bg-cream/5 p-7 backdrop-blur-sm transition-colors duration-300 hover:bg-cream hover:text-ink">
                    <p className="font-display text-6xl italic opacity-70">{String(i + 1).padStart(2, "0")}</p>
                    <h3 className="eyebrow mt-6">{step.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed opacity-85">{step.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
          <div className="mt-12 text-center">
            <Link href="/how-it-works" className="btn btn-light">See every step</Link>
          </div>
        </div>
      </section>

      {/* Destinations: panels that open up on hover */}
      <section id="destinations" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="eyebrow text-clay">(04) Where to go</p>
              <h2 className="mt-4 font-display text-5xl uppercase leading-[0.95] tracking-tight sm:text-7xl">Mountains, lakes</h2>
              <p className="script text-5xl sm:text-6xl">and open road</p>
            </div>
            <Link href="/destinations" className="btn btn-outline">
              Explore destinations →
            </Link>
          </div>
        </Reveal>
        <Reveal>
          <div className="mt-12 flex flex-col gap-3 lg:h-[36rem] lg:flex-row">
            {DESTINATIONS.map((d) => (
              <Link
                key={d.name}
                href="/destinations"
                className="group relative min-h-[15rem] flex-1 overflow-hidden rounded-[1.75rem] transition-[flex-grow] duration-700 ease-out lg:hover:flex-[3.2] lg:focus-visible:flex-[3.2]"
              >
                <Image src={d.image} alt={d.name} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-cream sm:p-7">
                  <p className="eyebrow text-cream/75">{d.place}</p>
                  <p className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{d.name}</p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-cream/85 transition-opacity duration-500 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100">
                    {d.text}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Explore */}
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="grid border-t border-ink md:grid-cols-3">
          {EXPLORE.map((item, i) => (
            <Link key={item.href} href={item.href} className={`group block py-10 transition-colors hover:bg-sand/50 md:px-8 ${i > 0 ? "md:border-l md:border-ink/15" : ""}`}>
              <h2 className="font-display text-4xl uppercase leading-none tracking-tight sm:text-5xl">{item.title}</h2>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{item.text}</p>
              <p className="eyebrow mt-6 inline-flex items-center gap-3">
                Learn more <span className="transition-transform duration-300 group-hover:translate-x-2">→</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      <BookCta />
    </>
  );
}
