import type { AddonLine } from "./api";

/* Extras the guest picked, kept as a list of strings: "jetski" for one, or
   "ebike:2" for a quantity. The same strings go into the URL (?addons=…) and
   to the server, which checks every quantity again. */

export function qtyOf(list: string[], code: string): number {
  for (const v of list) {
    const [c, q] = v.split(":");
    if (c === code) return q ? Math.max(1, Number(q) || 1) : 1;
  }
  return 0;
}

export function codesOf(list: string[]): string[] {
  return list.map((v) => v.split(":")[0]);
}

/** Set how many of `code` (0 removes it). */
export function withQty(list: string[], code: string, qty: number): string[] {
  const rest = list.filter((v) => v.split(":")[0] !== code);
  if (qty <= 0) return rest;
  return [...rest, qty > 1 ? `${code}:${qty}` : code];
}

/** Keep only extras whose code is offered at the chosen place. */
export function onlyOffered(list: string[], offered: string[]): string[] {
  return list.filter((v) => offered.includes(v.split(":")[0]));
}

/** "Electric bike ×2 · 4 days" or "Jet ski × 4 days". */
export function addonLineLabel(a: AddonLine): string {
  return a.qty && a.qty > 1 ? `${a.name} ×${a.qty} · ${a.days} days` : `${a.name} × ${a.days} days`;
}
