import Image from "next/image";
import Link from "next/link";

/** Closing call to action used at the bottom of most pages. */
export default function BookCta({ image = "/images/smoky-sunset.jpg" }: { image?: string }) {
  return (
    <section className="relative px-5 py-32 text-center text-cream">
      <Image src={image} alt="" fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-ink/50" />
      <div className="relative">
        <h2 className="font-display text-6xl uppercase leading-[0.92] sm:text-7xl">Ready to book</h2>
        <p className="script -mt-1 text-6xl sm:text-7xl">your getaway?</p>
        <Link href="/book-now" className="btn btn-light mt-10">
          Book now
        </Link>
      </div>
    </section>
  );
}
