export type Brief = {
  id: number;
  reference: string;
  status: string;
  /** "guest" booked online, "phone" added by the owner, "block" dates the owner keeps. */
  kind: "guest" | "phone" | "block";
  customer_name: string;
  start_date: string;
  end_date: string;
  days: number;
  total_price: string;
  balance_due: string;
};

export type Summary = Brief & {
  camper: string;
  deposit_due: string;
  created_at: string;
  park: { slug: string; name: string; city?: string; state?: string } | null;
  /** A place the guest typed in (park slug "custom"), decrypted for the owner. */
  place?: { name: string; lat: number; lng: number } | null;
  addons: { code: string; name: string; days: number; total: string }[];
  addons_total: string;
  transport?: { code: "self" | "truck" | "delivery"; name: string; total: string; miles?: number | null };
  /** Last day the guest can cancel or change dates free of charge. */
  free_change_until?: string;
  refunded_amount?: string | null;
  towing_experience?: boolean;
  /** Owner's own note (block reason, phone price reason). */
  note: string | null;
  emails_sent: boolean;
};

export type Detail = Summary & {
  security_deposit: string;
  /** Null for blocked dates. */
  customer: null | {
    email: string | null;
    phone: string | null;
    address: string | null;
    license_number: string | null;
    has_license_file: boolean;
    license_purged: boolean;
  };
};

export type Month = { month: string; revenue: string; nights: number; bookings: number };

export type Overview = {
  today: string;
  revenue: { booked: string; collected: string; outstanding: string; average_booking: string };
  counts: { upcoming: number; pending: number; completed: number; total: number };
  occupancy: { days: number; nights_booked: number; nights_blocked: number; percent: number };
  months: Month[];
  open_windows: { start: string; end: string; nights: number }[];
  open_until: string;
  current: Brief | null;
  next_pickup: Brief | null;
  next_return: Brief | null;
  calendar: Brief[];
};

export type Customer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  bookings: number;
  total_spent: string;
  last_trip: string;
  last_status: string;
  last_booking_id: number;
  since: string;
};

/** Calls the admin API with the owner's token. */
export type Call = <T>(path: string, init?: RequestInit) => Promise<T>;

export const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  pending: "Awaiting payment",
  completed: "Completed",
  cancelled: "Cancelled",
  blocked: "Blocked",
};

/** The pill for a booking: blocks read "Blocked" whatever their status. */
export function pillStatus(b: { kind: string; status: string }): string {
  return b.kind === "block" && b.status !== "cancelled" ? "blocked" : b.status;
}

export const STATUS_STYLE: Record<string, string> = {
  blocked: "bg-[#8a8170] text-cream",
  confirmed: "bg-pine text-cream",
  pending: "bg-[#e9c46a] text-ink",
  completed: "bg-bark/15 text-bark",
  cancelled: "border border-line text-muted",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.14em] ${STATUS_STYLE[status] ?? ""}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
