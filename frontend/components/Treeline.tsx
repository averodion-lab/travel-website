/** Layered forest silhouette: a distant mountain ridge, a far row of pines and a
 *  near row. Drawn as SVG paths generated from a seed, so every use looks a
 *  little different but the page renders the same every time.
 *
 *  Place it absolutely at the bottom (or top, with `flip`) of a section, filled
 *  with the colour of the section it should blend into. */

type Props = {
  /** CSS colour of the nearest layer, usually the next section's background. */
  color: string;
  /** Height of the band in pixels at desktop width (it scales down on phones). */
  height?: number;
  seed?: number;
  /** Draw the mountain ridge behind the trees. */
  ridge?: boolean;
  /** Point the trees down (for the top edge of a section). */
  flip?: boolean;
  className?: string;
};

const W = 1440;

function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** One pine: a tip and stepped tiers out to the sides, down to the ground. */
function pine(x: number, ground: number, h: number, rand: () => number) {
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
    if (j < tiers)
      right.push(`${(x + notch).toFixed(1)},${(y - up).toFixed(1)}`);
    left.unshift(`${(x - half).toFixed(1)},${y.toFixed(1)}`);
    if (j < tiers)
      left.unshift(`${(x - notch).toFixed(1)},${(y - up).toFixed(1)}`);
  }
  const trunk = Math.max(2, w * 0.08);
  return (
    `M${x.toFixed(1)},${top.toFixed(1)}L${right.join("L")}` +
    `L${(x + trunk).toFixed(1)},${(top + h * 0.97).toFixed(1)}L${(x + trunk).toFixed(1)},${ground}` +
    `L${(x - trunk).toFixed(1)},${ground}L${(x - trunk).toFixed(1)},${(top + h * 0.97).toFixed(1)}` +
    `L${left.join("L")}Z`
  );
}

function forest(
  seed: number,
  H: number,
  count: number,
  minH: number,
  maxH: number,
) {
  const rand = rng(seed);
  const parts: string[] = [];
  const step = W / count;
  for (let i = -1; i <= count; i++) {
    const x = (i + 0.5 + (rand() - 0.5) * 0.7) * step;
    // Clusters: trees near the edges stand taller, framing the middle.
    const edge = Math.abs(x - W / 2) / (W / 2);
    const h =
      minH + (maxH - minH) * (0.35 + 0.65 * rand()) * (0.75 + 0.35 * edge);
    parts.push(pine(x, H + 1, Math.min(h, H - 2), rand));
  }
  // A band of ground so neighbouring trees join up.
  parts.push(`M0,${H - 12}H${W}V${H + 2}H0Z`); // solid ground band, no gaps between trunks
  return parts.join("");
}

function ridgeLine(seed: number, H: number) {
  const rand = rng(seed * 7 + 3);
  let d = `M0,${H}`;
  const points = 9;
  for (let i = 0; i <= points; i++) {
    const x = (W * i) / points;
    const y = H * (0.28 + rand() * 0.32);
    d +=
      i === 0
        ? `L0,${y.toFixed(1)}`
        : `Q${(x - W / points / 2).toFixed(1)},${(y - H * 0.18 * rand()).toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return `${d}L${W},${H}Z`;
}

export default function Treeline({
  color,
  height = 180,
  seed = 7,
  ridge = true,
  flip = false,
  className = "",
}: Props) {
  const H = 200;
  return (
    <div
      aria-hidden="true"
      className={`treeline pointer-events-none absolute inset-x-0 overflow-hidden ${flip ? "top-0 -scale-y-100" : "bottom-0"} ${className}`}
      style={{
        height: `clamp(${Math.round(height * 0.5)}px, ${((height / 1440) * 100).toFixed(2)}vw, ${height}px)`,
      }}
    >
      {ridge && (
        <svg
          className="tree-layer tree-layer-ridge absolute inset-0 h-full w-full"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
        >
          <path d={ridgeLine(seed, H)} fill={color} opacity="0.28" />
        </svg>
      )}
      <svg
        className="tree-layer tree-layer-far absolute inset-0 h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMax slice"
      >
        <path
          d={forest(seed + 11, H, 46, 55, 120)}
          fill={color}
          opacity="0.55"
        />
      </svg>
      <svg
        className="tree-layer tree-layer-near absolute inset-0 h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMax slice"
      >
        <path d={forest(seed + 29, H, 30, 70, 196)} fill={color} />
      </svg>
    </div>
  );
}
