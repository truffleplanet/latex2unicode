import {
  SYMBOLS, FUNCTIONS, LIMIT_OPS, IGNORED_COMMANDS, DISCARD_ARG_COMMANDS, STARRED_COMMANDS,
} from '../tables/symbols.js';
import { STYLE_COMMANDS, UPRIGHT_COMMANDS } from '../tables/alphabets.js';
import { ACCENTS } from '../tables/accents.js';
import type { Segment } from '../frontend.js';
import { backtickRun, skipFence, skipInlineCode } from '../text/code.js';

/** Environments whose contents are math. */
const MATH_ENVS = new Set([
  'equation', 'equation*', 'displaymath', 'math',
  'align', 'align*', 'aligned', 'alignat', 'alignat*', 'alignedat',
  'gather', 'gather*', 'gathered', 'multline', 'multline*',
  'eqnarray', 'eqnarray*', 'split', 'array', 'subarray',
  'matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix',
  'smallmatrix', 'cases', 'dcases', 'rcases',
]);

/** Every command name the converter knows how to handle. */
export const KNOWN_COMMANDS: ReadonlySet<string> = new Set([
  ...Object.keys(SYMBOLS),
  ...FUNCTIONS,
  ...LIMIT_OPS,
  ...IGNORED_COMMANDS,
  ...DISCARD_ARG_COMMANDS,
  ...STYLE_COMMANDS,
  ...UPRIGHT_COMMANDS,
  ...Object.keys(ACCENTS),
  'frac', 'dfrac', 'tfrac', 'cfrac', 'sfrac', 'binom', 'dbinom', 'tbinom',
  'sqrt', 'root', 'over', 'atop', 'begin', 'end', 'substack',
]);

const CMD_RE = /^\\([a-zA-Z]+)(\*?)/;
const BLANK_LINE_RE = /^[ \t\r]*\n/;

/**
 * Heuristic for `$...$`: TeX's inline delimiter collides with currency, which
 * is common in the kind of prose this tool is pointed at. Prefer a false
 * negative (prose left alone) over a false positive (mangled sentence).
 */
export function looksLikeMath(body: string): boolean {
  if (!body || body.length > 400) return false;
  if (/^\s|\s$|\n/.test(body)) return false;          // "$100 and $200"
  if (/[\\^_]/.test(body)) return true;                // TeX machinery present
  if (/[=<>+±×÷≤≥≠→∞∑∏∫|]$/.test(body)) return false;  // "$100+$200": dangling operator
  if (/[=<>+±×÷≤≥≠→∞∑∏∫|]/.test(body)) return true;    // a relation or operator
  if (/^[A-Za-z](\d)?$/.test(body)) return true;       // $x$, $n$, $y2$
  if (/^[A-Za-z]\s?\([^()]*\)$/.test(body)) return true; // $f(x)$
  if (/^\d+(\.\d+)?$/.test(body)) return true;         // $3$, $2.5$
  return false;
}

/**
 * Heuristic for `$$...$$`: display bodies may span lines, so trim before
 * judging. The same currency collision exists ("It costs $$100 and $$200").
 */
export function looksLikeDisplayMath(body: string): boolean {
  const t = body.trim();
  if (t === '' || t.length > 2000) return false;
  if (/[\\^_]/.test(t)) return true;
  return looksLikeMath(t);
}

/** True when a bare `\command` outside math should be treated as LaTeX. */
function isKnownCommandAt(src: string, i: number): string | null {
  const m = CMD_RE.exec(src.slice(i, i + 32));
  if (!m) return null;
  if (!KNOWN_COMMANDS.has(m[1])) return null;
  // Keep the star only where it is part of the name, matching the tokenizer.
  return m[2] && !STARRED_COMMANDS.has(m[1]) ? `\\${m[1]}` : m[0];
}

/** Skip a balanced `{...}` or `[...]` group starting at `i`; -1 if unbalanced. */
function skipGroup(src: string, i: number, open: string, close: string): number {
  if (src[i] !== open) return -1;
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '\\') { j++; continue; }
    if (src[j] === open) depth++;
    else if (src[j] === close && --depth === 0) return j + 1;
  }
  return -1;
}

/** Find `\end{name}` matching a `\begin{name}` that starts at `from`. */
function findEnvEnd(src: string, from: number, name: string): number {
  const open = `\\begin{${name}}`;
  const close = `\\end{${name}}`;
  let depth = 0;
  let j = from;
  while (j < src.length) {
    if (src.startsWith(open, j)) { depth++; j += open.length; continue; }
    if (src.startsWith(close, j)) {
      if (--depth === 0) return j + close.length;
      j += close.length;
      continue;
    }
    j++;
  }
  return -1;
}

/**
 * Split source into untouched prose and LaTeX regions.
 * Fenced and inline code spans are always prose — a code block full of
 * backslashes is not math.
 */
export function segment(src: string, opts: { convertBareCommands: boolean }): Segment[] {
  const out: Segment[] = [];
  let textStart = 0;
  let i = 0;

  const flushText = (upto: number) => {
    if (upto > textStart) {
      out.push({
        kind: 'text',
        raw: src.slice(textStart, upto),
        body: src.slice(textStart, upto),
        start: textStart,
        bodyStart: textStart,
        display: false,
        texMode: 'text',
      });
    }
  };

  const pushMath = (
    start: number,
    end: number,
    bodyStart: number,
    bodyEnd: number,
    display: boolean,
    texMode: 'math' | 'text' = 'math',
  ) => {
    flushText(start);
    out.push({
      kind: 'math',
      raw: src.slice(start, end),
      body: src.slice(bodyStart, bodyEnd),
      start,
      bodyStart,
      display,
      texMode,
    });
    i = end;
    textStart = end;
  };

  while (i < src.length) {
    const c = src[i];

    // Fenced code block — prose, verbatim.
    if (src.startsWith('```', i)) {
      i = skipFence(src, i);
      continue;
    }

    // Inline code span, single line only.
    if (c === '`') {
      const close = skipInlineCode(src, i);
      i = close === -1 ? i + backtickRun(src, i) : close;
      continue;
    }

    if (c === '\\') {
      const next = src[i + 1];

      // \[ ... \]
      if (next === '[') {
        const close = src.indexOf('\\]', i + 2);
        if (close !== -1) {
          pushMath(i, close + 2, i + 2, close, true);
          continue;
        }
      }
      // \( ... \)
      if (next === '(') {
        const close = src.indexOf('\\)', i + 2);
        if (close !== -1) {
          pushMath(i, close + 2, i + 2, close, false);
          continue;
        }
      }
      // \begin{env} ... \end{env} — body keeps the wrapper so the parser sees it.
      if (src.startsWith('\\begin{', i)) {
        const nameEnd = src.indexOf('}', i + 7);
        const name = nameEnd === -1 ? '' : src.slice(i + 7, nameEnd);
        if (MATH_ENVS.has(name)) {
          const end = findEnvEnd(src, i, name);
          if (end !== -1) {
            pushMath(i, end, i, end, true);
            continue;
          }
        }
        i += 7;
        continue;
      }
      // Escaped literal such as \% or \$.
      if (next !== undefined && '%&#_${}'.includes(next)) {
        if (opts.convertBareCommands) {
          pushMath(i, i + 2, i, i + 2, false, 'text');
        } else {
          i += 2;
        }
        continue;
      }
      // Bare command in prose: \alpha, \textbf{...}
      const cmd = isKnownCommandAt(src, i);
      if (cmd) {
        if (!opts.convertBareCommands) {
          i += cmd.length;
          continue;
        }
        let end = i + cmd.length;
        // Absorb the command's optional and mandatory arguments.
        for (;;) {
          const opt = skipGroup(src, end, '[', ']');
          if (opt !== -1) { end = opt; continue; }
          const arg = skipGroup(src, end, '{', '}');
          if (arg !== -1) { end = arg; continue; }
          break;
        }
        pushMath(i, end, i, end, false, 'text');
        continue;
      }
      i += 2; // unknown escape — leave it alone
      continue;
    }

    if (c === '$') {
      // $$ ... $$ — the scan honours escapes and never crosses a paragraph
      // break or a code fence, so an unpaired $$ cannot eat the document.
      if (src[i + 1] === '$') {
        let close = -1;
        for (let j = i + 2; j < src.length; j++) {
          if (src[j] === '\\') { j++; continue; }
          if (src.startsWith('```', j)) break;
          // A blank line ends the search, CRLF and trailing spaces included.
          if (src[j] === '\n' && BLANK_LINE_RE.test(src.slice(j + 1, j + 16))) break;
          if (src[j] === '$' && src[j + 1] === '$') { close = j; break; }
        }
        if (close !== -1 && looksLikeDisplayMath(src.slice(i + 2, close))) {
          pushMath(i, close + 2, i + 2, close, true);
          continue;
        }
        i += 2;
        continue;
      }
      // $ ... $ on a single line, and only if it looks like math.
      const nl = src.indexOf('\n', i + 1);
      const limit = nl === -1 ? src.length : nl;
      let close = -1;
      for (let j = i + 1; j < limit; j++) {
        if (src[j] === '\\') { j++; continue; }
        if (src[j] === '$') { close = j; break; }
      }
      // `$5|$6` in a table: a digit right after the closing $ reads as money.
      if (
        close !== -1 &&
        looksLikeMath(src.slice(i + 1, close)) &&
        !/\d/.test(src[close + 1] ?? '')
      ) {
        pushMath(i, close + 1, i + 1, close, false);
        continue;
      }
      i++;
      continue;
    }

    i++;
  }

  flushText(src.length);
  return out;
}
