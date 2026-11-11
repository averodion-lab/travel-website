/** Calendar rules for picking a stay, shared by the trailer page calendar and
 *  the pop-up date picker. Dates are half-open: a booking holds its pickup
 *  night up to (not including) its return day, so one guest's return day can
 *  be the next guest's pickup day. */
import { addDays, isSameDay } from "date-fns";
import type { DateRange, Matcher } from "react-day-picker";
import { fromISO } from "./format";

export type Booked = { start: string; end: string };

/** Nights already taken by other bookings. */
export function bookedNights(booked: Booked[]): Matcher[] {
  return booked.map((b) => ({ from: fromISO(b.start), to: addDays(fromISO(b.end), -1) }));
}

/** Days that can't be clicked right now. While choosing a return day, the trip
 *  must last at least `minNights` and can run up to the next booking's pickup
 *  day, but not past it. */
export function disabledDays(range: DateRange | undefined, booked: Booked[], today: Date, minNights: number): Matcher[] {
  const pickup = range?.from;
  if (!pickup || range?.to) return [{ before: today }, ...bookedNights(booked)];
  const next = booked.map((b) => fromISO(b.start)).find((start) => start > pickup);
  const rules: Matcher[] = [{ before: today }, ...bookedNights(booked.filter((b) => fromISO(b.start) < pickup))];
  if (minNights > 1) rules.push({ from: addDays(pickup, 1), to: addDays(pickup, minNights - 1) });
  if (next) rules.push({ after: next });
  return rules;
}

/** First click picks the pickup day, the second the return day. Clicking the
 *  pickup day again clears it; clicking an earlier day starts over from there. */
export function nextRange(range: DateRange | undefined, day: Date): DateRange | undefined {
  const pickup = range?.from;
  if (!pickup || range?.to) return { from: day, to: undefined };
  if (isSameDay(day, pickup)) return undefined;
  if (day < pickup) return { from: day, to: undefined };
  return { from: pickup, to: day };
}
