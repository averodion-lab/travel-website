import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BookCta from "@/components/BookCta";
import CardLogos, { Lock } from "@/components/CardLogos";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { money } from "@/lib/format";
import { getTrailer } from "@/lib/trailer";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "From picking your dates to settling in at the campsite: how booking, payment and delivery work.",
};

const STEPS = [
  {
    title: "Pick your dates",
    text: "Open the calendar on the trailer page. Booked days are crossed out, so every day you can click is really open. Click your pickup day, then your return day, and the full price appears right away.",
    image: "/images/blueridge-road.jpg",
    alt: "A road winding through the Blue Ridge Mountains",
  },
  {
    title: "Reserve with a deposit",
    text: "Tell us who is travelling, upload the driver's license and pay the deposit by card. Your dates are yours as soon as the payment goes through, and a confirmation lands in your inbox.",
    image: "/images/montana/kitchen.jpg",
    alt: "The trailer's front kitchen",
  },
  {
    title: "We deliver and set up",
    text: "We bring the trailer to your campsite, level it, open the slide-outs and connect power, water and sewer. If you have a one-ton truck with a fifth-wheel hitch you can tow it yourself instead.",
    image: "/images/montana/exterior.jpg",
    alt: "The trailer set up with its slide-outs open",
  },
  {
    title: "Settle in",
    text: "We walk you through the appliances, awnings and controls until you are comfortable, then hand over the keys. We stay a phone call away for the whole trip.",
    image: "/images/montana/living-1.jpg",
    alt: "The trailer's living room",
  },
];

const INCLUDED = [
  [
    "Cleaned and inspected",
    "The trailer is deep cleaned and checked from hitch to tail lights before every trip.",
  ],
  [
    "Kitchen ready",
    "Cookware, dishes and utensils are on board. Bring the groceries.",
  ],
  [
    "Bedding and towels",
    "Fresh linens for every bed, so you can pack lighter.",
  ],
  [
    "A full walkthrough",
    "We show you the slide-outs, awnings and appliances until you're comfortable.",
  ],
  [
    "Help on the road",
    "Questions at the campsite? Call or text us during your trip.",
  ],
];

async function PaymentFacts() {
  const trailer = await getTrailer();
  const facts = [
    [
      "When you book",
      "A deposit by card holds your dates. The exact amount is shown before you pay.",
    ],
    [
      "At pickup",
      "The rest of the rental is due when the trailer is handed over.",
    ],
    [
      "Security deposit",
      trailer
        ? `A refundable ${money(trailer.security_deposit)} is held at pickup and released after the trailer is returned and inspected.`
        : "A refundable security deposit is held at pickup and released after the trailer is returned and inspected.",
    ],
  ];
  return (
    <dl className="divide-y divide-line border-y border-line">
      {facts.map(([label, value]) => (
        <div
          key={label}
          className="grid gap-1 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6"
        >
          <dt className="eyebrow pt-1 text-bark">{label}</dt>
          <dd className="text-sm leading-relaxed">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      <Header overlay />
      <PageHero
        seed={13}
        image="/images/lake-campsite.jpg"
        eyebrow="How it works"
        title="From booking"
        accent="to campfire"
        text="Four steps, about five minutes online, and the trailer is waiting for you at the campsite."
      />

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <ol className="space-y-20">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20"
            >
              <div
                className={`relative aspect-[4/3] bg-sand ${i % 2 ? "lg:order-2" : ""}`}
              >
                <Image
                  src={step.image}
                  alt={step.alt}
                  fill
                  sizes="(min-width:1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="eyebrow text-clay">
                  ({String(i + 1).padStart(2, "0")})
                </p>
                <h2 className="mt-4 font-display text-5xl sm:text-6xl">
                  {step.title}
                </h2>
                <p className="mt-6 max-w-lg leading-relaxed text-bark">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-sand/50">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow text-clay">Payment</p>
            <h2 className="mt-4 font-display text-5xl sm:text-6xl">
              Simple, secure, by card.
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-bark">
              Card payments run through Stripe&apos;s secure checkout. We never
              see or store your card number.
            </p>
            <CardLogos className="mt-7" />
            <p className="mt-4 flex items-center gap-2 text-xs text-muted">
              <Lock /> Visa, Mastercard and American Express accepted
            </p>
          </div>
          <Suspense fallback={<div className="h-56 animate-pulse bg-sand" />}>
            <PaymentFacts />
          </Suspense>
        </div>
      </section>

      <section className="bg-pine-dark text-cream">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-2">
          <div className="relative min-h-[26rem]">
            <Image
              src="/images/montana/living-2.jpg"
              alt="Sofas and theater seating in the trailer"
              fill
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="eyebrow text-cream/60">Included with every rental</p>
            <h2 className="mt-4 font-display text-5xl sm:text-6xl">
              Ready before you are.
            </h2>
            <ul className="mt-10 divide-y divide-cream/15 border-y border-cream/15">
              {INCLUDED.map(([title, text]) => (
                <li
                  key={title}
                  className="grid gap-1 py-5 sm:grid-cols-[14rem_1fr] sm:gap-6"
                >
                  <h3 className="eyebrow pt-1">{title}</h3>
                  <p className="text-sm leading-relaxed text-cream/75">
                    {text}
                  </p>
                </li>
              ))}
            </ul>
            <Link href="/faq" className="btn btn-outline mt-10">
              More questions answered →
            </Link>
          </div>
        </div>
      </section>

      <BookCta />
    </>
  );
}
