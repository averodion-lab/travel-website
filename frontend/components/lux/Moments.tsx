"use client";

import Image from "next/image";
import Link from "next/link";
import InView from "./InView";
import useScrollProgress from "./useScrollProgress";

/** A photo that unveils, then drifts at its own speed while scrolling, so the
 *  collage has a little depth. */
function DriftPhoto({
  src,
  alt = "",
  className = "",
  speed = 8,
  delay = 0,
  position = "50% 50%",
}: {
  src: string;
  alt?: string;
  className?: string;
  speed?: number;
  delay?: number;
  position?: string;
}) {
  const [ref, p] = useScrollProgress<HTMLDivElement>();
  return (
    <div ref={ref} className={className}>
      <InView delay={delay} className="lux-clip relative h-full w-full overflow-hidden">
        <div className="absolute inset-x-0 -inset-y-[10%]" style={{ transform: `translateY(${(0.5 - p) * speed}%)` }}>
          <Image src={src} alt={alt} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" style={{ objectPosition: position }} />
        </div>
      </InView>
    </div>
  );
}

function Moment({ n, words, text }: { n: string; words: [string, string, boolean?]; text: string }) {
  const [plain, accent, accentFirst] = words;
  return (
    <InView className="lux-rise">
      <p className="text-xs text-muted">({n})</p>
      <h3 className="mt-2 font-display text-[1.6rem] leading-tight sm:text-4xl lg:mt-3 lg:text-5xl">
        {accentFirst ? (
          <>
            <em>{accent}</em> {plain}
          </>
        ) : (
          <>
            {plain} <em>{accent}</em>
          </>
        )}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm lg:mt-3">{text}</p>
    </InView>
  );
}

/** "Moments worth remembering": an uneven photo collage with four short
 *  moments of a stay (after the avenelle reference site). */
export default function Moments() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-14 pt-4 sm:px-8 sm:pb-20 sm:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-5 sm:gap-8">
        <InView className="lux-rise">
          <p className="lux-label text-clay">Moments kept</p>
          <h2 className="mt-6 font-display text-5xl leading-[1.02] sm:text-7xl">
            Moments worth
            <br />
            <em>remembering</em>
          </h2>
        </InView>
        <InView className="lux-rise max-w-sm" delay={150}>
          <p className="leading-relaxed text-muted">Out here, the smallest moments are often the ones you remember most.</p>
          <Link href="/gallery" className="tap lux-label mt-5 inline-block border-b border-ink pb-1">
            View the gallery ↗
          </Link>
        </InView>
      </div>

      {/* Phones and tablets: a 6-column collage (photos in pairs and offsets,
          text beside them). Large screens: the 12-column collage. */}
      <div className="mt-8 grid grid-cols-6 gap-3 sm:mt-12 sm:gap-4 lg:mt-12 lg:grid-cols-12 lg:gap-5">
        <DriftPhoto src="/images/lake-forest.jpg" alt="A forest lake at first light" className="col-span-3 aspect-[4/5] lg:col-span-4 lg:mt-12 lg:aspect-[5/4]" speed={6} />
        <div className="col-span-3 self-center lg:col-span-3 lg:self-start lg:pt-4">
          <Moment n="01" words={["mornings.", "Slow", true]} text="Coffee on the step, mist still on the lake." />
        </div>
        <DriftPhoto src="/images/blueridge-pink.jpg" alt="Blue Ridge ridgelines at dawn" className="col-span-5 col-start-2 aspect-[16/10] lg:col-span-5 lg:col-start-auto lg:aspect-[16/9]" speed={12} delay={150} />

        <DriftPhoto src="/images/montana/bedroom-2.jpg" alt="The king bedroom" className="col-span-3 aspect-square lg:col-span-3 lg:aspect-[4/3]" speed={4} />
        <DriftPhoto src="/images/smoky-meadow.jpg" alt="Horses in a meadow below the Smokies" className="col-span-3 mt-8 aspect-square lg:col-span-3 lg:mt-0 lg:aspect-[4/3]" speed={10} delay={120} />
        <div className="col-span-3 self-center lg:col-span-3 lg:self-start lg:pt-2">
          <Moment n="02" words={["Golden", "afternoons."]} text="Out on the water until the sun goes soft." />
        </div>
        <DriftPhoto src="/images/lake-jetski.jpg" alt="A jet ski on a lake at golden hour" position="62% 50%" className="col-span-3 aspect-[4/5] lg:col-span-3 lg:aspect-[4/3]" speed={7} delay={240} />

        <div className="col-span-3 self-center lg:col-span-3 lg:self-start lg:pt-4">
          <Moment n="03" words={["Long", "evenings."]} text="Chairs pulled close, the fire burning low." />
        </div>
        <DriftPhoto src="/images/campfire-night.jpg" alt="A campfire at night" className="col-span-3 aspect-[4/5] lg:col-span-6 lg:aspect-[2/1]" speed={9} />
        <div className="col-span-4 col-start-3 lg:col-span-3 lg:col-start-auto lg:pt-4">
          <Moment n="04" words={["Quiet", "nights."]} text="Nothing but the trees, and a sky full of stars." />
        </div>
      </div>
    </section>
  );
}
