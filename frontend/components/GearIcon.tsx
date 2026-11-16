/** Safety gear that comes with an extra: a helmet (4-wheeler) or a life
 *  jacket (jet ski), drawn as a small detailed 2D icon beside its label. */
export default function GearIcon({ gear, className = "" }: { gear: string; className?: string }) {
  if (!gear) return null;
  const helmet = /helmet/i.test(gear);
  return (
    <span className={`inline-flex items-center gap-2 text-[0.7rem] font-medium text-pine ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {helmet ? (
          // Off-road helmet: shaded shell, peak, visor opening, chin bar,
          // vents and a racing stripe
          <>
            <path
              className="fill-current opacity-20"
              d="M3.5 14.5A8.5 8.5 0 0 1 20.5 13v2.5h-6.8l-1.9 3.5H6.6a3.1 3.1 0 0 1-3.1-3.1Z"
            />
            <path d="M3.5 14.5A8.5 8.5 0 0 1 20.5 13v2.5h-6.8l-1.9 3.5H6.6a3.1 3.1 0 0 1-3.1-3.1Z" />
            <path d="M13 6.3 22 8.6l-1.5 2.1-7-1.6" />
            <path d="M20.5 12.6h-7.2v2.9" />
            <path d="M6 9.8c1.6-2 3.8-3.2 6.4-3.4" />
            <path d="M8 16.5h2.6M7.6 18.2h2.2" />
            <path d="M5.5 12.5h.01M7.2 12h.01" strokeWidth="1.6" />
          </>
        ) : (
          // Life jacket: shaded foam panels, collar, zip, three buckles and straps
          <>
            <path
              className="fill-current opacity-20"
              d="M8.2 3.5 5 6.5v13a1 1 0 0 0 1 1h5.3V9.2L9.6 4.6ZM15.8 3.5 19 6.5v13a1 1 0 0 1-1 1h-5.3V9.2l1.7-4.6Z"
            />
            <path d="M8.2 3.5 5 6.5v13a1 1 0 0 0 1 1h5.3V9.2L9.6 4.6M15.8 3.5 19 6.5v13a1 1 0 0 1-1 1h-5.3V9.2l1.7-4.6" />
            <path d="M9.6 4.6c1.4 1 3.4 1 4.8 0" />
            <path d="M12 9.5v11" strokeDasharray="0.9 0.9" strokeWidth="0.8" />
            <path d="M5 11h14M5 14.5h14M5 18h14" strokeWidth="0.9" />
            <rect x="10.4" y="10.2" width="3.2" height="1.6" rx=".4" />
            <rect x="10.4" y="13.7" width="3.2" height="1.6" rx=".4" />
            <rect x="10.4" y="17.2" width="3.2" height="1.6" rx=".4" />
          </>
        )}
      </svg>
      {gear}
    </span>
  );
}
