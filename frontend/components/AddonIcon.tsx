import Image from "next/image";

/** 3D models of the extras (public/images/icons, transparent PNGs). */
export const ADDON_ICONS: Record<string, { src: string; alt: string }> = {
  atv: { src: "/images/icons/atv.png", alt: "4-wheeler" },
  jetski: { src: "/images/icons/jetski.png", alt: "Jet ski" },
};

/** An extra's symbol: its mini 3D model in a small round white badge. */
export default function AddonIcon({ code, size = 52, className = "" }: { code: string; size?: number; className?: string }) {
  const icon = ADDON_ICONS[code];
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
