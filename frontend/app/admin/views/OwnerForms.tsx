"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { api, type Addon, type Camper, type Park, type ParksResponse, type QuoteResponse, type TransportCode } from "@/lib/api";
import { codesOf, onlyOffered, qtyOf, withQty } from "@/lib/addons";
import { money } from "@/lib/format";
import type { Call, Summary } from "../types";

/** A centred dialog over the dashboard; Escape or the backdrop closes it. */
function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto bg-cream px-6 py-7 shadow-2xl sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-4xl leading-none">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-lg hover:bg-ink hover:text-cream" aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function errorText(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

/** Dates the owner keeps for personal use or maintenance. */
export function BlockForm({ call, onClose, onSaved }: { call: Call; onClose: () => void; onSaved: (b: Summary) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await call<{ booking: Summary }>("/api/admin/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: form.get("start"), end: form.get("end"), note: form.get("note") }),
      });
      onSaved(res.booking);
    } catch (e) {
      setError(errorText(e, "Couldn't block those dates."));
      setBusy(false);
    }
  }

  return (
    <Dialog title="Block dates" onClose={onClose}>
      <p className="mt-3 text-sm text-muted">
        Guests will see these nights as taken. The minimum stay doesn&apos;t apply. Remove the block from the calendar to open them up again.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First night" htmlFor="block-start">
            <input id="block-start" name="start" type="date" required className="field" />
          </Field>
          <Field label="Free again on" htmlFor="block-end" hint="The day it can be picked up again.">
            <input id="block-end" name="end" type="date" required className="field" />
          </Field>
        </div>
        <Field label="Note (only you see it)" htmlFor="block-note">
          <input id="block-note" name="note" maxLength={500} placeholder="Family trip, maintenance…" className="field" />
        </Field>
        {error && <p className="text-sm text-clay-dark" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-dark w-full">{busy ? "Saving…" : "Block these dates"}</button>
      </form>
    </Dialog>
  );
}

/** A booking taken by phone: same prices and rules as online, confirmed straight away. */
export function PhoneBookingForm({ call, onClose, onSaved }: { call: Call; onClose: () => void; onSaved: (b: Summary) => void }) {
  const [catalog, setCatalog] = useState<{ parks: Park[]; addons: Addon[]; camper: string } | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [park, setPark] = useState("");
  const [addons, setAddons] = useState<string[]>([]);
  const [transport, setTransport] = useState<TransportCode>("self");
  const [towing, setTowing] = useState(false);
  const [quote, setQuote] = useState<{ key: string; total?: string; available?: boolean; error?: string } | null>(null);
  const [override, setOverride] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api<ParksResponse>("/api/parks"), api<{ campers: Camper[] }>("/api/campers")])
      .then(([p, c]) => setCatalog({ parks: p.parks, addons: p.addons, camper: c.campers[0]?.slug ?? "" }))
      .catch((e) => setError(errorText(e, "Couldn't load the campgrounds.")));
  }, []);

  const chosenPark = catalog?.parks.find((p) => p.slug === park) ?? null;
  const offered = useMemo(() => {
    if (!catalog) return [];
    const atPark = new Set(chosenPark?.addons.map((a) => a.code) ?? []);
    return catalog.addons.filter((a) => a.terrain === "any" || atPark.has(a.code));
  }, [catalog, chosenPark]);
  const picked = onlyOffered(addons, offered.map((a) => a.code));
  const mode: TransportCode = transport === "delivery" && !chosenPark ? "self" : transport;

  // Live price from the server, the same quote guests get.
  const camper = catalog?.camper ?? "";
  const quoteKey = JSON.stringify([camper, start, end, park, picked, mode, towing]);
  useEffect(() => {
    if (!camper || !start || !end || end <= start) return;
    let live = true;
    api<QuoteResponse>("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ camper, start, end, park, addons: picked, transport: mode, towing_experience: towing }),
    })
      .then((r) => live && setQuote({ key: quoteKey, total: r.quote.total, available: r.available }))
      .catch((e) => live && setQuote({ key: quoteKey, error: errorText(e, "No price for these dates.") }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey]);
  const shownQuote = quote?.key === quoteKey && start && end && end > start ? quote : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await call<{ booking: Summary }>("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          camper,
          start,
          end,
          park,
          addons: picked,
          transport: mode,
          towing_experience: towing,
          first_name: form.get("first_name"),
          last_name: form.get("last_name"),
          phone: form.get("phone"),
          email: form.get("email"),
          address: form.get("address"),
          license_number: form.get("license_number"),
          amount_paid: form.get("amount_paid") || "0",
          total_override: override ? form.get("total_override") : null,
          note: form.get("note"),
          send_email: form.get("send_email") === "on",
        }),
      });
      onSaved(res.booking);
    } catch (e) {
      setError(errorText(e, "Couldn't save the booking."));
      setBusy(false);
    }
  }

  return (
    <Dialog title="New phone booking" onClose={onClose}>
      <p className="mt-3 text-sm text-muted">Priced by the same rules as online bookings and confirmed straight away. No card is charged here.</p>
      <form onSubmit={submit} className="mt-6 space-y-6">
        <fieldset className="space-y-4">
          <legend className="eyebrow mb-3 text-clay">Trip</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pickup" htmlFor="pb-start">
              <input id="pb-start" type="date" required value={start} onChange={(e) => setStart(e.target.value)} className="field" />
            </Field>
            <Field label="Return" htmlFor="pb-end">
              <input id="pb-end" type="date" required value={end} onChange={(e) => setEnd(e.target.value)} className="field" />
            </Field>
          </div>
          <Field label="Campground" htmlFor="pb-park">
            <select id="pb-park" value={park} onChange={(e) => setPark(e.target.value)} className="field">
              <option value="">Not decided yet</option>
              {catalog?.parks.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}, {p.state}</option>
              ))}
            </select>
          </Field>
          {offered.length > 0 && (
            <div>
              <p className="label">Extras</p>
              <div className="space-y-2">
                {offered.map((a) => {
                  const qty = qtyOf(picked, a.code);
                  return (
                    <div key={a.code} className="flex items-center justify-between gap-4 border border-line bg-white px-4 py-2.5 text-sm">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={qty > 0} onChange={(e) => setAddons(withQty(picked, a.code, e.target.checked ? 1 : 0))} />
                        {a.name} <span className="text-muted">{money(a.daily_rate)}/day</span>
                      </label>
                      {a.max_qty > 1 && qty > 0 && (
                        <select aria-label={`How many ${a.name}`} value={qty} onChange={(e) => setAddons(withQty(picked, a.code, Number(e.target.value)))} className="border border-line bg-cream px-2 py-1">
                          {Array.from({ length: a.max_qty }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <Field label="Getting there" htmlFor="pb-transport">
            <select id="pb-transport" value={mode} onChange={(e) => setTransport(e.target.value as TransportCode)} className="field">
              <option value="self">Guest tows it with their own truck</option>
              <option value="truck">Guest rents our truck</option>
              <option value="delivery" disabled={!chosenPark}>Delivery and setup{chosenPark ? ` (${chosenPark.delivery_miles} mi)` : " (pick a campground first)"}</option>
            </select>
          </Field>
          {mode !== "delivery" && (
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={towing} onChange={(e) => setTowing(e.target.checked)} className="mt-1" />
              The guest confirmed they have experience towing a fifth wheel.
            </label>
          )}
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="eyebrow mb-3 text-clay">Guest</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="pb-first"><input id="pb-first" name="first_name" required maxLength={80} className="field" /></Field>
            <Field label="Last name" htmlFor="pb-last"><input id="pb-last" name="last_name" required maxLength={80} className="field" /></Field>
            <Field label="Phone" htmlFor="pb-phone"><input id="pb-phone" name="phone" type="tel" required maxLength={40} className="field" /></Field>
            <Field label="Email (optional)" htmlFor="pb-email"><input id="pb-email" name="email" type="email" maxLength={200} className="field" /></Field>
          </div>
          <Field label="Address (optional)" htmlFor="pb-address"><input id="pb-address" name="address" maxLength={300} className="field" /></Field>
          <Field label="Driver's license no. (optional)" htmlFor="pb-license" hint="You can check the license itself at pickup.">
            <input id="pb-license" name="license_number" maxLength={60} className="field" />
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="eyebrow mb-3 text-clay">Money</legend>
          <div className="flex items-baseline justify-between border border-line bg-white px-4 py-3 text-sm">
            <span className="text-muted">Usual price</span>
            <span className="font-semibold tabular-nums">
              {!shownQuote ? "Pick dates" : shownQuote.error ? <span className="font-normal text-clay-dark">{shownQuote.error}</span> : money(shownQuote.total!)}
            </span>
          </div>
          {shownQuote && shownQuote.available === false && (
            <p className="text-sm text-clay-dark" role="alert">Those dates overlap another booking or block.</p>
          )}
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
            Charge a different price
          </label>
          {override && (
            <Field label="Price for the whole trip ($)" htmlFor="pb-override">
              <input id="pb-override" name="total_override" type="number" min="0" step="0.01" required className="field" />
            </Field>
          )}
          <Field label="Paid so far ($)" htmlFor="pb-paid" hint="What the guest has already paid you. The rest shows as due at pickup.">
            <input id="pb-paid" name="amount_paid" type="number" min="0" step="0.01" defaultValue="0" className="field" />
          </Field>
          <Field label={override ? "Why the different price (only you see it)" : "Note (only you see it)"} htmlFor="pb-note">
            <input id="pb-note" name="note" maxLength={500} required={override} className="field" />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="send_email" />
            Email the guest a confirmation (needs an email above)
          </label>
        </fieldset>

        {error && <p className="text-sm text-clay-dark" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-dark w-full">{busy ? "Saving…" : "Save booking"}</button>
        {codesOf(addons).length !== picked.length && (
          <p className="text-xs text-muted">Extras not offered at this campground were dropped.</p>
        )}
      </form>
    </Dialog>
  );
}
