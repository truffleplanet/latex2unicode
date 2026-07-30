import { tokenize, type Token } from './tokenize.js';
import { SYMBOLS, FUNCTIONS, LIMIT_OPS, IGNORED_COMMANDS, DISCARD_ARG_COMMANDS } from './tables/symbols.js';
import { STYLE_COMMANDS, UPRIGHT_COMMANDS } from './tables/alphabets.js';
import { ACCENTS } from './tables/accents.js';

export type Node =
  | { t: 'chars'; text: string; s: number; e: number }
  | { t: 'sym'; name: string; s: number; e: number }
  | { t: 'func'; name: string; s: number; e: number }
  | { t: 'op'; name: string; s: number; e: number }
  | { t: 'group'; body: Node[]; s: number; e: number }
  | { t: 'script'; base: Node | null; sup?: Node; sub?: Node; s: number; e: number }
  | { t: 'frac'; num: Node; den: Node; style: 'frac' | 'binom'; s: number; e: number }
  | { t: 'sqrt'; index?: Node; body: Node; s: number; e: number }
  | { t: 'accent'; cmd: string; body: Node; s: number; e: number }
  | { t: 'style'; cmd: string; body: Node; s: number; e: number }
  | { t: 'upright'; body: Node; s: number; e: number }
  | { t: 'env'; name: string; rows: Node[][][]; s: number; e: number }
  | { t: 'space'; s: number; e: number }
  | { t: 'row'; s: number; e: number }
  | { t: 'unknown'; name: string; s: number; e: number };

const FRACS = new Set(['frac', 'dfrac', 'tfrac', 'cfrac']);
const BINOMS = new Set(['binom', 'dbinom', 'tbinom']);

class Parser {
  private i = 0;
  constructor(private toks: Token[]) {}

  private peek(): Token | undefined {
    return this.toks[this.i];
  }

  /** Whitespace never separates a command from its argument. */
  private skipSpace(): void {
    while (this.toks[this.i]?.k === 'space') this.i++;
  }

  /** Parse a whole token list, stopping at an unmatched `}` or `\end`. */
  parseList(stopAtEnd = false): Node[] {
    const out: Node[] = [];
    for (;;) {
      const t = this.peek();
      if (!t) break;
      if (t.k === 'close') break;
      if (stopAtEnd && t.k === 'cmd' && t.name === 'end') break;
      if (t.k === 'amp' || t.k === 'row') {
        if (stopAtEnd) break;
        if (t.k === 'row') { out.push({ t: 'row', s: t.s, e: t.e }); this.i++; continue; }
        // A stray `&` outside an environment is not meaningful — drop it.
        this.i++;
        continue;
      }
      const node = this.parseScripted();
      if (node) out.push(node);
    }
    return out;
  }

  /** An atom plus any `^`/`_` attached to it. */
  private parseScripted(): Node | null {
    let base = this.parseAtom();
    let sup: Node | undefined;
    let sub: Node | undefined;
    let end = base ? base.e : (this.peek()?.s ?? 0);

    // Only the final character of a run carries the script: in `ab_c` the base
    // is `b`, not `ab`. Keeps the reported source span minimal.
    let prefix: Node | null = null;
    const ahead = this.peek();
    if (base?.t === 'chars' && (ahead?.k === 'sup' || ahead?.k === 'sub')) {
      const chars = [...base.text];
      if (chars.length > 1) {
        const last = chars[chars.length - 1];
        const split = base.e - last.length;
        prefix = { t: 'chars', text: chars.slice(0, -1).join(''), s: base.s, e: split };
        base = { t: 'chars', text: last, s: split, e: base.e };
      }
    }

    for (;;) {
      const t = this.peek();
      if (!t || (t.k !== 'sup' && t.k !== 'sub')) break;
      this.i++;
      // A script takes exactly one token unless braced: `H_2O` is H₂ then O.
      const arg = this.requireArg(t.e);
      if (t.k === 'sup') sup = sup ? { t: 'group', body: [sup, arg], s: sup.s, e: arg.e } : arg;
      else sub = sub ? { t: 'group', body: [sub, arg], s: sub.s, e: arg.e } : arg;
      end = arg.e;
    }

    if (!sup && !sub) return prefix ? { t: 'group', body: [prefix, base!], s: prefix.s, e: base!.e } : base;
    const s = base ? base.s : (sub ?? sup)!.s;
    const script: Node = { t: 'script', base, sup, sub, s, e: end };
    return prefix ? { t: 'group', body: [prefix, script], s: prefix.s, e: end } : script;
  }

  private parseAtom(): Node | null {
    const t = this.peek();
    if (!t) return null;

    switch (t.k) {
      case 'space':
        this.i++;
        return { t: 'space', s: t.s, e: t.e };
      case 'char': {
        // Coalesce a run of plain characters into one node.
        const s = t.s;
        let e = t.e;
        let text = t.c;
        this.i++;
        for (;;) {
          const n = this.peek();
          if (!n || n.k !== 'char') break;
          text += n.c;
          e = n.e;
          this.i++;
        }
        return { t: 'chars', text, s, e };
      }
      case 'open': {
        this.i++;
        const body = this.parseList();
        const close = this.peek();
        if (close?.k === 'close') this.i++;
        return { t: 'group', body, s: t.s, e: close ? close.e : t.e };
      }
      case 'close':
      case 'amp':
      case 'row':
      case 'sup':
      case 'sub':
        return null;
      case 'cmd':
        return this.parseCommand(t);
    }
  }

  private parseCommand(t: Token & { k: 'cmd' }): Node | null {
    const name = t.name.replace(/\*$/, '');
    this.i++;

    if (t.name === 'begin') return this.parseEnv(t);
    if (t.name === 'end') { this.skipGroupArg(); return null; }

    if (IGNORED_COMMANDS.has(name)) {
      // \left( \right] etc: the delimiter that follows stays, the command goes.
      return null;
    }
    if (DISCARD_ARG_COMMANDS.has(name)) {
      this.skipGroupArg();
      return null;
    }
    if (FRACS.has(name) || BINOMS.has(name)) {
      const num = this.requireArg(t.e);
      const den = this.requireArg(num.e);
      return {
        t: 'frac',
        num,
        den,
        style: BINOMS.has(name) ? 'binom' : 'frac',
        s: t.s,
        e: den.e,
      };
    }
    if (name === 'sqrt' || name === 'root') {
      const index = this.optionalArg();
      const body = this.requireArg(index?.e ?? t.e);
      return { t: 'sqrt', index, body, s: t.s, e: body.e };
    }
    if (ACCENTS[name] !== undefined) {
      const body = this.requireArg(t.e);
      return { t: 'accent', cmd: name, body, s: t.s, e: body.e };
    }
    if (STYLE_COMMANDS.has(name)) {
      const body = this.requireArg(t.e);
      return { t: 'style', cmd: name, body, s: t.s, e: body.e };
    }
    if (UPRIGHT_COMMANDS.has(name)) {
      const body = this.requireArg(t.e);
      return { t: 'upright', body, s: t.s, e: body.e };
    }
    if (LIMIT_OPS.has(name)) {
      return { t: 'op', name, s: t.s, e: t.e };
    }
    if (FUNCTIONS.has(name)) {
      return { t: 'func', name, s: t.s, e: t.e };
    }
    if (SYMBOLS[name] !== undefined) {
      return { t: 'sym', name, s: t.s, e: t.e };
    }
    return { t: 'unknown', name, s: t.s, e: t.e };
  }

  private parseEnv(begin: Token & { k: 'cmd' }): Node {
    const name = this.readGroupText() ?? '';
    // `array` and `alignat` take a column/count spec that carries no content.
    if (name === 'array' || name === 'subarray' || name.startsWith('alignat')) this.skipGroupArg();

    const rows: Node[][][] = [];
    let row: Node[][] = [];
    let cell: Node[] = [];
    let end = begin.e;

    for (;;) {
      const nodes = this.parseList(true);
      cell.push(...nodes);
      const t = this.peek();
      if (!t) break;
      if (t.k === 'amp') { this.i++; row.push(cell); cell = []; continue; }
      if (t.k === 'row') { this.i++; row.push(cell); rows.push(row); row = []; cell = []; continue; }
      if (t.k === 'close') { this.i++; continue; } // unbalanced brace inside env
      if (t.k === 'cmd' && t.name === 'end') {
        this.i++;
        const closed = this.readGroupText();
        // `end` must cover `\end{name}` in full, or `keep` would truncate it.
        end = this.toks[this.i - 1]?.e ?? t.e;
        if (closed !== null && closed !== name) continue; // nested env mismatch
        break;
      }
      break;
    }
    row.push(cell);
    if (row.some((c) => c.length > 0) || rows.length === 0) rows.push(row);

    return { t: 'env', name, rows, s: begin.s, e: end };
  }

  /** Read `{text}` as a raw string (environment names, column specs). */
  private readGroupText(): string | null {
    const t = this.peek();
    if (t?.k !== 'open') return null;
    this.i++;
    let text = '';
    for (;;) {
      const n = this.peek();
      if (!n) break;
      if (n.k === 'close') { this.i++; break; }
      if (n.k === 'char') text += n.c;
      else if (n.k === 'cmd') text += '\\' + n.name;
      else if (n.k === 'sup') text += '^';
      else if (n.k === 'sub') text += '_';
      this.i++;
    }
    return text;
  }

  private skipGroupArg(): void {
    const t = this.peek();
    if (t?.k === 'open') this.parseAtom();
  }

  /**
   * `[...]` optional argument. The bracket is an ordinary character token, so
   * find its partner first and parse the span in between on its own — letting
   * parseAtom run would swallow the closing bracket into a character run.
   */
  private optionalArg(): Node | undefined {
    this.skipSpace();
    const t = this.peek();
    if (t?.k !== 'char' || t.c !== '[') return undefined;
    let close = -1;
    let depth = 0;
    for (let j = this.i; j < this.toks.length; j++) {
      const n = this.toks[j];
      if (n.k !== 'char') continue;
      if (n.c === '[') depth++;
      else if (n.c === ']' && --depth === 0) { close = j; break; }
    }
    if (close === -1) return undefined;
    const inner = new Parser(this.toks.slice(this.i + 1, close)).parseList();
    const end = this.toks[close].e;
    this.i = close + 1;
    return { t: 'group', body: inner, s: t.s, e: end };
  }

  /**
   * A mandatory argument. TeX allows a single token to stand in for a group
   * (`\frac12`, `x^2`), so accept either.
   */
  private requireArg(fallbackPos: number): Node {
    this.skipSpace();
    const t = this.peek();
    if (!t) return { t: 'group', body: [], s: fallbackPos, e: fallbackPos };
    if (t.k === 'open') return this.parseAtom()!;
    if (t.k === 'char') {
      // Only one character, unlike the coalescing in parseAtom.
      this.i++;
      return { t: 'chars', text: t.c, s: t.s, e: t.e };
    }
    if (t.k === 'cmd') return this.parseCommand(t) ?? { t: 'group', body: [], s: t.s, e: t.e };
    return { t: 'group', body: [], s: fallbackPos, e: fallbackPos };
  }
}

export function parse(latex: string): Node[] {
  return new Parser(tokenize(latex)).parseList();
}
