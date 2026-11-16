import Image from "next/image";

/** 3D models of the extras (public/images/icons, transparent PNGs). */
export const ADDON_ICONS: Record<string, { src: string; alt: string }> = {
  atv: { src: "/images/icons/atv.png", alt: "4-wheeler" },
  jetski: { src: "/images/icons/jetski.png", alt: "Jet ski" },
};

/** The e-bike has no 3D model yet, so it gets a detailed drawing: spoked
 *  wheels with tyres, frame, battery on the down tube, hub motor, saddle,
 *  handlebars, chain ring and a brass charge bolt. */
function EbikeDrawing() {
  const spokes = (cx: number) =>
    [0, 30, 60, 90, 120, 150].map((a) => {
      const r = (a * Math.PI) / 180;
      const dx = Math.cos(r) * 7.2;
      const dy = Math.sin(r) * 7.2;
      return <path key={`${cx}-${a}`} d={`M${cx - dx} ${31 - dy}L${cx + dx} ${31 + dy}`} strokeWidth="0.5" opacity="0.55" />;
    });
  return (
    <svg viewBox="0 0 48 48" className="h-[78%] w-[78%]" fill="none" stroke="#2f3a2c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-label="Electric bike" role="img">
      {/* wheels: tyre, rim, spokes, hub */}
      {[11, 37].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="31" r="9" strokeWidth="2.2" />
          <circle cx={cx} cy="31" r="7.4" strokeWidth="0.7" />
          {spokes(cx)}
        </g>
      ))}
      <circle cx="11" cy="31" r="2.4" fill="#9c7b4b" stroke="#2f3a2c" strokeWidth="1" />
      <circle cx="37" cy="31" r="1" fill="#2f3a2c" />
      {/* frame */}
      <path d="M11 31 17.5 19H31L37 31M17.5 19 24 31H11M24 31 31 19" strokeWidth="1.8" />
      {/* battery on the down tube */}
      <path d="M25.6 21.2 29.4 21.6 26.4 28.6 22.8 27.6Z" fill="#9c7b4b" fillOpacity="0.25" strokeWidth="1.1" />
      <path d="M26.2 23.6 25 26.2" stroke="#9c7b4b" strokeWidth="1.1" />
      {/* seat post, saddle */}
      <path d="M17.5 19 16.4 15.5" strokeWidth="1.6" />
      <path d="M13 15c1.5-.9 4.5-1 7 0-1.2.9-4.5 1.1-7 0Z" fill="#2f3a2c" strokeWidth="1" />
      {/* stem, handlebar, grip */}
      <path d="M31 19 29.4 12.5M27 12.2h4.6c1 0 1.6.8 1.6 1.6" strokeWidth="1.6" />
      <path d="M33.2 13.8v1.4" strokeWidth="2.2" />
      {/* chain ring, crank, pedal, chain */}
      <circle cx="24" cy="31" r="2.6" strokeWidth="1.2" />
      <path d="M24 31l1.8 3.4M24.6 34.6h2.6" strokeWidth="1.3" />
      <path d="M24 28.4 11 30M24 33.6 11 32" strokeWidth="0.6" opacity="0.6" />
      {/* fenders */}
      <path d="M30.4 24.6a9.6 9.6 0 0 1 13.4 1.6M4.4 24.4A9.6 9.6 0 0 1 9 21.6" strokeWidth="0.9" opacity="0.7" />
      {/* charge bolt */}
      <path d="M40.5 5.5 37.5 10.5h3l-2.5 5 5.5-6.5h-3l2-3.5Z" fill="#9c7b4b" stroke="#9c7b4b" strokeWidth="0.8" />
    </svg>
  );
}

/** An extra's symbol: its mini 3D model (or drawing) in a small round white badge. */
export default function AddonIcon({ code, size = 52, className = "" }: { code: string; size?: number; className?: string }) {
  const icon = ADDON_ICONS[code];
  if (code === "ebike") {
    return (
      <span
        className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),0_4px_10px_-4px_rgba(0,0,0,0.35)] ${className}`}
        style={{ width: size, height: size }}
      >
        <EbikeDrawing />
      </span>
    );
  }
  if (!icon) return null;
  return (
    <span
      className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),0_4px_10px_-4px_rgba(0,0,0,0.35)] ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={icon.src}
        alt={icon.alt}
        width={size * 2}
        height={size * 2}
        sizes={`${size}px`}
        className="pointer-events-none h-[92%] w-[92%] select-none object-contain"
      />
    </span>
  );
}
