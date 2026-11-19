import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import BookCta from "@/components/BookCta";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { money } from "@/lib/format";
import { OG, pageMeta } from "@/lib/seo";
import { getTrailer } from "@/lib/trailer";

export const metadata: Metadata = pageMeta({
  title: "Cancellation Policy and Trailer Rules",
  description:
    "Free cancellation within 24 hours of payment, then a fair refund scale. Free date changes. The security deposit, and the trailer rules.",
  path: "/policies",
  image: OG.campfire,
});

/** The cancellation refunds; keep in sync with catalog.CANCEL_REFUNDS. */
const REFUNDS = [
  { when: "Within 24 hours of payment", refund: "Full refund", note: "However close your trip is." },
  { when: "14 or more days before pickup", refund: "Full refund", note: "" },
  { when: "7 to 13 days before pickup", refund: "50% refund", note: "" },
  { when: "Less than 7 days before pickup", refund: "No refund", note: "Moving your dates is still free." },
];

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="grid scroll-mt-28 gap-6 lg:grid-cols-[18rem_1fr] lg:gap-8">
      <div>
        <p className="eyebrow text-clay">({number})</p>
        <h2 className="mt-3 font-display text-4xl">{title}</h2>
      </div>
      <div className="max-w-2xl space-y-5 leading-relaxed text-bark">{children}</div>
    </section>
  );
}

async function DepositAmount() {
  const t = await getTrailer();
  return <>{t ? money(t.security_deposit) : "a refundable amount"}</>;
}

const RULES: { title: string; text: React.ReactNode }[] = [
  {
    title: "Towing experience required if you tow it yourself",
    text: "Whether you use your own truck or rent ours, the driver must have experience towing a large fifth-wheel trailer (about 40 ft, up to 17,070 lb loaded); you confirm it when you book. Not sure? Choose delivery and we'll bring it, level it and hook everything up.",
  },
  {
    title: "No smoking inside",
    text: "No smoking or vaping inside the trailer. You're welcome to smoke outside, away from the doors, windows and awning. If the trailer needs deodorizing after a stay, that cost is charged to the booking.",
  },
  {
    title: "Pets are welcome",
    text: "Bring your dog along at no extra charge. Please keep pets off the beds, clean up after them, and don't leave them alone in the trailer for long.",
  },
  {
    title: "Follow the campground's rules",
    text: "Each park has its own rules, such as quiet hours, campfires and speed limits. Please follow them; they're there for everyone's stay.",
  },
];

export default function PoliciesPage() {
  return (
    <>
      <Header overlay />
      <PageHero
        seed={53}
        image="/images/lake-forest.jpg"
        eyebrow="Policies"
        title="Simple and"
        accent="fair."
      />
      <main className="mx-auto max-w-7xl space-y-14 px-5 py-12 sm:space-y-16 sm:px-8 sm:py-16">
        <Section id="cancellation" number="01" title="Cancellations and changes">
          <p>
            Plans change, and we keep it simple. You can change your dates or cancel online any time before
            pickup on the{" "}
            <Link href="/booking/manage" className="tap underline hover:text-clay">
              Manage booking
            </Link>{" "}
            page, with your booking number and email. There are no cancellation or processing fees.
          </p>
          <div>
            <h3 className="font-display text-2xl text-ink">Changing your dates</h3>
            <p className="mt-2">
              Free up to 24 hours before pickup. We reprice the trip for the new dates with the same
              campground, extras and transport; the deposit you paid stays with the booking and any
              difference is settled at pickup.
            </p>
          </div>
          <div>
            <h3 className="font-display text-2xl text-ink">Cancelling</h3>
            <p className="mt-2">
              <strong className="font-semibold text-ink">
                Cancellation is free within 24 hours of payment.
              </strong>{" "}
              After that, the deposit you paid when booking is refunded as below. The rest of the rental is
              paid only at pickup, so that is never at stake.
            </p>
            <dl className="mt-5 overflow-hidden rounded-md border border-line bg-white text-sm">
              {REFUNDS.map((r) => (
                <div
                  key={r.when}
                  className="grid gap-1 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-6"
                >
                  <dt>
                    {r.when}
                    {r.note && <span className="block text-xs text-muted">{r.note}</span>}
                  </dt>
                  <dd className="font-semibold text-ink">{r.refund}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm">
              Refunds go back to the card you paid with and usually appear within 5 to 10 days.
            </p>
          </div>
          <div>
            <h3 className="font-display text-2xl text-ink">If we have to cancel</h3>
            <p className="mt-2">
              If we ever need to cancel, or your campground closes, or severe weather makes the trip unsafe,
              you choose: a full refund or new dates at no cost.
            </p>
          </div>
        </Section>

        <Section id="security-deposit" number="02" title="Security deposit">
          <p>
            Every booking has one, the trailer on its own included. A refundable{" "}
            <Suspense fallback="security deposit">
              <DepositAmount />
            </Suspense>{" "}
            is held on your card at pickup and released after everything is returned and checked.
          </p>
        </Section>

        <Section id="rules" number="03" title="Trailer rules">
          <ol className="space-y-6">
            {RULES.map((r, i) => (
              <li key={r.title} className="flex gap-4">
                <span className="mt-1 font-display text-2xl leading-none text-clay">{i + 1}.</span>
                <span>
                  <span className="block font-display text-2xl text-ink">{r.title}</span>
                  <span className="mt-1 block">{r.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <p className="text-sm text-muted">
          Questions about any of this?{" "}
          <Link href="/contact" className="tap underline hover:text-clay">
            Write to us
          </Link>
          .
        </p>
      </main>
      <BookCta />
    </>
  );
}
