import type { Metadata } from "next";
import Link from "next/link";
import BookCta from "@/components/BookCta";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about a stay, a campground or your dates? Send us a message and we'll reply within a day.",
};

const TOPICS = [
  ["A campground that isn't listed", "Tell us where; we'll check the site fits a 40-foot trailer and work out delivery."],
  ["Longer stays and special dates", "Anniversaries, holidays, a week or more by the lake: just ask."],
  ["Extras and setup", "The 4-wheeler, the jet ski, bikes and anything else you'd like waiting for you."],
];

export default function ContactPage() {
  return (
    <>
      <Header overlay />
      <PageHero image="/images/lake-forest.jpg" eyebrow="Contact" title="Let's plan" accent="your stay." />
      <main className="mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div>
          <p className="lux-label text-clay">Write to us</p>
          <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">
            Questions, ideas, <em>special requests.</em>
          </h2>
          <p className="mt-5 leading-relaxed text-muted">
            Send a message and we&apos;ll reply within a day. Ready to book? You can{" "}
            <Link href="/book-now" className="text-ink underline">
              reserve online
            </Link>{" "}
            and see your exact price.
          </p>
          <ul className="mt-12 space-y-8">
            {TOPICS.map(([title, text]) => (
              <li key={title} className="border-t border-line pt-5">
                <p className="font-display text-2xl">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
        <ContactForm />
      </main>
      <BookCta />
    </>
  );
}
