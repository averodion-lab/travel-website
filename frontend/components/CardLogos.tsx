/** Accepted card brands, shown near anything payment related.
 *  Simple inline marks so nothing is loaded from another site. */
const box = "h-8 w-[3.1rem] rounded-[4px] border border-line bg-white";

export function Visa() {
  return (
    <svg viewBox="0 0 62 40" className={box} role="img" aria-label="Visa">
      <text x="31" y="27" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="19" fontWeight="900" fontStyle="italic" fill="#1a1f71" letterSpacing="0.5">
        VISA
      </text>
    </svg>
  );
}

export function Mastercard() {
  return (
    <svg viewBox="0 0 62 40" className={box} role="img" aria-label="Mastercard">
      <circle cx="25" cy="20" r="11" fill="#eb001b" />
      <circle cx="37" cy="20" r="11" fill="#f79e1b" />
      <path d="M31 10.8a11 11 0 0 1 0 18.4 11 11 0 0 1 0-18.4Z" fill="#ff5f00" />
    </svg>
  );
}

export function Amex() {
  return (
    <svg viewBox="0 0 62 40" className={`${box} !border-[#1f72cd]`} role="img" aria-label="American Express">
      <rect width="62" height="40" fill="#1f72cd" />
      <text x="31" y="18" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="8.5" fontWeight="800" fill="#fff" letterSpacing="0.6">
        AMERICAN
      </text>
      <text x="31" y="29" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="8.5" fontWeight="800" fill="#fff" letterSpacing="0.6">
        EXPRESS
      </text>
    </svg>
  );
}

export function Lock({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export default function CardLogos({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Visa />
      <Mastercard />
      <Amex />
    </div>
  );
}
