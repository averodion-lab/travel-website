import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import LegalPage, { LegalSection } from "@/components/LegalPage";
import { SITE_NAME } from "@/lib/api";
import { OG, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Terms of Service",
  description:
    "The terms for using this website and renting the trailer: booking and payment, cancellation, the security deposit, your responsibilities and ours.",
  path: "/terms",
  image: OG.trailer,
});

export default function TermsPage() {
  return (
    <>
      <Header />
      <LegalPage eyebrow="Terms" title="The agreement," accent="in plain words." updated="November 16, 2026">
        <p>
          These terms apply to this website and to every rental booked through it. By booking you agree to them,
          to our <Link href="/policies">policies and trailer rules</Link> and to our{" "}
          <Link href="/privacy">privacy policy</Link>. &ldquo;We&rdquo; means [Business legal name], trading as{" "}
          {SITE_NAME}.
        </p>

        <LegalSection title="1. Booking and payment">
          <ul>
            <li>
              A booking is confirmed when the deposit shown at checkout has been paid. Until then your dates are held
              for about 35 minutes while you pay. Prices are set by us and shown in full before you pay.
            </li>
            <li>The rest of the rental is due at pickup or delivery, by card.</li>
            <li>
              The person booking must be at least 25, hold a valid driver&apos;s license and be present at handover.
              The license you upload is checked against the person who takes the trailer.
            </li>
            <li>
              If you tow the trailer yourself, with your own truck or ours, you confirm that you have experience
              towing a large fifth-wheel trailer. Renting our truck also requires a valid license and insurance that
              covers you to drive it.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="2. Cancellation and changes">
          <p>
            Our <Link href="/policies#cancellation">cancellation policy</Link> is part of these terms: cancellation
            is free within 24 hours of payment, then the deposit is refunded on the scale shown there; date changes
            are free up to 24 hours before pickup. If we have to cancel, you choose a full refund or new dates.
          </p>
        </LegalSection>

        <LegalSection title="3. Security deposit">
          <p>
            When you rent our truck, a 4-wheeler or a jet ski, a refundable security deposit (the amount is shown
            before you pay) is held on your card at pickup. It is released after everything is returned and
            checked. Damage, loss, missing fuel, fines or extra cleaning caused during your rental may be deducted
            from it; if the cost is higher than the deposit, you agree to pay the difference. We&apos;ll show you
            what was found before anything is charged.
          </p>
        </LegalSection>

        <LegalSection title="4. Using the trailer and equipment">
          <ul>
            <li>
              Use them only as intended and in line with the <Link href="/policies#rules">trailer rules</Link>: no
              smoking inside, return it clean, follow the campground&apos;s rules, and keep to the campsite you
              booked.
            </li>
            <li>
              Only people named at booking may tow the trailer or drive our truck. Jet skis and 4-wheelers may be used
              only where the law and the park allow, by adults wearing the safety gear provided.
            </li>
            <li>Tell us straight away about any damage, fault or accident. Don&apos;t attempt repairs yourself.</li>
            <li>
              No subletting, no commercial use, no transporting the trailer outside the agreed area without asking
              us first.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="5. Responsibility">
          <ul>
            <li>
              You are responsible for the trailer and equipment from handover until we take them back, including
              while towing. Insurance for towing with your own vehicle is yours to arrange; check with your insurer.
            </li>
            <li>
              We keep the trailer and equipment in good, safe condition and hand them over clean and ready. If
              something we provide fails during your stay, tell us and we&apos;ll fix or replace it as quickly as we
              can, or refund the part of your rental affected.
            </li>
            <li>
              Camping and water sports carry their own risks. Within the limits of the law, our responsibility to
              you is limited to the amount you paid for the rental, and we are not responsible for weather,
              campground closures or things outside our control (though you can still cancel or move your dates as
              set out above).
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="6. This website">
          <ul>
            <li>
              The text, photos and design of this site belong to us or are used under license. You may not copy or
              reuse them without written permission.
            </li>
            <li>
              Don&apos;t misuse the site: no automated bookings, no attempts to access other people&apos;s bookings
              or the owner dashboard, no false information.
            </li>
            <li>We may update these terms; the date at the top shows the current version. Bookings already made keep the terms shown when they were made.</li>
          </ul>
        </LegalSection>

        <LegalSection title="7. Law and contact">
          <p>
            These terms are governed by the laws of the State of Georgia, USA. If something goes wrong, please{" "}
            <Link href="/contact">write to us</Link> first; we&apos;d much rather sort it out together. Post: [Business
            legal name], [Mailing address].
          </p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
