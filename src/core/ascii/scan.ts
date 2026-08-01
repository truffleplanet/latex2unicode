import type { Node } from '../node.js';
import { OPERATORS, WORDS } from './tokens.js';

/**
 * Read plain-text notation into the shared AST.
 *
 * The input is never rewritten: every node carries offsets into the text it
 * came from, so `keep` output and issue previews quote what the author
 * actually typed rather than some normalised form of it.
 */
export function scan(src: string): Node[] {
  const out: Node[] = [];
  let i = 0;

  const pushChar = (ch: string, s: number, e: number) => {
    const last = out[out.length - 1];
    if (last?.t === 'chars' && last.e === s) {
      last.text += ch;
      last.e = e;
    } else {
      out.push({ t: 'chars', text: ch, s, e });
    }
  };

  while (i < src.length) {
    const c = src[i];

    if (/\s/.test(c)) {
      let j = i;
      while (j < src.length && /\s/.test(src[j])) j++;
      out.push({ t: 'space', s: i, e: j });
      i = j;
      continue;
    }

    if (c === '^' || c === '_') {
      const arg = readScriptArg(src, i + 1);
      if (arg) {
        const base = takeBase(out);
        out.push({
          t: 'script',
          base,
          ...(c === '^' ? { sup: arg.node } : { sub: arg.node }),
          s: base ? base.s : i,
          e: arg.end,
        });
        i = arg.end;
        continue;
      }
      pushChar(c, i, i + 1);
      i++;
      continue;
    }

    const op = OPERATORS.find(([text]) => src.startsWith(text, i));
    if (op) {
      out.push({ t: 'sym', name: op[1], s: i, e: i + op[0].length });
      i += op[0].length;
      continue;
    }

    const word = /^[A-Za-z]+/.exec(src.slice(i));
    if (word) {
      const key = WORDS[word[0].toLowerCase()];
      const e = i + word[0].length;
      if (key) out.push({ t: 'sym', name: key, s: i, e });
      else pushChar(word[0], i, e);
      i = e;
      continue;
    }

    // Surrogate-safe single character.
    const cp = String.fromCodePoint(src.codePointAt(i)!);
    pushChar(cp, i, i + cp.length);
    i += cp.length;
  }

  return out;
}

/**
 * The thing a script attaches to. Only the final character of a run carries it,
 * so `SO_4` subscripts the O and leaves the S alone.
 */
function takeBase(out: Node[]): Node | null {
  const last = out[out.length - 1];
  if (!last) return null;
  if (last.t === 'sym') {
    out.pop();
    return last;
  }
  if (last.t !== 'chars') return null;
  const chars = [...last.text];
  if (chars.length === 1) {
    out.pop();
    return last;
  }
  const tail = chars[chars.length - 1];
  const split = last.e - tail.length;
  const base: Node = { t: 'chars', text: tail, s: split, e: last.e };
  last.text = chars.slice(0, -1).join('');
  last.e = split;
  return base;
}

/** `^2`, `^-1`, `^(n+1)` — the exponent, and where it ends. */
function readScriptArg(src: string, p: number): { node: Node; end: number } | null {
  if (src[p] === '(') {
    const close = src.indexOf(')', p + 1);
    if (close !== -1 && close > p + 1) {
      return {
        node: { t: 'chars', text: src.slice(p + 1, close), s: p + 1, e: close },
        end: close + 1,
      };
    }
    return null;
  }
  const m = /^[-+]?[A-Za-z0-9]+/.exec(src.slice(p));
  if (!m) return null;
  return { node: { t: 'chars', text: m[0], s: p, e: p + m[0].length }, end: p + m[0].length };
}
