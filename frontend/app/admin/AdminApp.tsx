"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, API_URL, ApiError, SITE_NAME } from "@/lib/api";
import type { Call, Detail, Overview, Summary } from "./types";
import BookingDrawer from "./views/BookingDrawer";
import BookingsView from "./views/BookingsView";
import CalendarView from "./views/CalendarView";
import CustomersView from "./views/CustomersView";
import OverviewView from "./views/OverviewView";

const TOKEN_KEY = "admin_token";

// The token lives in sessionStorage: closing the tab signs the owner out.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function storeToken(token: string | null) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
  listeners.forEach((l) => l());
}

export default function AdminApp() {
  const token = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(TOKEN_KEY),
    () => undefined, // unknown while rendering on the server
  );
  const signOut = useCallback(() => storeToken(null), []);

  if (token === undefined) return null;
  if (!token) return <Login onToken={storeToken} />;
  return <Dashboard token={token} signOut={signOut} />;
}

function Login({ onToken }: { onToken: (token: string) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const res = await api<{ token: string }>("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      onToken(res.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid overflow-y-auto bg-cream lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image src="/images/blueridge-rays.jpg" alt="" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="absolute inset-x-12 bottom-12 text-cream">
          <p className="font-display text-6xl uppercase leading-[0.9]">{SITE_NAME}</p>
          <p className="script mt-2 text-5xl">Owner dashboard</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-cream px-6 py-16">
        <form onSubmit={submit} className="w-full max-w-sm">
          <p className="eyebrow text-clay">Welcome back</p>
          <h1 className="mt-3 font-display text-5xl">Owner sign in</h1>
          <div className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoComplete="username" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-clay-dark" role="alert">{error}</p>}
          <button type="submit" disabled={busy} className="btn btn-dark mt-7 w-full">
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <Link href="/" className="eyebrow mt-8 inline-block text-muted hover:text-ink">← Back to website</Link>
        </form>
      </div>
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview", icon: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" },
  { id: "calendar", label: "Calendar", icon: "M7 2v3M17 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" },
  { id: "bookings", label: "Bookings", icon: "M5 4h14v17l-3.5-2-3.5 2-3.5-2L5 21V4Zm4 5h6M9 13h6" },
  { id: "customers", label: "Customers", icon: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 19v-1a4 4 0 0 0-3-3.9M15.5 3.2a3.5 3.5 0 0 1 0 6.6" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function Dashboard({ token, signOut }: { token: string; signOut: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bookings, setBookings] = useState<Summary[] | null>(null);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [error, setError] = useState("");

  const call = useCallback<Call>(
    async (path, init) => {
      try {
        return await api(path, {
          ...init,
          headers: { ...init?.headers, Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) signOut();
        throw e;
      }
    },
    [token, signOut],
  );

  const load = useCallback(() => {
    Promise.all([
      call<Overview>("/api/admin/overview"),
      call<{ bookings: Summary[] }>("/api/admin/bookings"),
    ])
      .then(([o, b]) => {
        setOverview(o);
        setBookings(b.bookings);
      })
      .catch((e: Error) => setError(e.message));
  }, [call]);

  useEffect(load, [load]);

  const open = useCallback(
    async (id: number) => {
      setError("");
      try {
        setSelected((await call<{ booking: Detail }>(`/api/admin/bookings/${id}`)).booking);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't load the booking.");
      }
    },
    [call],
  );
  const close = useCallback(() => setSelected(null), []);

  async function setBookingStatus(id: number, next: "completed" | "cancelled") {
    const question =
      next === "cancelled"
        ? "Cancel this booking? The dates will open up for other customers. Refund the deposit in Stripe separately."
        : "Mark as completed? Do this once the trailer is returned and inspected.";
    if (!window.confirm(question)) return;
    try {
      await call(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      load();
      await open(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  }

  async function viewLicense(id: number) {
    // Fetched with the admin token and shown from memory; there is no public URL.
    const tabWindow = window.open("", "_blank");
    try {
      const res = await fetch(`${API_URL}/api/admin/bookings/${id}/license`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Couldn't load the license.");
      const url = URL.createObjectURL(await res.blob());
      if (tabWindow) tabWindow.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      tabWindow?.close();
      setError(e instanceof Error ? e.message : "Couldn't load the license.");
    }
  }

  const title = TABS.find((t) => t.id === tab)!.label;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#ece7da] lg:pl-64">
      {/* The dashboard covers the whole window, site footer included. Sidebar is a bottom bar on phones. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex bg-ink text-cream lg:inset-y-0 lg:right-auto lg:w-64 lg:flex-col" aria-label="Admin">
        <div className="hidden px-7 pb-8 pt-8 lg:block">
          <Link href="/" className="font-display text-2xl uppercase tracking-[0.12em]">{SITE_NAME}</Link>
          <p className="eyebrow mt-2 text-cream/40">Owner dashboard</p>
        </div>
        <ul className="flex flex-1 lg:flex-col lg:gap-1 lg:px-4">
          {TABS.map((t) => (
            <li key={t.id} className="flex-1 lg:flex-none">
              <button
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-1 px-2 py-3 text-[0.6875rem] transition-colors lg:flex-row lg:gap-3 lg:rounded-xl lg:px-4 lg:py-3 lg:text-sm ${
                  tab === t.id ? "bg-cream/10 text-cream" : "text-cream/55 hover:text-cream"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={t.icon} />
                </svg>
                {t.label}
                {t.id === "bookings" && overview && overview.counts.pending > 0 && (
                  <span className="ml-auto hidden rounded-full bg-[#e9c46a] px-2 py-0.5 text-[0.625rem] font-semibold text-ink lg:inline">
                    {overview.counts.pending}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="hidden space-y-1 px-4 pb-6 lg:block">
          <Link href="/" className="block rounded-xl px-4 py-3 text-sm text-cream/55 hover:text-cream">View website →</Link>
          <button type="button" onClick={signOut} className="block w-full rounded-xl px-4 py-3 text-left text-sm text-cream/55 hover:text-cream">
            Sign out
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-[96rem] px-5 pb-28 pt-8 sm:px-8 lg:pb-12">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-muted">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
            <h1 className="mt-2 font-display text-5xl sm:text-6xl">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={load} className="rounded-full border border-line bg-white px-5 py-2.5 text-sm hover:bg-cream">
              Refresh
            </button>
            <button type="button" onClick={signOut} className="rounded-full border border-line bg-white px-5 py-2.5 text-sm hover:bg-cream lg:hidden">
              Sign out
            </button>
          </div>
        </header>

        {error && (
          <p className="mb-6 rounded-xl border border-clay bg-clay/10 px-4 py-3 text-sm text-clay-dark" role="alert">{error}</p>
        )}

        {!overview || !bookings ? (
          !error && <div className="h-96 animate-pulse rounded-2xl bg-white/60" />
        ) : (
          <>
            {tab === "overview" && <OverviewView data={overview} onOpen={open} />}
            {tab === "calendar" && <CalendarView data={overview} onOpen={open} />}
            {tab === "bookings" && <BookingsView bookings={bookings} selectedId={selected?.id ?? null} onOpen={open} />}
            {tab === "customers" && <CustomersView call={call} onOpen={open} />}
          </>
        )}
      </main>

      {selected && <BookingDrawer booking={selected} onClose={close} onStatus={setBookingStatus} onLicense={viewLicense} />}
    </div>
  );
}
