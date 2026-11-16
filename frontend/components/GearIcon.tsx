/** Safety gear that comes with an extra: a helmet (4-wheeler) or a life
 *  jacket (jet ski), drawn as a small 2D icon beside its label. */
export default function GearIcon({ gear, className = "" }: { gear: string; className?: string }) {
  if (!gear) return null;
  const helmet = /helmet/i.test(gear);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-pine ${className}`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {helmet ? (
          // Helmet: dome, visor and chin guard
          <path d="M3.5 15a8.5 8.5 0 0 1 17 0v1.5H14l-2 3H6.5a3 3 0 0 1-3-3V15ZM20.5 13H13v3.5M8 7.5c1.2-.8 2.5-1.2 4-1.2" />
        ) : (
          // Life jacket: two front panels, collar and buckles
          <path d="M8 3.5 5.5 6v13.5h5.5V9L9.5 4.5M16 3.5 18.5 6v13.5H13V9l1.5-4.5M9.5 4.5h5M5.5 12.5h5.5M13 12.5h5.5M5.5 16h5.5M13 16h5.5" />
        )}
      </svg>
      {gear}
    </span>
  );
}
