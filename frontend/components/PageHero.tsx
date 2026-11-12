import Image from "next/image";

/** Photo banner at the top of the inner pages. Sits under the overlay header. */
export default function PageHero({
  image,
  eyebrow,
  title,
  accent,
  text,
}: {
  image: string;
  eyebrow: string;
  title: string;
  accent?: string;
  text?: string;
  /** No longer used (the treeline was removed); kept so pages still compile. */
  seed?: number;
}) {
  return (
    <section className="relative flex min-h-[32rem] flex-col items-center justify-end overflow-hidden px-5 pb-24 pt-40 text-center text-cream sm:min-h-[34rem] sm:pb-20">
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/65" />
      <div className="relative">
        <p className="lux-label lux-fade" style={{ animationDelay: "0.15s" }}>
          {eyebrow}
        </p>
        <h1 className="mt-5 font-display text-6xl font-normal leading-[1.02] sm:text-8xl">
          <span className="lux-line">
            <span style={{ animationDelay: "0.3s" }}>{title}</span>
          </span>
          {accent && (
            <span className="lux-line">
              <em style={{ animationDelay: "0.5s" }}>{accent}</em>
            </span>
          )}
        </h1>
        {text && (
          <p className="lux-fade mx-auto mt-6 max-w-xl leading-relaxed text-cream/85" style={{ animationDelay: "0.7s" }}>
            {text}
          </p>
        )}
      </div>
    </section>
  );
}
