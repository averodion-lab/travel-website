"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

/** A row of photos that scrolls sideways: swipe on phones; on a computer use
 *  the arrow buttons, drag with the mouse or scroll with a trackpad. Each
 *  slide snaps into place. Clicking a photo (without dragging) opens it. */
function Carousel({
  photos,
  name,
  onOpen,
  large = false,
}: {
  photos: string[];
  name: string;
  onOpen: (i: number) => void;
  /** Bigger slides, for the Gallery page. */
  large?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  const [edges, setEdges] = useState({ start: true, end: false });
  const [index, setIndex] = useState(0);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft < 8,
      end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8,
    });
    const slide = el.firstElementChild as HTMLElement | null;
    if (slide) setIndex(Math.round(el.scrollLeft / (slide.offsetWidth + 16)));
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  function go(dir: number) {
    const el = track.current;
    const slide = el?.firstElementChild as HTMLElement | null;
    if (!el || !slide) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    el.scrollBy({
      left: dir * (slide.offsetWidth + 16),
      behavior: smooth ? "smooth" : "auto",
    });
  }

  // Mouse drag to scroll (touch already swipes natively).
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || !track.current) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startLeft: track.current.scrollLeft,
      moved: false,
    };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    const el = track.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      el.classList.add("is-dragging");
    }
    if (d.moved) el.scrollLeft = d.startLeft - dx;
  }
  function endDrag() {
    const d = drag.current;
    const el = track.current;
    if (!d.active || !el) return;
    d.active = false;
    el.classList.remove("is-dragging");
    if (d.moved) {
      // Settle on the nearest photo.
      const slide = el.firstElementChild as HTMLElement | null;
      if (slide) {
        const w = slide.offsetWidth + 16;
        el.scrollTo({
          left: Math.round(el.scrollLeft / w) * w,
          behavior: "smooth",
        });
      }
    }
  }

  const arrow =
    "flex h-12 w-12 items-center justify-center rounded-full border border-ink/20 bg-white text-xl shadow-sm transition-colors hover:bg-ink hover:text-cream disabled:pointer-events-none disabled:opacity-35";

  return (
    <div>
      <div
        ref={track}
        tabIndex={0}
        aria-label={`${name} photos, scroll sideways`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        className="photo-track -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 outline-none sm:-mx-8 sm:px-8"
      >
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => {
              if (!drag.current.moved) onOpen(i);
            }}
            className={`group relative shrink-0 snap-start overflow-hidden rounded-[1.75rem] bg-sand ${
              large
                ? "aspect-[4/3] w-[90%] sm:aspect-[3/2] sm:w-[80%] lg:w-[70%]"
                : "aspect-[4/3] w-[86%] sm:w-[62%] lg:w-[47%]"
            }`}
          >
            <Image
              src={src}
              alt={`${name}, photo ${i + 1}`}
              fill
              draggable={false}
              sizes={
                large
                  ? "(min-width:1024px) 70vw, (min-width:640px) 80vw, 90vw"
                  : "(min-width:1024px) 47vw, (min-width:640px) 62vw, 86vw"
              }
              className="pointer-events-none select-none object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="eyebrow tabular-nums text-muted" aria-live="polite">
          {String(Math.min(index + 1, photos.length)).padStart(2, "0")} /{" "}
          {String(photos.length).padStart(2, "0")}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={edges.start}
            aria-label="Previous photos"
            className={arrow}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={edges.end}
            aria-label="Next photos"
            className={arrow}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

/** Photos of the trailer: a grid (one large + four small), a masonry wall, or a
 *  sideways-scrolling row. All open a full-screen viewer. */
export default function Gallery({
  photos,
  name,
  layout = "grid",
}: {
  photos: string[];
  name: string;
  /** "slideshow": the carousel with big slides (Gallery page). */
  layout?: "grid" | "masonry" | "carousel" | "slideshow";
}) {
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
      {layout === "carousel" ? (
        <Carousel photos={photos} name={name} onOpen={setOpen} />
      ) : layout === "slideshow" ? (
        <Carousel photos={photos} name={name} onOpen={setOpen} large />
      ) : layout === "masonry" ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setOpen(i)}
              className={`group relative mb-4 block w-full overflow-hidden rounded-2xl bg-sand ${i % 5 === 0 ? "aspect-[4/5]" : i % 3 === 0 ? "aspect-square" : "aspect-[4/3]"}`}
            >
              <Image
                src={src}
                alt={`${name}, photo ${i + 1}`}
                fill
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/55 to-transparent p-5 text-cream opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="eyebrow">View larger</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="relative grid gap-2 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => setOpen(0)}
            className="group relative aspect-[4/3] overflow-hidden rounded-l-[1.5rem] bg-sand max-lg:rounded-[1.5rem]"
          >
            <Image
              src={hero}
              alt={name}
              fill
              priority
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </button>
          <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
            {rest.slice(0, 4).map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setOpen(i + 1)}
                className="group relative aspect-[4/3] overflow-hidden bg-sand"
              >
                <Image
                  src={src}
                  alt={`${name}, photo ${i + 2}`}
                  fill
                  sizes="(min-width:1024px) 25vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(0)}
            className="btn btn-light absolute bottom-4 right-4 !px-4 !py-2.5 shadow-lg"
          >
            Show all {count} photos
          </button>
        </div>
      )}

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photos`}
          className="fixed inset-0 z-50 flex flex-col bg-ink/95 text-cream"
        >
          <div className="flex items-center justify-between px-5 py-4">
            <p className="eyebrow">
              {open + 1} / {count}
            </p>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="eyebrow border border-cream/40 px-4 py-2 hover:bg-cream hover:text-ink"
            >
              Close
            </button>
          </div>
          <div className="relative flex-1" onClick={() => setOpen(null)}>
            <Image
              src={photos[open]}
              alt={`${name}, photo ${open + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <div className="flex items-center justify-center gap-4 px-5 py-5">
            <button
              type="button"
              onClick={() => step(-1)}
              className="btn btn-outline"
              aria-label="Previous photo"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className="btn btn-outline"
              aria-label="Next photo"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
