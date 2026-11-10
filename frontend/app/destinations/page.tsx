import type { Metadata } from "next";
import Image from "next/image";
import BookCta from "@/components/BookCta";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Where to take a luxury fifth wheel in the Southeast: the Smokies, the Blue Ridge and the lakes in between.",
};

const PLACES = [
  {
    name: "Great Smoky Mountains",
    place: "Tennessee and North Carolina",
    image: "/images/smoky-valley.jpg",
    text: "Misty ridgelines, old-growth forest and some of the best fall color in the country. Base yourself at a full-hookup campground near the park and spend the days on scenic drives, waterfall hikes and quiet valley roads.",
    best: "Spring wildflowers, October color",
  },
  {
    name: "Blue Ridge Parkway",
    place: "North Carolina",
    image: "/images/blueridge-rays.jpg",
    text: "Hundreds of miles of overlooks strung along the crest of the mountains. Park the trailer once at a campground in the valley and take the truck up for sunrise.",
    best: "Late spring through fall",
  },
  {
    name: "Autumn Ridgelines",
    place: "Southern Appalachians",
    image: "/images/blueridge-fall.jpg",
    text: "North Georgia and the western Carolinas turn gold and red a little later than the high peaks, which stretches leaf season well into November.",
    best: "Mid October to mid November",
  },
  {
    name: "Quiet Lakes",
    place: "Across the Southeast",
    image: "/images/lake-fall.jpg",
    text: "Mountain reservoirs and lowland lakes with waterfront RV sites. Bring the kayaks, keep the awning out and let the fireplace handle the cool evenings.",
    best: "Year round",
  },
];

const SITE_NEEDS = [
  ["Site length", "A pull-through or back-in site of 45 feet or more."],
  ["Power", "50 amp electric service."],
  ["Hookups", "Water and sewer at the site for the full-comfort experience."],
  ["Access", "Paved or well-graded roads without low bridges. The trailer stands 13 ft 4 in tall."],
];

export default function DestinationsPage() {
  return (
    <>
      <Header overlay />
      <PageHero
        image="/images/smoky-fall.jpg"
        eyebrow="Where to go"
        title="Mountains, lakes"
        accent="and open road"
        text="A few favorites within a day's drive. Tell us where you're headed and we'll help you pick a campground that fits the trailer."
      />

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="grid gap-x-8 gap-y-16 md:grid-cols-2">
          {PLACES.map((p, i) => (
            <article key={p.name}>
              <div className="group relative aspect-[4/3] overflow-hidden bg-sand">
                <Image src={p.image} alt={p.name} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <p className="eyebrow mt-6 text-clay">({String(i + 1).padStart(2, "0")}) {p.place}</p>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl">{p.name}</h2>
              <p className="mt-4 leading-relaxed text-bark">{p.text}</p>
              <p className="eyebrow mt-5 text-muted">Best time: {p.best}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-sand/50">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow text-clay">Choosing a campground</p>
            <h2 className="mt-4 font-display text-5xl sm:text-6xl">What the trailer needs.</h2>
            <p className="mt-6 max-w-md leading-relaxed text-bark">
              At forty feet it is a big rig, so not every campsite fits. Look for these four things when you reserve
              your site, or ask us before you book.
            </p>
          </div>
          <dl className="divide-y divide-line border-y border-line">
            {SITE_NEEDS.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
                <dt className="eyebrow pt-1 text-bark">{label}</dt>
                <dd className="text-sm leading-relaxed">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <BookCta image="/images/blueridge-pink.jpg" />
    </>
  );
}
