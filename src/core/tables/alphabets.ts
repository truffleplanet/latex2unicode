/**
 * Mathematical Alphanumeric Symbols (U+1D400..U+1D7FF).
 *
 * The block has holes where a letter was already encoded in the Letterlike
 * Symbols block, so each style lists its exceptions explicitly.
 */

interface StyleSpec {
  upper?: number;
  lower?: number;
  digit?: number;
  exceptions?: Record<string, string>;
}

const STYLES: Record<string, StyleSpec> = {
  mathbf: { upper: 0x1d400, lower: 0x1d41a, digit: 0x1d7ce },
  mathit: {
    upper: 0x1d434,
    lower: 0x1d44e,
    exceptions: { h: 'ℎ' },
  },
  mathbfit: { upper: 0x1d468, lower: 0x1d482 },
  mathscr: {
    upper: 0x1d49c,
    lower: 0x1d4b6,
    exceptions: {
      B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ',
      e: 'ℯ', g: 'ℊ', o: 'ℴ',
    },
  },
  mathfrak: {
    upper: 0x1d504,
    lower: 0x1d51e,
    exceptions: { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' },
  },
  mathbb: {
    upper: 0x1d538,
    lower: 0x1d552,
    digit: 0x1d7d8,
    exceptions: { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' },
  },
  mathsf: { upper: 0x1d5a0, lower: 0x1d5ba, digit: 0x1d7e2 },
  mathsfbf: { upper: 0x1d5d4, lower: 0x1d5ee, digit: 0x1d7ec },
  mathsfit: { upper: 0x1d608, lower: 0x1d622 },
  mathtt: { upper: 0x1d670, lower: 0x1d68a, digit: 0x1d7f6 },
};

/** LaTeX command -> style key. */
const ALIASES: Record<string, string> = {
  mathbf: 'mathbf', bm: 'mathbf', boldsymbol: 'mathbfit', pmb: 'mathbf',
  textbf: 'mathbf', bf: 'mathbf',
  mathit: 'mathit', textit: 'mathit', emph: 'mathit', it: 'mathit',
  mathcal: 'mathscr', mathscr: 'mathscr',
  mathfrak: 'mathfrak', mathbb: 'mathbb', Bbb: 'mathbb', mathds: 'mathbb',
  mathbold: 'mathbf',
  mathsf: 'mathsf', textsf: 'mathsf',
  mathtt: 'mathtt', texttt: 'mathtt', tt: 'mathtt',
};

export const STYLE_COMMANDS = new Set(Object.keys(ALIASES));

/** Commands that only strip math italics — contents pass through unchanged. */
export const UPRIGHT_COMMANDS = new Set([
  'mathrm', 'mathnormal', 'text', 'textnormal', 'textup', 'textmd', 'rm',
  'operatorname', 'mbox', 'hbox',
]);

function build(spec: StyleSpec): Record<string, string> {
  const map: Record<string, string> = {};
  const add = (base: number | undefined, from: string, to: string) => {
    if (base === undefined) return;
    for (let c = from.charCodeAt(0); c <= to.charCodeAt(0); c++) {
      map[String.fromCharCode(c)] = String.fromCodePoint(base + (c - from.charCodeAt(0)));
    }
  };
  add(spec.upper, 'A', 'Z');
  add(spec.lower, 'a', 'z');
  add(spec.digit, '0', '9');
  Object.assign(map, spec.exceptions ?? {});
  return map;
}

const CACHE = new Map<string, Record<string, string>>();

function tableFor(style: string): Record<string, string> {
  let t = CACHE.get(style);
  if (!t) {
    t = build(STYLES[style]);
    CACHE.set(style, t);
  }
  return t;
}

/**
 * Restyle `s` with the alphabet of `command`.
 * Returns null if any letter or digit has no styled counterpart, since a
 * half-converted `𝔽oo` is worse than leaving the original alone.
 */
export function toStyled(s: string, command: string): string | null {
  const style = ALIASES[command];
  if (!style) return null;
  const table = tableFor(style);
  let out = '';
  for (const ch of s) {
    const mapped = table[ch];
    if (mapped !== undefined) {
      out += mapped;
    } else if (/[A-Za-z0-9]/.test(ch)) {
      return null; // in-range character the style cannot express
    } else {
      out += ch; // spaces, punctuation, already-Unicode symbols pass through
    }
  }
  return out;
}
