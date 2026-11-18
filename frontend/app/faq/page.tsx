import { Suspense } from "react";
import type { Metadata } from "next";
import BookCta from "@/components/BookCta";
import CardLogos from "@/components/CardLogos";
import Header from "@/components/Header";
import JsonLd from "@/components/JsonLd";
import PageHero from "@/components/PageHero";
import { money, rate } from "@/lib/format";
import Link from "next/link";
import { OG, pageMeta } from "@/lib/seo";
import { getTrailer } from "@/lib/trailer";

export const metadata: Metadata = pageMeta({
  title: "RV Rental FAQ: Booking, Delivery and Towing",
  description:
    "How booking and the deposit work, what delivery costs, which campsites fit a 40 ft fifth wheel, pets, cancellations and what's included.",
  path: "/faq",
  image: OG.mountains,
});

/** `plain` is the answer as text, for search engines, when `a` is JSX. */
type Group = { title: string; items: { q: string; a: React.ReactNode; plain?: string }[] };

async function Questions() {
  const t = await getTrailer();
  const groups: Group[] = [
    {
      title: "Booking and payment",
      items: [
        {
          q: "How do I book?",
          a: "Open the trailer page, click your pickup day and your return day on the calendar, then press Reserve. You enter your details, upload the driver's license and pay the deposit by card. A confirmation email follows straight away.",
        },
        {
          q: "How much does it cost?",
          a: t
            ? `${rate(t.daily_rate)} a night with a ${t.min_nights}-night minimum, plus a one-time ${money(t.cleaning_fee)} cleaning fee. The calendar shows your exact total before you commit to anything.`
            : "The calendar on the trailer page shows the nightly rate and your exact total before you commit to anything.",
        },
        {
          q: "What do I pay when I book?",
          a: "A deposit holds your dates, and the exact amount is shown before you pay. The rest of the rental is due at pickup.",
        },
        {
          q: "Which cards do you accept?",
          plain:
            "Visa, Mastercard and American Express. Payment runs through Stripe's secure checkout, so we never see or store your card number.",
          a: (
            <>
              Visa, Mastercard and American Express. Payment runs through
              Stripe&apos;s secure checkout, so we never see or store your card
              number.
              <CardLogos className="mt-4" />
            </>
          ),
        },
        {
          q: "Is there a security deposit?",
          a: t
            ? `Yes, if you rent our truck or add a jet ski or a 4-wheeler. Then a refundable ${money(t.security_deposit)} is held on your card at pickup and released after everything is returned and checked. Staying with the trailer alone, or adding e-bikes, needs no security deposit.`
            : "Yes, if you rent our truck or add a jet ski or a 4-wheeler. Then a refundable security deposit is held on your card at pickup and released after everything is returned and checked. Staying with the trailer alone, or adding e-bikes, needs no security deposit.",
        },
        {
          q: "Can I cancel or change my booking?",
          plain:
            "Yes, online on the Manage booking page. Changing your dates is free up to 24 hours before pickup. Cancellation is free within 24 hours of payment; after that, the deposit is refunded in full up to 14 days before pickup, 50% from 13 to 7 days, and not in the last 7 days. No fees either way.",
          a: (
            <>
              Yes, online on the Manage booking page (link in your confirmation
              email and at the bottom of every page). Changing your dates is
              free up to 24 hours before pickup. Cancellation is free within 24
              hours of payment; after that, the deposit is refunded in full up
              to 14 days before pickup, 50% from 13 to 7 days, and not in the
              last 7 days. No fees either way.{" "}
              <Link href="/policies#cancellation" className="tap underline hover:text-clay">
                See details
              </Link>
            </>
          ),
        },
      ],
    },
    {
      title: "The trailer",
      items: [
        {
          q: "How many people does it sleep?",
          a: t
            ? `${t.sleeps}: a king bed in the private bedroom and two sofas that fold out into beds in the living room.`
            : "A king bed in the private bedroom and two sofas that fold out into beds in the living room.",
        },
        {
          q: "Can I bring my dog?",
          a: "Yes, the trailer is pet friendly and there's no pet fee. Please keep pets off the beds, clean up after them, and don't leave them alone in the trailer for long.",
        },
        {
          q: "Are there trailer rules?",
          plain:
            "Just a few: return it clean (dishes done, trash out, fridge emptied), no smoking or vaping inside, and towing experience is required if you tow it yourself.",
          a: (
            <>
              Just a few: return it clean (dishes done, trash out, fridge
              emptied), no smoking or vaping inside, and towing experience is
              required if you tow it yourself.{" "}
              <Link href="/policies#rules" className="tap underline hover:text-clay">
                See all the rules
              </Link>
            </>
          ),
        },
        {
          q: "What is included?",
          a: "Bedding and towels, cookware, dishes and utensils, plus a full walkthrough at handover. You bring the groceries and your clothes.",
        },
        {
          q: "What kind of campsite do I need?",
          a: "A site of 45 feet or more with 50 amp power, and ideally water and sewer hookups. The Destinations page has the full checklist, and we're happy to check a campground for you before you reserve it.",
        },
      ],
    },
    {
      title: "Delivery and towing",
      items: [
        {
          q: "Do I need a truck?",
          a: "No. You have three choices when you book: tow it with your own truck, rent our black 2026 RAM 2500 Turbo Diesel, or have us deliver the trailer to your campsite, level it and hook everything up, then collect it when you leave.",
        },
        {
          q: "Can I rent your truck to tow it?",
          a: "Yes, if you have experience towing a large fifth-wheel trailer; you confirm it when you book. Our 2026 RAM 2500 Turbo Diesel comes with the fifth-wheel hitch and is charged per day of your trip.",
        },
        {
          q: "How much is delivery?",
          a: "$4.50 a mile, one way: the drive from our base in Canton/Woodstock, GA to your campground. Picking it up afterwards is free. Choose a campground when you book and you'll see the exact price before you pay.",
        },
        {
          q: "Can I tow it myself?",
          a: "Yes, if you have a fifth-wheel hitch and a truck weighing at least 6,000 lb, and experience towing a large fifth-wheel trailer; you confirm it when you book. The trailer weighs 13,870 lb empty and is rated to 17,070 lb loaded, so lighter trucks are not suitable. Not sure? Choose delivery and we'll set it up for you.",
        },
        {
          q: "Can I rent a 4-wheeler, a jet ski or e-bikes?",
          a: "Yes, as optional extras when you book, charged per day of your trip. 4-wheelers are available on any trip (helmet included; please check that your campground allows riding) and jet skis at our lake parks (life jacket included). Electric bikes are $33 a day each and we have three, so you can add up to three, at any campground. They ride along on the trailer, whether we deliver it or you tow it. The Destinations page shows which park offers what.",
        },
        {
          q: "Why do you need a driver's license?",
          a: "To confirm who is responsible for the rental. The driver must be at least 25. Your license is stored encrypted, seen only by our staff and deleted 30 days after your trip.",
        },
      ],
    },
  ];

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) =>
      g.items.map((i) => ({
        "@type": "Question",
        name: i.q,
        acceptedAnswer: { "@type": "Answer", text: i.plain ?? (typeof i.a === "string" ? i.a : "") },
      })),
    ),
  };

  return (
    <div className="space-y-10 sm:space-y-12">
      <JsonLd data={faqLd} />
      {groups.map((group, g) => (
        <section
          key={group.title}
          className="grid gap-8 lg:grid-cols-[18rem_1fr]"
        >
          <div>
            <p className="eyebrow text-clay">
              ({String(g + 1).padStart(2, "0")})
            </p>
            <h2 className="mt-3 font-display text-4xl">{group.title}</h2>
          </div>
          <div className="border-t border-line">
            {group.items.map((item) => (
              <details key={item.q} className="faq group border-b border-line">
                <summary className="flex items-center justify-between gap-6 py-6">
                  <span className="font-display text-2xl sm:text-3xl">
                    {item.q}
                  </span>
                  <span
                    className="faq-plus flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink text-xl transition-transform"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <div className="max-w-2xl pb-7 leading-relaxed text-bark">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function FaqPage() {
  return (
    <>
      <Header overlay />
      <PageHero
        seed={47}
        image="/images/smoky-meadow.jpg"
        eyebrow="Good to know"
        title="Questions"
        accent="answered"
      />
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <Suspense
          fallback={<div className="h-[40rem] animate-pulse bg-sand/60" />}
        >
          <Questions />
        </Suspense>
      </main>
      <BookCta image="/images/lake-forest.jpg" />
    </>
  );
}
