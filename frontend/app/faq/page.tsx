import { Suspense } from "react";
import type { Metadata } from "next";
import BookCta from "@/components/BookCta";
import CardLogos from "@/components/CardLogos";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { money, rate } from "@/lib/format";
import { getTrailer } from "@/lib/trailer";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about booking, payment, delivery, campsites and what's included.",
};

type Group = { title: string; items: { q: string; a: React.ReactNode }[] };

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
          a: (
            <>
              Visa, Mastercard and American Express. Payment runs through Stripe&apos;s secure checkout, so we never see
              or store your card number.
              <CardLogos className="mt-4" />
            </>
          ),
        },
        {
          q: "Is there a security deposit?",
          a: t
            ? `Yes. A refundable ${money(t.security_deposit)} is held at pickup and released after the trailer is returned and inspected.`
            : "Yes. A refundable security deposit is held at pickup and released after the trailer is returned and inspected.",
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
          a: "No. We deliver the trailer to your campsite, level it and hook everything up, then collect it when you leave.",
        },
        {
          q: "Can I tow it myself?",
          a: "Yes, if you have a one-ton truck with a fifth-wheel hitch. The trailer weighs 13,870 lb empty and is rated to 17,070 lb loaded, so smaller trucks are not suitable.",
        },
        {
          q: "Why do you need a driver's license?",
          a: "To confirm who is responsible for the rental. The driver must be at least 25. Your license is stored encrypted, seen only by our staff and deleted 30 days after your trip.",
        },
      ],
    },
  ];

  return (
    <div className="space-y-16">
      {groups.map((group, g) => (
        <section key={group.title} className="grid gap-8 lg:grid-cols-[18rem_1fr]">
          <div>
            <p className="eyebrow text-clay">({String(g + 1).padStart(2, "0")})</p>
            <h2 className="mt-3 font-display text-4xl">{group.title}</h2>
          </div>
          <div className="border-t border-line">
            {group.items.map((item) => (
              <details key={item.q} className="faq group border-b border-line">
                <summary className="flex items-center justify-between gap-6 py-6">
                  <span className="font-display text-2xl sm:text-3xl">{item.q}</span>
                  <span className="faq-plus flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink text-xl transition-transform" aria-hidden="true">
                    +
                  </span>
                </summary>
                <div className="max-w-2xl pb-7 leading-relaxed text-bark">{item.a}</div>
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
      <PageHero image="/images/smoky-meadow.jpg" eyebrow="Good to know" title="Questions" accent="answered" />
      <main className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Suspense fallback={<div className="h-[40rem] animate-pulse bg-sand/60" />}>
          <Questions />
        </Suspense>
      </main>
      <BookCta image="/images/lake-forest.jpg" />
    </>
  );
}
