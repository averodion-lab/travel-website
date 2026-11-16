"use client";

import AddonIcon from "@/components/AddonIcon";
import GearIcon from "@/components/GearIcon";
import type { Addon } from "@/lib/api";
import { rate } from "@/lib/format";

/** One extra in a booking form: tick it to add it; extras that come in more
 *  than one (e-bikes, up to 3) then show a − n + control. Safety gear that
 *  comes with it (helmet, life jacket) is shown with a small icon. */
export default function ExtraOption({
  addon,
  offered,
  qty,
  onChange,
  note,
  compact = false,
}: {
  addon: Addon;
  offered: boolean;
  /** 0 = not added. */
  qty: number;
  onChange: (qty: number) => void;
  /** Shown instead of the description when it isn't offered here. */
  note?: string;
  compact?: boolean;
}) {
  const on = qty > 0;
  const many = addon.max_qty > 1;
  const price = `+ ${rate(addon.daily_rate)}/day${many ? " each" : ""}`;
  return (
    <div
      className={`rounded-md border-2 bg-white transition-colors ${
        !offered ? "border-line opacity-55" : on ? "border-pine bg-pine/5" : "border-line hover:border-pine"
      }`}
    >
      <label className={`flex items-center gap-3 ${compact ? "px-3 py-2.5" : "gap-4 px-4 py-3"} ${offered ? "cursor-pointer" : "cursor-not-allowed"}`}>
        <input
          type="checkbox"
          checked={on}
          disabled={!offered}
          onChange={() => onChange(on ? 0 : 1)}
          className={`${compact ? "h-4 w-4" : "h-5 w-5"} shrink-0 accent-pine`}
        />
        <AddonIcon code={addon.code} size={compact ? 34 : 44} className={offered ? "" : "grayscale"} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className={`font-medium ${compact ? "text-sm" : ""}`}>{addon.name}</span>
            <span className={`font-semibold ${compact ? "text-xs" : "text-sm"} ${compact ? "" : "sm:hidden"}`}>{price}</span>
          </span>
          {!compact && (
            <span className="mt-0.5 block text-xs text-muted">{offered ? addon.description : note}</span>
          )}
          {compact && !offered && note && <span className="block text-xs text-muted">{note}</span>}
          {offered && addon.gear && <GearIcon gear={addon.gear} className="mt-1" />}
        </span>
        {!compact && <span className="hidden shrink-0 text-sm font-semibold sm:inline">{price}</span>}
      </label>

      {many && on && (
        <div className={`flex items-center justify-between border-t border-line/70 ${compact ? "px-3 py-2" : "px-4 py-2.5"}`}>
          <span className="text-xs text-muted">How many? (up to {addon.max_qty})</span>
          <span className="flex items-center gap-1" role="group" aria-label={`Number of ${addon.name.toLowerCase()}s`}>
            <button
              type="button"
              onClick={() => onChange(qty - 1)}
              aria-label="One fewer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-lg hover:border-pine"
            >
              −
            </button>
            <span className="w-8 text-center font-display text-2xl tabular-nums" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => onChange(Math.min(addon.max_qty, qty + 1))}
              disabled={qty >= addon.max_qty}
              aria-label="One more"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-lg hover:border-pine disabled:opacity-40"
            >
              +
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
