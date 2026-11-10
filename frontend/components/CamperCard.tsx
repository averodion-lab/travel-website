import Image from "next/image";
import Link from "next/link";
import type { Camper } from "@/lib/api";
import { rate } from "@/lib/format";

export default function CamperCard({ camper, query = "" }: { camper: Camper; query?: string }) {
  const facts = [
    `Sleeps ${camper.sleeps}`,
    camper.length_ft ? `${camper.length_ft} ft` : null,
    camper.towing_weight_lbs ? `${camper.towing_weight_lbs.toLocaleString()} lbs` : "Drivable",
  ].filter(Boolean);

  return (
    <Link
      href={`/fleet/${camper.slug}${query}`}
      className="group flex flex-col border border-line bg-white/60 transition-shadow hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {camper.image_url && (
          <Image
            src={camper.image_url}
            alt={camper.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <span className="eyebrow absolute left-4 top-4 bg-cream px-3 py-1.5 text-ink">{camper.class_type}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-3xl leading-tight">{camper.name}</h3>
        {camper.layout && <p className="mt-1 text-sm text-muted">{camper.layout}</p>}
        <p className="eyebrow mt-4 text-bark">{facts.join("  ·  ")}</p>
        <div className="mt-auto flex items-end justify-between border-t border-line pt-5 mt-6">
          <p>
            <span className="font-display text-3xl">{rate(camper.daily_rate)}</span>
            <span className="text-sm text-muted"> / night</span>
          </p>
          <span className="eyebrow text-clay transition-transform group-hover:translate-x-1">View →</span>
        </div>
      </div>
    </Link>
  );
}
