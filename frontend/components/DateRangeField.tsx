"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  addMonths,
  differenceInCalendarDays,
  format,
  startOfDay,
} from "date-fns";
import { DayPicker, type DateRange } from "react-day-picker";
import { api } from "@/lib/api";
import { fromISO, isISODate, toISO } from "@/lib/format";
import { bookedNights, disabledDays, nextRange, type Booked } from "@/lib/stay";

const short = (iso: string) => format(fromISO(iso), "EEE, MMM d");

/** A "Dates" field that opens a two-month calendar in a pop-up (a sheet from
 *  the bottom on phones). Booked nights are greyed out and the same rules as
 *  the trailer page apply: minimum stay, and no running into the next booking.
 *  The pop-up is rendered at the end of <body> so no card can clip it. */
export default function DateRangeField({
  camperSlug,
  minNights,
  start,
  end,
  onChange,
  className = "",
}: {
  camperSlug: string;
  minNights: number;
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  className?: string;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [booked, setBooked] = useState<Booked[]>([]);
  const [loadError, setLoadError] = useState("");
  const [wide, setWide] = useState(true);
  const [pos, setPos] = useState<CSSProperties>({});

  useEffect(() => {
    api<{ booked: Booked[] }>(`/api/campers/${camperSlug}/availability`)
      .then((r) => setBooked(r.booked))
      .catch(() =>
        setLoadError(
          "We couldn't load which dates are taken. You'll see them on the next step.",
        ),
      );
  }, [camperSlug]);

  const range: DateRange | undefined = useMemo(
    () =>
      isISODate(start)
        ? {
            from: fromISO(start),
            to: isISODate(end) ? fromISO(end) : undefined,
          }
        : undefined,
    [start, end],
  );
  const today = useMemo(() => startOfDay(new Date()), []);
  const disabled = useMemo(
    () => disabledDays(range, booked, today, minNights),
    [range, booked, today, minNights],
  );
  const taken = useMemo(() => bookedNights(booked), [booked]);
  const nights =
    range?.from && range?.to
      ? differenceInCalendarDays(range.to, range.from)
      : 0;

  // Place the pop-up under the field (desktop) and keep it there while scrolling.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const isWide = window.innerWidth >= 768;
      setWide(isWide);
      const r = button.current?.getBoundingClientRect();
      if (!isWide || !r) return setPos({});
      const width = Math.min(740, window.innerWidth - 32);
      const left = Math.min(
        Math.max(16, r.left),
        window.innerWidth - width - 16,
      );
      // Use the pop-up's real height once it has rendered.
      const height = Math.min(panel.current?.offsetHeight || 480, window.innerHeight - 32);
      const below = r.bottom + 10;
      const above = r.top - 10 - height;
      // Below the field if it fits, else above it, else as low as fits on screen.
      const top =
        below + height <= window.innerHeight - 16
          ? below
          : above >= 16
            ? above
            : Math.max(16, window.innerHeight - height - 16);
      setPos({ top, left, width, maxHeight: window.innerHeight - 32, overflowY: "auto" });
    };
    // Measure again after the pop-up has rendered at its real size.
    requestAnimationFrame(place);
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  // Close on Escape or a click outside.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !button.current?.contains(t))
        setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  function pick(day: Date) {
    const next = nextRange(range, day);
    onChange(
      next?.from ? toISO(next.from) : "",
      next?.to ? toISO(next.to) : "",
    );
    if (next?.to) setTimeout(() => setOpen(false), 350); // let them see the range, then close
  }

  const summary =
    start && end ? (
      <>
        {short(start)} <span className="text-muted">to</span> {short(end)}
        <span className="text-muted"> · {nights} nights</span>
      </>
    ) : start ? (
      <>
        {short(start)} <span className="text-muted">to … pick your return</span>
      </>
    ) : (
      <span className="text-muted">Choose your dates</span>
    );

  const hint = !range?.from
    ? "Pick your pickup day"
    : !range.to
      ? `Now pick your return day (${minNights}-night minimum)`
      : `${nights} nights selected`;

  const popup = open && (
    <>
      {!wide && (
        <div className="fixed inset-0 z-[60] bg-ink/40" aria-hidden="true" />
      )}
      <div
        ref={panel}
        role="dialog"
        aria-label="Choose your dates"
        style={wide ? pos : undefined}
        className={
          wide
            ? "pop-in fixed z-[60] rounded-[1.75rem] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(33,29,26,0.45)]"
            : "sheet-in fixed inset-x-0 bottom-0 z-[60] max-h-[90vh] overflow-y-auto rounded-t-[1.75rem] bg-white px-5 pb-8 pt-5 shadow-2xl"
        }
      >
        <div className="flex items-center justify-between gap-4">
          <p className="font-display text-2xl">{hint}</p>
          <div className="flex items-center gap-3">
            {range?.from && (
              <button
                type="button"
                onClick={() => onChange("", "")}
                className="eyebrow text-clay hover:underline"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-lg hover:bg-sand"
            >
              ×
            </button>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={(_, day) => pick(day)}
            disabled={disabled}
            modifiers={{ booked: taken }}
            modifiersClassNames={{ booked: "rdp-booked" }}
            numberOfMonths={wide ? 2 : 1}
            startMonth={today}
            endMonth={addMonths(today, 24)}
            defaultMonth={range?.from ?? today}
            style={
              {
                "--rdp-day_button-border-radius": "9999px",
                "--rdp-months-gap": "2.25rem",
                // A little smaller than the trailer page calendar, so two months fit side by side.
                "--rdp-day-width": "2.55rem",
                "--rdp-day-height": "2.55rem",
                "--rdp-day_button-width": "2.4rem",
                "--rdp-day_button-height": "2.4rem",
              } as CSSProperties
            }
          />
        </div>
        <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-line pt-4 text-xs text-muted">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-ink" /> Available
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-line" /> Not available
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-pine" /> Selected
          </li>
        </ul>
        {loadError && (
          <p className="mt-3 text-center text-xs text-clay-dark">{loadError}</p>
        )}
      </div>
    </>
  );

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        // The button's hit area covers its whole (positioned) box, so tapping
        // anywhere on "Pickup and return" opens the calendar.
        className={`w-full text-left text-sm outline-none after:absolute after:inset-0 after:content-[''] ${className}`}
      >
        {summary}
      </button>
      {popup && createPortal(popup, document.body)}
    </>
  );
}
