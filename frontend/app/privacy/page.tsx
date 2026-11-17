import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import LegalPage, { LegalSection } from "@/components/LegalPage";
import { SITE_NAME } from "@/lib/api";
import { OG, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Privacy Policy",
  description:
    "What we collect when you book or write to us, how it's protected (encrypted, license deleted after 30 days, cards handled by Stripe) and your choices.",
  path: "/privacy",
  image: OG.mountains,
});

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <LegalPage eyebrow="Privacy" title="Your information," accent="kept private." updated="November 16, 2026">
        <p>
          This policy explains what {SITE_NAME} (&ldquo;we&rdquo;) collects when you use this website, why, and how
          it&apos;s protected. We collect only what a booking needs, we never sell it, and we delete the most
          sensitive part, your driver&apos;s license, shortly after your trip.
        </p>

        <LegalSection title="What we collect, and why">
          <ul>
            <li>
              <strong>When you book:</strong> your name, email address, mobile phone, home address (optional), your
              driver&apos;s license number and a photo of the license, plus your dates, campground and extras. We need
              these to confirm who is responsible for the trailer, to reach you about your trip and to deliver it.
            </li>
            <li>
              <strong>When you pay:</strong> your card details go directly to Stripe, our payment processor. We never
              see or store your card number. Stripe sends us a confirmation and a payment reference.
            </li>
            <li>
              <strong>When you write to us:</strong> the name, email, phone and message you type in the contact form
              are emailed to us. They are not stored on the website.
            </li>
            <li>
              <strong>When you manage a booking:</strong> the booking number and email you enter are checked against
              the booking, so only you can change or cancel it.
            </li>
            <li>
              <strong>Technical data:</strong> like every website, our hosting records the pages requested and the
              connecting address in standard server logs, used for security and to keep the site running.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="How it's protected">
          <ul>
            <li>Your email, phone, address, license number and the license photo are stored encrypted.</li>
            <li>Only the owner can view booking details, after signing in. Nothing is shared with other guests.</li>
            <li>
              The license number and photo are deleted automatically 30 days after your rental is returned. The rest
              of the booking record (names, dates, amounts) is kept for our accounts and tax records.
            </li>
            <li>The site is served over HTTPS, so what you type is encrypted on its way to us.</li>
          </ul>
        </LegalSection>

        <LegalSection title="Who else sees it">
          <p>We share information only with services that help run a booking, and only what each one needs:</p>
          <ul>
            <li>
              <strong>Stripe</strong> handles payments and refunds (
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe&apos;s privacy policy</a>
              ).
            </li>
            <li>
              <strong>Our email provider</strong> delivers your confirmation and our replies.
            </li>
            <li>
              <strong>Map and place services:</strong> the campground map uses OpenStreetMap tiles; typing a place of
              your own sends what you type to a place search (Photon) and a road-distance service (OSRM) to price
              delivery. Like any web request, these see your connecting address.
            </li>
          </ul>
          <p>We don&apos;t sell personal information, and we don&apos;t use it for advertising.</p>
        </LegalSection>

        <LegalSection title="Cookies and tracking">
          <p>
            This site sets no advertising or analytics cookies and runs no trackers. The only thing kept in your
            browser is the owner&apos;s sign-in for the dashboard, which guests never see. If we add analytics later,
            we&apos;ll update this page first.
          </p>
        </LegalSection>

        <LegalSection title="Your choices">
          <ul>
            <li>
              You can ask us for a copy of the information we hold about you, ask us to correct it, or ask us to
              delete it (we keep what the law requires for accounts and tax). Write to us on the{" "}
              <Link href="/contact">contact page</Link>.
            </li>
            <li>You can change or cancel a booking yourself on the <Link href="/booking/manage">Manage booking</Link> page.</li>
            <li>The site works without creating an account; there is nothing to sign up for.</li>
          </ul>
        </LegalSection>

        <LegalSection title="Children">
          <p>Bookings are for adults (the driver must be at least 25). We don&apos;t knowingly collect information from children.</p>
        </LegalSection>

        <LegalSection title="Changes and contact">
          <p>
            If this policy changes, the date at the top changes with it. Questions about your information:{" "}
            <Link href="/contact">write to us</Link>, or by post to [Business legal name], [Mailing address].
          </p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
