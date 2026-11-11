import type { CSSProperties } from "react";

/** Layered forest silhouette: a distant mountain ridge, a far row of pines and a
 *  near row. Each layer is a seamless tile of trees used as a CSS mask: the
 *  tile scales to the band's height and repeats sideways, so the trees keep
 *  their shape and are never cropped, whatever the screen width.
 *
 *  Place it absolutely at the bottom of a section (or above its top, with a
 *  class override), coloured like the section it should blend into. */

type Props = {
  /** CSS colour of the layers, usually the next section's background. */
  color: string;
  /** Band height in pixels on a 1440px-wide screen (a bit smaller on phones). */
  height?: number;
  seed?: number;
  /** Draw the mountain ridge behind the trees. */
  ridge?: boolean;
  className?: string;
};

const W = 1440; // tile width in drawing units
const H = 200; // tile height in drawing units

function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** One pine: a tip and stepped tiers out to the sides, down to the ground. */
function pine(x: number, h: number, rand: () => number) {
  const ground = H + 1;
  const tiers = 4 + Math.floor(rand() * 2);
  const w = h * (0.32 + rand() * 0.08);
  const top = ground - h;
  const right: string[] = [];
  const left: string[] = [];
  for (let j = 1; j <= tiers; j++) {
    const y = top + (h * 0.97 * j) / tiers;
    const half = (w * j) / tiers;
    const notch = half * 0.5;
    const up = (h * 0.97) / tiers / 3.2;
    right.push(`${(x + half).toFixed(1)},${y.toFixed(1)}`);
    if (j < tiers) right.push(`${(x + notch).toFixed(1)},${(y - up).toFixed(1)}`);
    left.unshift(`${(x - half).toFixed(1)},${y.toFixed(1)}`);
    if (j < tiers) left.unshift(`${(x - notch).toFixed(1)},${(y - up).toFixed(1)}`);
  }
  return `M${x.toFixed(1)},${top.toFixed(1)}L${right.join("L")}L${x.toFixed(1)},${ground}L${left.join("L")}Z`;
}

/** A row of pines that tiles seamlessly: a tree near one edge is drawn again
 *  just past the other edge, so the repeat has no visible seam. */
function forest(seed: number, count: number, minH: number, maxH: number) {
  const rand = rng(seed);
  const parts: string[] = [];
  const step = W / count;
  for (let i = 0; i < count; i++) {
    const x = (i + 0.5 + (rand() - 0.5) * 0.7) * step;
    const h = Math.min(H - 4, minH + (maxH - minH) * rand());
    parts.push(pine(x, h, rng(seed * 31 + i)));
    const reach = h * 0.45;
    if (x < reach) parts.push(pine(x + W, h, rng(seed * 31 + i)));
    if (x > W - reach) parts.push(pine(x - W, h, rng(seed * 31 + i)));
  }
  parts.push(`M0,${H - 12}H${W}V${H + 2}H0Z`); // solid ground band
  return parts.join("");
}

/** Rolling ridge that starts and ends at the same height, so it tiles too. */
function ridgeLine(seed: number) {
  const rand = rng(seed * 7 + 3);
  const n = 6;
  const ys = Array.from({ length: n }, () => H * (0.3 + rand() * 0.3));
  ys.push(ys[0]);
  let d = `M0,${H}L0,${ys[0].toFixed(1)}`;
  for (let i = 1; i <= n; i++) {
    const x = (W * i) / n;
    const cy = Math.min(ys[i - 1], ys[i]) - H * 0.12 * rand();
    d += `Q${(x - W / n / 2).toFixed(1)},${cy.toFixed(1)} ${x.toFixed(1)},${ys[i].toFixed(1)}`;
  }
  return `${d}L${W},${H}Z`;
}

function layer(path: string, color: string, opacity: number): CSSProperties {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${path}"/></svg>`;
  const mask = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  return {
    background: color,
    opacity,
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskRepeat: "repeat-x",
    maskRepeat: "repeat-x",
    WebkitMaskPosition: "center bottom",
    maskPosition: "center bottom",
    // The tile is as tall as the band and as wide as its proportions need.
    WebkitMaskSize: "auto 100%",
    maskSize: "auto 100%",
  };
}

export default function Treeline({ color, height = 180, seed = 7, ridge = true, className = "" }: Props) {
  return (
    <div
      aria-hidden="true"
      className={`treeline pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden ${className}`}
      style={{ height: `clamp(${Math.round(height * 0.55)}px, ${((height / 1440) * 100).toFixed(2)}vw, ${height}px)` }}
    >
      {ridge && (
        <div className="tree-layer tree-layer-ridge absolute inset-0" style={layer(ridgeLine(seed), color, 0.28)} />
      )}
      <div className="tree-layer tree-layer-far absolute inset-0" style={layer(forest(seed + 11, 30, 50, 120), color, 0.55)} />
      <div className="tree-layer tree-layer-near absolute inset-0" style={layer(forest(seed + 29, 20, 70, 196), color, 1)} />
    </div>
  );
}
