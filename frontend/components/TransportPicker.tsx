"use client";

import type { Park, TransportCode, TransportInfo } from "@/lib/api";
import { money, rate } from "@/lib/format";

/** "How will the trailer get there?": tow it with your own truck, rent ours
 *  (towing experience required) or have it delivered and set up, priced by
 *  the mile. Prices shown here are previews; the server's quote is the price. */
export default function TransportPicker({
  info,
  park,
  nights,
  value,
  onChange,
  experience,
  onExperience,
  compact = false,
}: {
  info: TransportInfo;
  park: Park | null;
  nights: number;
  value: TransportCode;
  onChange: (code: TransportCode) => void;
  experience: boolean;
  onExperience: (on: boolean) => void;
  /** Smaller cards, for the trailer page's side panel. */
  compact?: boolean;
}) {
  const perMile = Number(info.delivery.per_mile);
  const deliveryTotal = park
    ? perMile * park.delivery_miles * info.delivery.trips
    : 0;
  const truckRate = Number(info.truck.daily_rate);

  const options: {
    code: TransportCode;
    title: string;
    detail: string;
    price: string;
    disabled?: boolean;
  }[] = [
    {
      code: "self",
      title: "Tow it with my truck",
      detail: "Needs a one-ton truck with a fifth-wheel hitch.",
      price: "Included",
    },
    {
      code: "truck",
      title: "Rent our truck",
      detail: `${info.truck.name}, black. For drivers with experience towing a large trailer.`,
      price:
        nights > 0
          ? `${rate(truckRate)}/day · ${money(truckRate * nights)}`
          : `${rate(truckRate)}/day`,
    },
    {
      code: "delivery",
      title: "Delivery and setup",
      detail: park
        ? `We bring it to ${park.name}, level it and hook it up, and collect it after your trip. ${park.delivery_miles} miles from ${info.base}, charged one way.`
        : "We bring it to your campsite and set it up. Choose a campground from the list to see the price.",
      price: park
        ? `${rate(perMile)}/mile · ${money(deliveryTotal)}`
        : `${rate(perMile)}/mile`,
      disabled: !park,
    },
  ];

  return (
    <div
      className={compact ? "space-y-2" : "space-y-3"}
      role="radiogroup"
      aria-label="How will the trailer get there?"
    >
      {options.map((o) => {
        const on = value === o.code;
        return (
          <div key={o.code}>
            <label
              className={`flex items-start gap-3 rounded-xl border-2 bg-white transition-colors ${compact ? "px-3 py-2.5" : "px-4 py-3.5"} ${
                o.disabled
                  ? "cursor-not-allowed border-line opacity-55"
                  : on
                    ? "cursor-pointer border-pine"
                    : "cursor-pointer border-line hover:border-pine"
              }`}
            >
              <input
                type="radio"
                name={compact ? "transport-compact" : "transport"}
                checked={on}
                disabled={o.disabled}
                onChange={() => onChange(o.code)}
                className="mt-1 h-4 w-4 shrink-0 accent-pine"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className={`font-medium ${compact ? "text-sm" : ""}`}>
                    {o.title}
                  </span>
                  <span
                    className={`font-semibold ${compact ? "text-xs" : "text-sm"}`}
                  >
                    {o.price}
                  </span>
                </span>
                {(!compact || on || o.code === "delivery") && (
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                    {o.detail}
                  </span>
                )}
              </span>
            </label>
            {o.code === "truck" && on && (
              <label
                className={`mt-2 flex items-start gap-3 rounded-xl bg-cream text-sm leading-relaxed ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}
              >
                <input
                  type="checkbox"
                  checked={experience}
                  onChange={(e) => onExperience(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-pine"
                />
                <span>
                  I have experience towing a large fifth-wheel trailer (about 40
                  ft, up to 17,070 lb loaded).
                </span>
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Short label for the getting-there line in price summaries. */
export function transportLabel(t: {
  code: string;
  name: string;
  miles?: number | null;
  days?: number;
}) {
  if (t.code === "delivery")
    return t.miles ? `${t.name} (${t.miles} mi)` : t.name;
  if (t.code === "truck")
    return t.days ? `Truck rental × ${t.days} days` : "Truck rental";
  return t.name;
}

/** Turns URL values into a valid choice (anything unknown means "self"). */
export function parseTransport(value: string | null): TransportCode {
  return value === "truck" || value === "delivery" ? value : "self";
}
