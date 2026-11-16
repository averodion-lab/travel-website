import Image from "next/image";

/** 3D models of the extras (public/images/icons, transparent PNGs). */
export const ADDON_ICONS: Record<string, { src: string; alt: string }> = {
  atv: { src: "/images/icons/atv.png", alt: "4-wheeler" },
  jetski: { src: "/images/icons/jetski.png", alt: "Jet ski" },
};

/** The e-bike has no 3D model yet, so it gets a drawn bicycle with a bolt. */
function EbikeDrawing() {
  return (
    <svg viewBox="0 0 48 48" className="h-[70%] w-[70%]" fill="none" stroke="#2f3a2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Electric bike" role="img">
      <circle cx="12" cy="31" r="8" />
      <circle cx="36" cy="31" r="8" />
      <path d="M12 31l7-13h11l6 13M19 18l7 13h-14M26 31l4-13M16 13h6M30 18l-2-5h4" />
      <path d="M22 22l-2 4h3l-2 4" stroke="#9c7b4b" strokeWidth="1.8" />
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
