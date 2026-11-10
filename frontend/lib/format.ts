import { format, parseISO } from "date-fns";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function money(value: string | number): string {
  return usd.format(Number(value));
}

/** "$189" when whole, "$189.50" otherwise. For rate labels. */
export function rate(value: string | number): string {
  const n = Number(value);
  return Number.isInteger(n) ? usdWhole.format(n) : usd.format(n);
}

export function toISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Date-only strings are parsed as local dates (no timezone shift). */
export function fromISO(value: string): Date {
  return parseISO(value);
}

export function isISODate(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseISO(value).getTime());
}

export function longDate(value: string): string {
  return format(parseISO(value), "EEE, MMM d, yyyy");
}

export function shortDate(value: string): string {
  return format(parseISO(value), "MMM d, yyyy");
}
