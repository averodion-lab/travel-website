import Image from "next/image";

/** 3D icons for the extras (public/images/icons, transparent PNGs). */
export const ADDON_ICONS: Record<string, { src: string; alt: string }> = {
  atv: { src: "/images/icons/atv.png", alt: "4-wheeler" },
  jetski: { src: "/images/icons/jetski.png", alt: "Jet ski" },
};

export default function AddonIcon({ code, size = 96, className = "" }: { code: string; size?: number; className?: string }) {
  const icon = ADDON_ICONS[code];
  if (!icon) return null;
  return (
    <Image
      src={icon.src}
      alt={icon.alt}
      width={size}
      height={size}
      sizes={`${size}px`}
      className={`pointer-events-none select-none object-contain drop-shadow-[0_10px_14px_rgba(33,29,26,0.25)] ${className}`}
    />
  );
}
