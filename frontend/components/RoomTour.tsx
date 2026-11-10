"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export type Room = { name: string; text: string; image: string };

const SECONDS = 6;

/** Walk through the trailer room by room. Advances on its own; hovering or
 *  choosing a room pauses it. */
export default function RoomTour({ rooms }: { rooms: Room[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || rooms.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => setActive((i) => (i + 1) % rooms.length), SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [active, paused, rooms.length]);

  return (
    <div
      className="grid gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-sand lg:aspect-auto lg:min-h-[34rem]">
        {rooms.map((room, i) => (
          <Image
            key={room.image}
            src={room.image}
            alt={room.name}
            fill
            sizes="(min-width:1024px) 60vw, 100vw"
            className={`object-cover transition-all duration-[1200ms] ease-out ${i === active ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-ink/70 to-transparent p-6 text-cream sm:p-8">
          <p className="font-display text-4xl sm:text-5xl">{rooms[active].name}</p>
          <p className="eyebrow tabular-nums">
            {String(active + 1).padStart(2, "0")} / {String(rooms.length).padStart(2, "0")}
          </p>
        </div>
      </div>

      <ol className="flex flex-col justify-center">
        {rooms.map((room, i) => {
          const on = i === active;
          return (
            <li key={room.name} className="border-t border-ink/15 last:border-b">
              <button
                type="button"
                onClick={() => {
                  setActive(i);
                  setPaused(true);
                }}
                aria-current={on}
                className="group relative block w-full py-5 text-left"
              >
                {on && !paused && (
                  <span key={active} className="tour-progress absolute left-0 top-[-1px] h-[2px] bg-clay" style={{ animationDuration: `${SECONDS}s` }} />
                )}
                <span className="flex items-baseline gap-5">
                  <span className={`eyebrow tabular-nums transition-colors ${on ? "text-clay" : "text-muted"}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={`font-display text-3xl transition-all duration-300 sm:text-4xl ${on ? "translate-x-1 text-ink" : "text-ink/35 group-hover:text-ink/70"}`}>
                    {room.name}
                  </span>
                </span>
                <span className={`grid transition-all duration-500 ${on ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <span className="overflow-hidden pl-11 text-sm leading-relaxed text-bark">{room.text}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
