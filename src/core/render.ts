import type { Node } from './parse.js';
import type { ConvertOptions, Issue, IssueCode, Piece } from './types.js';
import { SYMBOLS, LIMIT_OP_TEXT } from './tables/symbols.js';
import { SUPERSCRIPT, SUBSCRIPT, toScript } from './tables/scripts.js';
import { toStyled } from './tables/alphabets.js';
import { ACCENTS, applyAccent } from './tables/accents.js';
import { vulgarFraction } from './tables/fractions.js';

export interface RenderCtx {
  /** The full original document, for slicing `keep` text. */
  source: string;
  /** Offset of the segment body within `source`. */
  offset: number;
  /** Segment index, part of every issue id. */
  segIdx: number;
  opts: ConvertOptions;
  issues: Issue[];
  /** Suppress issue collection (dry runs used to test convertibility). */
  dry: boolean;
  /** Produce ASCII linearizations instead of consulting the fallback policy. */
  flatten: boolean;
}

const ENV_BRACKETS: Record<string, [string, string]> = {
  matrix: ['(', ')'],
  pmatrix: ['(', ')'],
  bmatrix: ['[', ']'],
  Bmatrix: ['{', '}'],
  vmatrix: ['|', '|'],
  Vmatrix: ['‖', '‖'],
  smallmatrix: ['(', ')'],
  array: ['(', ')'],
  cases: ['{', '}'],
  dcases: ['{', '}'],
  rcases: ['', '}'],
};

/** Environments that are laid out as stacked lines rather than a bracketed grid. */
const LINE_ENVS = new Set([
  'align', 'aligned', 'alignat', 'alignedat', 'gather', 'gathered',
  'multline', 'eqnarray', 'split', 'equation', 'displaymath', 'math', 'subarray',
]);

function lineOf(source: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < source.length; i++) if (source[i] === '\n') line++;
  return line;
}

/** Text of a node exactly as the author wrote it. */
function sourceOf(node: Node, ctx: RenderCtx): string {
  return ctx.source.slice(ctx.offset + node.s, ctx.offset + node.e);
}

function child(ctx: RenderCtx, patch: Partial<RenderCtx>): RenderCtx {
  return { ...ctx, ...patch };
}

/** Render to a plain string, or null if anything inside needs a fallback. */
function plain(node: Node | Node[] | undefined, ctx: RenderCtx): string | null {
  if (node === undefined) return null;
  const dry = child(ctx, { dry: true, issues: [] });
  const pieces = Array.isArray(node) ? renderNodes(node, dry, []) : renderNode(node, dry, []);
  if (pieces.some((p) => p.kind === 'fallback')) return null;
  return pieces.map((p) => p.text).join('');
}

/** Render to an ASCII-ish linearization; always succeeds. */
function flat(node: Node | Node[] | undefined, ctx: RenderCtx): string {
  if (node === undefined) return '';
  const f = child(ctx, { dry: true, flatten: true, issues: [] });
  const pieces = Array.isArray(node) ? renderNodes(node, f, []) : renderNode(node, f, []);
  return pieces.map((p) => p.text).join('');
}

/** Wrap in parentheses unless the expression already reads as one unit. */
function paren(s: string): string {
  if ([...s].length <= 1) return s;
  if (/^\d+(\.\d+)?$/.test(s)) return s;              // a single number: ∛27
  if (/^\(.*\)$/.test(s) || /^\[.*\]$/.test(s)) return s;
  if (/^\|[^|]*\|$/.test(s) || /^‖[^‖]*‖$/.test(s)) return s;
  return `(${s})`;
}

/**
 * A construct Unicode cannot express. In flatten mode produce the ASCII form
 * directly; otherwise record an issue and apply the configured policy.
 */
function fail(
  node: Node,
  cause: { code: IssueCode; detail: string; reason: string },
  ascii: string,
  ctx: RenderCtx,
  path: number[],
): Piece[] {
  if (ctx.flatten) return [{ text: ascii, kind: 'fallback' }];

  const id = `s${ctx.segIdx}:${path.join('.')}`;
  const keepPreview = sourceOf(node, ctx);
  const policy = ctx.opts.overrides[id] ?? ctx.opts.defaultPolicy;
  const text = policy === 'flatten' ? ascii : keepPreview;

  if (!ctx.dry) {
    ctx.issues.push({
      id,
      code: cause.code,
      detail: cause.detail,
      reason: cause.reason,
      source: keepPreview,
      line: lineOf(ctx.source, ctx.offset + node.s),
      policy,
      keepPreview,
      flattenPreview: ascii,
    });
  }
  return [{ text, kind: 'fallback', issueId: id }];
}

const IS_WORDLIKE = /^[\p{L}\p{N}]/u;
const OPEN_DELIM = /[([{⟨⌈⌊⟦]/;
const CLOSE_DELIM = /[)\]}⟩⌉⌋⟧,;.!?]/;

export function renderNodes(nodes: Node[], ctx: RenderCtx, path: number[]): Piece[] {
  const rendered = nodes.map((n, i) => renderNode(n, ctx, [...path, i]));
  const textOf = (pieces: Piece[]) => pieces.map((p) => p.text).join('');

  // Authored whitespace is a hint, not content: drop it where a typesetter
  // would have, so `\left( a \right)` is "(a)" and not "( a )".
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].t !== 'space') continue;
    let prev = '';
    for (let j = i - 1; j >= 0 && prev === ''; j--) prev = textOf(rendered[j]);
    let next = '';
    for (let j = i + 1; j < nodes.length && next === ''; j++) next = textOf(rendered[j]);
    const redundant =
      prev === '' ||                       // leading
      next === '' ||                       // trailing
      /\s$/.test(prev) ||                  // already spaced
      /^\s/.test(next) ||
      OPEN_DELIM.test(prev.slice(-1)) ||
      CLOSE_DELIM.test(next[0]);
    if (redundant) rendered[i] = [];
  }

  const out: Piece[] = [];
  for (let i = 0; i < nodes.length; i++) {
    // `\sin x` needs its space back if the author omitted it: `\sin\theta`.
    const prev = nodes[i - 1];
    if (prev && (prev.t === 'func' || (prev.t === 'op' && LIMIT_OP_TEXT[prev.name]))) {
      const first = rendered[i].find((p) => p.text.length > 0);
      if (first && IS_WORDLIKE.test(first.text)) out.push({ text: ' ', kind: 'math' });
    }
    out.push(...rendered[i]);
  }
  return out;
}

export function renderNode(node: Node, ctx: RenderCtx, path: number[]): Piece[] {
  switch (node.t) {
    case 'chars': {
      let text = node.text;
      if (ctx.opts.prettyMinus) text = text.replace(/-/g, '−');
      text = text.replace(/''/g, '″').replace(/'/g, '′');
      return [{ text, kind: 'math' }];
    }

    case 'sym':
      return [{ text: SYMBOLS[node.name] ?? '', kind: 'math' }];

    case 'func':
      return [{ text: node.name, kind: 'math' }];

    case 'op':
      return [{ text: LIMIT_OP_TEXT[node.name] ?? SYMBOLS[node.name] ?? node.name, kind: 'math' }];

    case 'space':
      return [{ text: ' ', kind: 'math' }];

    case 'row':
      return [{ text: '\n', kind: 'math' }];

    case 'group':
      return renderNodes(node.body, ctx, path);

    case 'unknown':
      return fail(
        node,
        {
          code: 'unknown-command',
          detail: `\\${node.name}`,
          reason: `\\${node.name} is not in the symbol table`,
        },
        node.name,
        ctx,
        path,
      );

    case 'script':
      return renderScript(node, ctx, path);

    case 'frac':
      return renderFrac(node, ctx, path);

    case 'sqrt':
      return renderSqrt(node, ctx, path);

    case 'accent':
      return renderAccent(node, ctx, path);

    case 'style': {
      const inner = plain(node.body, ctx);
      const styled = inner === null ? null : toStyled(inner, node.cmd);
      if (styled === null) {
        const target = inner ?? sourceOf(node.body, ctx);
        return fail(
          node,
          {
            code: 'style-alphabet',
            detail: target,
            reason: `\\${node.cmd} has no Unicode form for "${target}"`,
          },
          inner ?? flat(node.body, ctx),
          ctx,
          path,
        );
      }
      return [{ text: styled, kind: 'math' }];
    }

    case 'upright': {
      // \text{...} / \mathrm{...}: contents already are the plain form.
      const pieces = renderNodes([node.body], ctx, path);
      return pieces.map((p) => (p.kind === 'math' ? { ...p, text: p.text.replace(/−/g, '-') } : p));
    }

    case 'env':
      return renderEnv(node, ctx, path);
  }
}

function renderScript(
  node: Extract<Node, { t: 'script' }>,
  ctx: RenderCtx,
  path: number[],
): Piece[] {
  const base = node.base;

  // Big operators and limit words put their arguments above and below the
  // symbol. There is no inline Unicode equivalent, so this always falls back.
  if (base && base.t === 'op') {
    const opText = LIMIT_OP_TEXT[base.name] ?? SYMBOLS[base.name] ?? base.name;
    const sub = flat(node.sub, ctx);
    const sup = flat(node.sup, ctx);
    const range = sub && sup ? `${sub}→${sup}` : sub ? sub : `→${sup}`;
    return fail(
      node,
      {
        code: 'operator-limits',
        detail: opText,
        reason: `limits on ${opText} cannot be placed above and below inline`,
      },
      `${opText}(${range})`,
      ctx,
      path,
    );
  }

  const baseText = base ? plain(base, ctx) : '';
  if (baseText === null) {
    return fail(
      node,
      {
        code: 'script-base',
        detail: sourceOf(base!, ctx),
        reason: 'the base of the script is not convertible',
      },
      flatScript(node, ctx),
      ctx,
      path,
    );
  }

  const supSrc = node.sup ? plain(node.sup, ctx) : undefined;
  const subSrc = node.sub ? plain(node.sub, ctx) : undefined;
  const sup = supSrc === undefined ? '' : supSrc === null ? null : toScript(supSrc, SUPERSCRIPT);
  const sub = subSrc === undefined ? '' : subSrc === null ? null : toScript(subSrc, SUBSCRIPT);

  if (sup === null || sub === null) {
    const bad = sup === null ? (supSrc ?? '') : (subSrc ?? '');
    const which = sup === null ? 'superscript' : 'subscript';
    const missing = [...bad].filter(
      (ch) => (sup === null ? SUPERSCRIPT : SUBSCRIPT)[ch] === undefined,
    );
    const detail = missing.length ? missing.join('') : bad;
    const reason = missing.length
      ? `Unicode has no ${which} form for ${missing.map((c) => `"${c}"`).join(', ')}`
      : `"${bad}" cannot be rendered as a ${which}`;
    return fail(
      node,
      { code: sup === null ? 'no-superscript' : 'no-subscript', detail, reason },
      flatScript(node, ctx),
      ctx,
      path,
    );
  }

  return [{ text: baseText + sup + sub, kind: 'math' }];
}

function flatScript(node: Extract<Node, { t: 'script' }>, ctx: RenderCtx): string {
  const base = node.base ? flat(node.base, ctx) : '';
  const sub = node.sub ? `_${paren(flat(node.sub, ctx))}` : '';
  const sup = node.sup ? `^${paren(flat(node.sup, ctx))}` : '';
  return base + sub + sup;
}

function renderFrac(node: Extract<Node, { t: 'frac' }>, ctx: RenderCtx, path: number[]): Piece[] {
  const num = plain(node.num, ctx);
  const den = plain(node.den, ctx);

  if (node.style === 'binom') {
    return fail(
      node,
      { code: 'binomial', detail: '', reason: 'binomial coefficients are two-dimensional' },
      `C(${flat(node.num, ctx)}, ${flat(node.den, ctx)})`,
      ctx,
      path,
    );
  }

  if (num !== null && den !== null) {
    const vulgar = vulgarFraction(num, den);
    if (vulgar) return [{ text: vulgar, kind: 'math' }];
  }

  const ascii = `${paren(flat(node.num, ctx))}/${paren(flat(node.den, ctx))}`;
  return fail(
    node,
    {
      code: 'stacked-fraction',
      detail: '',
      reason: 'a stacked fraction has no single Unicode character',
    },
    ascii,
    ctx,
    path,
  );
}

function renderSqrt(node: Extract<Node, { t: 'sqrt' }>, ctx: RenderCtx, path: number[]): Piece[] {
  const RADICALS: Record<string, string> = { '': '√', '2': '√', '3': '∛', '4': '∜' };
  const index = node.index ? plain(node.index, ctx) : '';
  const radical = index === null ? undefined : RADICALS[index];
  const body = plain(node.body, ctx);

  if (radical === undefined || body === null) {
    const idx = node.index ? `${flat(node.index, ctx)}` : '';
    const ascii = idx
      ? `${paren(flat(node.body, ctx))}^(1/${idx})`
      : `√${paren(flat(node.body, ctx))}`;
    return fail(
      node,
      radical === undefined
        ? {
            code: 'radical-degree',
            detail: idx,
            reason: `Unicode only has radical signs for degrees 2, 3 and 4 (got ${index})`,
          }
        : {
            code: 'radicand',
            detail: sourceOf(node.body, ctx),
            reason: 'the radicand is not convertible',
          },
      ascii,
      ctx,
      path,
    );
  }
  return [{ text: radical + paren(body), kind: 'math' }];
}

function renderAccent(node: Extract<Node, { t: 'accent' }>, ctx: RenderCtx, path: number[]): Piece[] {
  const mark = ACCENTS[node.cmd];
  const body = plain(node.body, ctx);
  const chars = body === null ? [] : [...body];

  if (body === null || chars.length !== 1) {
    return fail(
      node,
      body === null
        ? {
            code: 'accent-body',
            detail: sourceOf(node.body, ctx),
            reason: 'the accented expression is not convertible',
          }
        : {
            code: 'accent-base',
            detail: body,
            reason: `a combining ${node.cmd} only attaches to a single character, not "${body}"`,
          },
      `${node.cmd}(${flat(node.body, ctx)})`,
      ctx,
      path,
    );
  }
  return [{ text: applyAccent(chars[0], mark), kind: 'math' }];
}

function renderEnv(node: Extract<Node, { t: 'env' }>, ctx: RenderCtx, path: number[]): Piece[] {
  const single = node.rows.length === 1 && node.rows[0].length === 1 && LINE_ENVS.has(node.name);

  // A one-line align/equation is just math in a wrapper — no layout is lost.
  if (single) return renderNodes(node.rows[0][0], ctx, path);

  const cells = node.rows.map((row) => row.map((cell) => flat(cell, ctx).trim()));

  let ascii: string;
  if (LINE_ENVS.has(node.name)) {
    ascii = cells.map((row) => row.join(' ').trim()).filter((l) => l !== '').join('\n');
  } else {
    const [open, close] = ENV_BRACKETS[node.name] ?? ['(', ')'];
    ascii = open + cells.map((row) => row.join(', ')).join('; ') + close;
  }

  const lines = LINE_ENVS.has(node.name);
  const size = lines
    ? String(cells.length)
    : `${cells.length}×${Math.max(...cells.map((r) => r.length))}`;
  const shape = lines ? `${size} aligned lines` : `a ${size} grid`;
  return fail(
    node,
    {
      code: lines ? 'env-lines' : 'env-grid',
      detail: size,
      reason: `${node.name} lays out ${shape}, which is not linear text`,
    },
    ascii,
    ctx,
    path,
  );
}
