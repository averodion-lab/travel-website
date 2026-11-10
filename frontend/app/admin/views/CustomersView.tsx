"use client";

import { useEffect, useMemo, useState } from "react";
import { money, shortDate } from "@/lib/format";
import { StatusPill, type Call, type Customer } from "../types";

export default function CustomersView({ call, onOpen }: { call: Call; onOpen: (id: number) => void }) {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    call<{ customers: Customer[] }>("/api/admin/customers")
      .then((r) => setCustomers(r.customers))
      .catch((e: Error) => setError(e.message));
  }, [call]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (customers ?? []).filter(
      (c) => !q || c.name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q) || (c.phone ?? "").includes(q),
    );
  }, [customers, search]);

  return (
    <div className="rounded-2xl bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <p className="text-sm text-muted">
          {customers ? `${customers.length} ${customers.length === 1 ? "customer" : "customers"}` : "Loading…"}
        </p>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or phone"
          aria-label="Search customers"
          className="w-full rounded-full border border-line bg-cream/50 px-5 py-2.5 text-sm outline-none focus:border-pine sm:w-72"
        />
      </div>
      {error && <p className="px-5 pb-5 text-sm text-clay-dark" role="alert">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-y border-line/70">
            <tr>
              {["Customer", "Email", "Phone", "Trips", "Total spent", "Latest trip", ""].map((h, i) => (
                <th key={i} className="eyebrow px-5 py-3 text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {rows.map((c) => (
              <tr key={c.id} onClick={() => onOpen(c.last_booking_id)} className="cursor-pointer transition-colors hover:bg-cream">
                <td className="px-5 py-4">
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine text-xs font-semibold text-cream">
                      {c.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-medium">{c.name}</span>
                  </span>
                </td>
                <td className="px-5 py-4">
                  {c.email ? <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="hover:text-clay hover:underline">{c.email}</a> : "—"}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {c.phone ? <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="hover:text-clay hover:underline">{c.phone}</a> : "—"}
                </td>
                <td className="px-5 py-4 tabular-nums">{c.bookings}</td>
                <td className="px-5 py-4 tabular-nums">{money(c.total_spent)}</td>
                <td className="px-5 py-4 whitespace-nowrap">{shortDate(c.last_trip)}</td>
                <td className="px-5 py-4"><StatusPill status={c.last_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {customers && rows.length === 0 && <p className="p-12 text-center text-muted">{customers.length ? "No customers match." : "No customers yet."}</p>}
    </div>
  );
}
