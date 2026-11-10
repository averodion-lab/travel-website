"use client";

import { useMemo, useState } from "react";
import { money, shortDate } from "@/lib/format";
import { StatusPill, type Summary } from "../types";

const FILTERS = [
  ["", "All"],
  ["confirmed", "Confirmed"],
  ["pending", "Awaiting payment"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
] as const;

export default function BookingsView({ bookings, selectedId, onOpen }: { bookings: Summary[]; selectedId: number | null; onOpen: (id: number) => void }) {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter(
      (b) =>
        (!status || b.status === status) &&
        (!q || b.customer_name.toLowerCase().includes(q) || b.reference.toLowerCase().includes(q)),
    );
  }, [bookings, status, search]);

  return (
    <div className="rounded-2xl bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(([value, label]) => {
            const count = value ? bookings.filter((b) => b.status === value).length : bookings.length;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${status === value ? "bg-ink text-cream" : "bg-cream text-bark hover:bg-sand"}`}
              >
                {label} <span className="tabular-nums opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or booking no."
          aria-label="Search bookings"
          className="w-full rounded-full border border-line bg-cream/50 px-5 py-2.5 text-sm outline-none focus:border-pine sm:w-72"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-y border-line/70">
            <tr>
              {["Customer", "Booking", "Dates", "Nights", "Total", "Due at pickup", "Status"].map((h) => (
                <th key={h} className="eyebrow px-5 py-3 text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {rows.map((b) => (
              <tr key={b.id} onClick={() => onOpen(b.id)} className={`cursor-pointer transition-colors hover:bg-cream ${selectedId === b.id ? "bg-cream" : ""}`}>
                <td className="px-5 py-4 font-medium">{b.customer_name}</td>
                <td className="px-5 py-4 font-mono text-xs text-muted">{b.reference}</td>
                <td className="px-5 py-4 whitespace-nowrap">{shortDate(b.start_date)} to {shortDate(b.end_date)}</td>
                <td className="px-5 py-4 tabular-nums">{b.days}</td>
                <td className="px-5 py-4 tabular-nums">{money(b.total_price)}</td>
                <td className="px-5 py-4 tabular-nums text-muted">{b.status === "confirmed" ? money(b.balance_due) : "—"}</td>
                <td className="px-5 py-4"><StatusPill status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="p-12 text-center text-muted">{bookings.length ? "No bookings match." : "No bookings yet."}</p>}
    </div>
  );
}
