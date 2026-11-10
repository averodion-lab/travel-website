"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

/** Photo grid (one large + four small) that opens a full-screen viewer. */
export default function Gallery({ photos, name, layout = "grid" }: { photos: string[]; name: string; layout?: "grid" | "masonry" }) {
  const [open, setOpen] = useState<number | null>(null);
  const count = photos.length;

  const step = useCallback(
    (by: number) => setOpen((i) => (i === null ? i : (i + by + count) % count)),
    [count],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, step]);

  if (count === 0) return null;
  const [hero, ...rest] = photos;

  return (
    <>
      {layout === "masonry" ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setOpen(i)}
              className={`group relative mb-4 block w-full overflow-hidden rounded-2xl bg-sand ${i % 5 === 0 ? "aspect-[4/5]" : i % 3 === 0 ? "aspect-square" : "aspect-[4/3]"}`}
            >
              <Image src={src} alt={`${name}, photo ${i + 1}`} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/55 to-transparent p-5 text-cream opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="eyebrow">View larger</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
      <div className="relative grid gap-2 lg:grid-cols-2">
        <button type="button" onClick={() => setOpen(0)} className="group relative aspect-[4/3] overflow-hidden rounded-l-[1.5rem] bg-sand max-lg:rounded-[1.5rem]">
          <Image src={hero} alt={name} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        </button>
        <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
          {rest.slice(0, 4).map((src, i) => (
            <button key={src} type="button" onClick={() => setOpen(i + 1)} className="group relative aspect-[4/3] overflow-hidden bg-sand">
              <Image src={src} alt={`${name}, photo ${i + 2}`} fill sizes="(min-width:1024px) 25vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setOpen(0)} className="btn btn-light absolute bottom-4 right-4 !px-4 !py-2.5 shadow-lg">
          Show all {count} photos
        </button>
      </div>
      )}

      {open !== null && (
        <div role="dialog" aria-modal="true" aria-label={`${name} photos`} className="fixed inset-0 z-50 flex flex-col bg-ink/95 text-cream">
          <div className="flex items-center justify-between px-5 py-4">
            <p className="eyebrow">{open + 1} / {count}</p>
            <button type="button" onClick={() => setOpen(null)} className="eyebrow border border-cream/40 px-4 py-2 hover:bg-cream hover:text-ink">
              Close
            </button>
          </div>
          <div className="relative flex-1" onClick={() => setOpen(null)}>
            <Image src={photos[open]} alt={`${name}, photo ${open + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
          <div className="flex items-center justify-center gap-4 px-5 py-5">
            <button type="button" onClick={() => step(-1)} className="btn btn-outline" aria-label="Previous photo">← Prev</button>
            <button type="button" onClick={() => step(1)} className="btn btn-outline" aria-label="Next photo">Next →</button>
          </div>
        </div>
      )}
    </>
  );
}
