import Image from "next/image";
import Treeline from "@/components/Treeline";

/** Photo banner at the top of the inner pages. Sits under the overlay header. */
export default function PageHero({
  image,
  eyebrow,
  title,
  accent,
  text,
  seed = 9,
}: {
  image: string;
  eyebrow: string;
  title: string;
  accent?: string;
  text?: string;
  /** Varies the treeline so each page's banner looks a little different. */
  seed?: number;
}) {
  return (
    <section className="relative flex min-h-[32rem] flex-col items-center justify-end overflow-hidden px-5 pb-32 pt-40 text-center text-cream sm:min-h-[38rem] sm:pb-40">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-zoom object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/30 to-ink/75" />
      <Treeline color="var(--color-cream)" height={170} seed={seed} />
      <div className="rise relative">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 font-display text-6xl uppercase leading-[0.92] tracking-tight sm:text-8xl">
          {title}
        </h1>
        {accent && (
          <p className="script -mt-2 text-5xl sm:text-6xl">{accent}</p>
        )}
        {text && (
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-cream/85">
            {text}
          </p>
        )}
      </div>
    </section>
  );
}
