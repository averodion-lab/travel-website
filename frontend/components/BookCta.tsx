import Link from "next/link";
import InView from "@/components/lux/InView";
import { SettlingPhotoSection } from "@/components/lux/ScrollEffects";

/** Closing call to action at the bottom of most pages: the campfire photo
 *  settles as it scrolls in, and the text rises into place. */
export default function BookCta({ image = "/images/campfire-night.jpg" }: { image?: string }) {
  return (
    <SettlingPhotoSection src={image} overlay="bg-black/50" className="flex min-h-[80svh] items-center justify-center text-center text-cream">
      <InView className="lux-rise relative px-6">
        <p className="lux-label text-[#d8bd86]">Reserve your stay</p>
        <h2 className="mx-auto mt-6 max-w-3xl font-display text-5xl leading-[1.05] sm:text-7xl">
          Your stay in nature, <em>prepared for you.</em>
        </h2>
        <Link href="/book-now" className="btn btn-light lux-shine mt-10">
          Check availability
        </Link>
      </InView>
    </SettlingPhotoSection>
  );
}
