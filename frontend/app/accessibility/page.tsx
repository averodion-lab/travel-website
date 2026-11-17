import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import LegalPage, { LegalSection } from "@/components/LegalPage";
import { OG, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Accessibility Statement",
  description:
    "How this site is built to be usable by everyone (WCAG 2.1 AA is the goal), what still falls short, and how to get help if something gets in the way.",
  path: "/accessibility",
  image: OG.lake,
});

export default function AccessibilityPage() {
  return (
    <>
      <Header />
      <LegalPage eyebrow="Accessibility" title="For everyone," accent="as far as we can." updated="November 16, 2026">
        <p>
          We want anyone to be able to read this site and book the trailer, whatever device or assistive technology
          they use. Our goal is the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA.
        </p>

        <LegalSection title="What we've done">
          <ul>
            <li>Every page has a clear heading structure and can be read in order without the pictures.</li>
            <li>Photos carry descriptions; purely decorative images are hidden from screen readers.</li>
            <li>Text and controls meet the contrast guideline, and text can be enlarged in the browser.</li>
            <li>Everything in the booking flow, the calendar and the forms works with a keyboard and has visible focus.</li>
            <li>Form fields are labelled, errors are announced, and fields are large enough to tap on a phone.</li>
            <li>Animations are switched off when your device asks for reduced motion.</li>
          </ul>
        </LegalSection>

        <LegalSection title="Where it falls short">
          <ul>
            <li>
              The campground map is visual by nature. Everything shown on it is also available as text: the{" "}
              <Link href="/destinations">list of campgrounds</Link> and each park&apos;s own page.
            </li>
            <li>
              Payment happens on Stripe&apos;s checkout page, which follows Stripe&apos;s accessibility practices
              rather than ours.
            </li>
            <li>Some photos were taken by the dealer and we are still writing better descriptions for a few of them.</li>
          </ul>
        </LegalSection>

        <LegalSection title="If something gets in the way">
          <p>
            Tell us and we&apos;ll help, including taking your booking by email if a page won&apos;t work for you:{" "}
            <Link href="/contact">write to us</Link>. We&apos;ll reply within a day, and we&apos;ll fix what we can on the site.
          </p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
