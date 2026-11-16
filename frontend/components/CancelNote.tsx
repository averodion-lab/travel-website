import Link from "next/link";

/** Shown before guests pay: they can change or cancel, the first 24 hours
 *  are free, and the policy is one tap away. */
export default function CancelNote({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      You can change your dates or cancel your reservation online. Free cancellation within 24 hours of
      payment; after that, our cancellation policy applies.{" "}
      <Link href="/policies#cancellation" className="tap underline hover:text-clay" target="_blank">
        See details
      </Link>
    </span>
  );
}

/** "A refundable $2,000 security deposit…" only when one applies (our truck,
 *  a 4-wheeler or a jet ski); otherwise nothing. */
export function securityDepositText(amount: string, money: (v: string) => string) {
  return Number(amount) > 0
    ? `A refundable ${money(amount)} security deposit (for our truck, 4-wheeler or jet ski) is held at pickup and released after everything is returned and checked.`
    : "";
}
