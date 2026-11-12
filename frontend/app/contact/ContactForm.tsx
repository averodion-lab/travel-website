"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";

/** Contact form: the message is emailed to the owner, who can reply to it
 *  directly. Nothing is stored. A hidden "website" field catches bots. */
export default function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState("sending");
    setError("");
    try {
      await api("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      setState("sent");
    } catch (e) {
      setError((e as Error).message);
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="lux-rise in self-start bg-white p-8 sm:p-12" role="status">
        <p className="lux-label text-clay">Message sent</p>
        <p className="mt-4 font-display text-4xl">
          Thank you. <em>We&apos;ll be in touch soon.</em>
        </p>
        <p className="mt-4 leading-relaxed text-muted">
          We usually reply within a day. Keep an eye on your inbox, and your spam folder just in case.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="self-start bg-white p-6 sm:p-10">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="label">
            Your name
          </label>
          <input id="c-name" name="name" required maxLength={120} autoComplete="name" className="field" />
        </div>
        <div>
          <label htmlFor="c-email" className="label">
            Email
          </label>
          <input id="c-email" name="email" type="email" required maxLength={200} autoComplete="email" className="field" />
        </div>
        <div>
          <label htmlFor="c-phone" className="label">
            Phone <span className="font-normal normal-case tracking-normal text-muted">(optional)</span>
          </label>
          <input id="c-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className="field" />
        </div>
        <div>
          <label htmlFor="c-dates" className="label">
            Dates you have in mind <span className="font-normal normal-case tracking-normal text-muted">(optional)</span>
          </label>
          <input id="c-dates" name="dates" maxLength={120} placeholder="e.g. a long weekend in October" className="field" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-message" className="label">
            Your message
          </label>
          <textarea
            id="c-message"
            name="message"
            required
            maxLength={4000}
            rows={6}
            placeholder="Where would you like to stay, how many guests, anything we should know…"
            className="field resize-y"
          />
        </div>
        {/* Hidden from people; bots fill it in. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="c-website">Website</label>
          <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      {error && (
        <p className="mt-5 border border-clay bg-clay/10 px-4 py-3 text-sm text-clay-dark" role="alert">
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-6">
        <button type="submit" disabled={state === "sending"} className="btn btn-primary">
          {state === "sending" ? "Sending…" : "Send message"}
        </button>
        <p className="text-xs text-muted">We only use your details to reply to you.</p>
      </div>
    </form>
  );
}
