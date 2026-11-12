export type Brief = {
  id: number;
  reference: string;
  status: string;
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
  addons: { code: string; name: string; days: number; total: string }[];
  addons_total: string;
  transport?: { code: "self" | "truck" | "delivery"; name: string; total: string; miles?: number | null };
  towing_experience?: boolean;
};

export type Detail = Summary & {
  security_deposit: string;
  emails_sent: boolean;
  customer: {
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
  occupancy: { days: number; nights_booked: number; percent: number };
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
};

export const STATUS_STYLE: Record<string, string> = {
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
