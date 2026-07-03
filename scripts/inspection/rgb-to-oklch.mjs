#!/usr/bin/env node
/**
 * rgb-to-oklch.mjs — deterministic color conversion for Tailwind v4 @theme tokens.
 *
 * Converts any CSS color that `getComputedStyle` returns (rgb/rgba), plus hex and
 * hsl, into the `oklch(L C H)` form used by Tailwind v4 / shadcn tokens. Doing this
 * in Node (not in model tokens) keeps the clone pipeline cheap and exact.
 *
 * Usage:
 *   node scripts/inspection/rgb-to-oklch.mjs "rgb(13, 13, 13)" "#ffffff" "hsl(210 40% 96%)"
 *   echo '{"background":"#fff","primary":"rgb(37,99,235)"}' | node scripts/inspection/rgb-to-oklch.mjs --css
 *
 * --css   read a JSON map {tokenName: color} from stdin, emit `--color-<name>: oklch(...)` lines.
 */

const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** Parse a CSS color string → { r, g, b, a } with channels in 0..1. */
function parseColor(input) {
  const s = String(input).trim().toLowerCase();

  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  if (s === "white") return { r: 1, g: 1, b: 1, a: 1 };
  if (s === "black") return { r: 0, g: 0, b: 0, a: 1 };

  // hex #rgb #rgba #rrggbb #rrggbbaa
  if (s.startsWith("#")) {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  const nums = (s.match(/-?[\d.]+%?/g) || []).map((n) =>
    n.endsWith("%") ? parseFloat(n) / 100 : parseFloat(n),
  );

  if (s.startsWith("rgb")) {
    // rgb() channels are 0..255 unless written as %.
    const norm = (v, raw) => (raw.includes("%") ? v : v / 255);
    const raw = s.match(/-?[\d.]+%?/g) || [];
    return {
      r: clamp01(norm(nums[0], raw[0] || "")),
      g: clamp01(norm(nums[1], raw[1] || "")),
      b: clamp01(norm(nums[2], raw[2] || "")),
      a: nums[3] ?? 1,
    };
  }

  if (s.startsWith("hsl")) {
    const [h, sat, l] = nums;
    const a = nums[3] ?? 1;
    return { ...hslToRgb(((h % 360) + 360) % 360, clamp01(sat), clamp01(l)), a };
  }

  throw new Error("Unsupported color: " + input);
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return { r: r + m, g: g + m, b: b + m };
}

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** sRGB (0..1) → OKLCH. Ottosson matrices. */
function rgbToOklch({ r, g, b, a = 1 }) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;

  return { L, C, H, a };
}

const round = (n, d) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

/** Format as Tailwind-style `oklch(L C H)` (L,C decimals 0..~1; H degrees). */
export function toOklchString(color) {
  const { L, C, H, a } = rgbToOklch(parseColor(color));
  const achromatic = C < 0.0005;
  const Ls = round(L, 4);
  const Cs = achromatic ? 0 : round(C, 4);
  const Hs = achromatic ? 0 : round(H, 2);
  const body = `${Ls} ${Cs} ${Hs}`;
  return a < 1 ? `oklch(${body} / ${round(a, 3)})` : `oklch(${body})`;
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}

if (args.includes("--css")) {
  const raw = await readStdin();
  const map = JSON.parse(raw);
  for (const [name, color] of Object.entries(map)) {
    try {
      console.log(`  --color-${name}: ${toOklchString(color)};`);
    } catch (e) {
      console.error(`  /* ${name}: ${e.message} */`);
    }
  }
} else if (args.length) {
  for (const c of args) {
    try {
      console.log(`${c} -> ${toOklchString(c)}`);
    } catch (e) {
      console.error(e.message);
    }
  }
} else {
  console.error(
    'Usage: node scripts/inspection/rgb-to-oklch.mjs "rgb(...)" ["#hex" ...]\n' +
      '       echo \\\'{"name":"#fff"}\\\' | node scripts/inspection/rgb-to-oklch.mjs --css',
  );
  process.exit(1);
}
