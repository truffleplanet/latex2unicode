export type Token =
  | { k: 'cmd'; name: string; s: number; e: number }
  | { k: 'char'; c: string; s: number; e: number }
  | { k: 'open'; s: number; e: number }    // {
  | { k: 'close'; s: number; e: number }   // }
  | { k: 'sup'; s: number; e: number }     // ^
  | { k: 'sub'; s: number; e: number }     // _
  | { k: 'amp'; s: number; e: number }     // & cell separator
  | { k: 'row'; s: number; e: number }     // \\ row separator
  | { k: 'space'; s: number; e: number };

const LETTER = /[a-zA-Z]/;

/**
 * Tokenize a LaTeX fragment.
 *
 * Unlike TeX, whitespace after a control word is kept as a token. TeX discards
 * it and re-derives spacing from operator classes, which plain text cannot do;
 * keeping what the author wrote reproduces `\alpha + \beta` as "α + β". The
 * renderer normalises the result.
 */
export function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;

  while (i < src.length) {
    const c = src[i];

    if (c === '\\') {
      const next = src[i + 1];
      if (next === undefined) { i++; continue; }

      // Row separator: \\ (possibly with an optional [1em] spacing argument).
      if (next === '\\') {
        let e = i + 2;
        if (src[e] === '[') {
          const close = src.indexOf(']', e);
          if (close !== -1) e = close + 1;
        }
        out.push({ k: 'row', s: i, e });
        i = e;
        continue;
      }
      if (LETTER.test(next)) {
        let j = i + 1;
        while (j < src.length && LETTER.test(src[j])) j++;
        if (src[j] === '*') j++; // \align* style variants
        const name = src.slice(i + 1, j);
        out.push({ k: 'cmd', name, s: i, e: j });
        i = j;
        continue;
      }
      // Control symbol: \, \; \% \{ …
      out.push({ k: 'cmd', name: next, s: i, e: i + 2 });
      i += 2;
      continue;
    }

    if (c === '%') { // LaTeX comment
      const nl = src.indexOf('\n', i);
      i = nl === -1 ? src.length : nl + 1;
      continue;
    }
    if (c === '{') { out.push({ k: 'open', s: i, e: i + 1 }); i++; continue; }
    if (c === '}') { out.push({ k: 'close', s: i, e: i + 1 }); i++; continue; }
    if (c === '^') { out.push({ k: 'sup', s: i, e: i + 1 }); i++; continue; }
    if (c === '_') { out.push({ k: 'sub', s: i, e: i + 1 }); i++; continue; }
    if (c === '&') { out.push({ k: 'amp', s: i, e: i + 1 }); i++; continue; }
    if (c === '~') { out.push({ k: 'char', c: ' ', s: i, e: i + 1 }); i++; continue; }

    if (/\s/.test(c)) {
      let j = i;
      while (j < src.length && /\s/.test(src[j])) j++;
      out.push({ k: 'space', s: i, e: j });
      i = j;
      continue;
    }

    // Surrogate-safe single character.
    const cp = String.fromCodePoint(src.codePointAt(i)!);
    out.push({ k: 'char', c: cp, s: i, e: i + cp.length });
    i += cp.length;
  }

  return out;
}
