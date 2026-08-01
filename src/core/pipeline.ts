import type { Frontend } from './frontend.js';
import { renderNodes, type RenderCtx } from './render.js';
import type { ConvertOptions, ConvertResult, Issue, Piece } from './types.js';

/** TeX prose idioms, applied to surrounding text only when explicitly enabled. */
function textLigatures(s: string): string {
  return s
    .replace(/---/g, '—')
    .replace(/--/g, '–')
    .replace(/``/g, '“')
    .replace(/''/g, '”')
    .replace(/\.\.\./g, '…');
}

/**
 * Segments in, text out. Everything notation-specific was already decided by
 * the front-end; from here the two modes are indistinguishable.
 */
export function run(
  source: string,
  frontend: Frontend,
  opts: ConvertOptions,
): ConvertResult {
  const segments = frontend.segment(source, opts);

  const pieces: Piece[] = [];
  const issues: Issue[] = [];
  let mathSegments = 0;
  let convertedChars = 0;

  // Line starts, computed once — issues look their line number up here.
  const lines: number[] = [0];
  for (let i = 0; i < source.length; i++) if (source[i] === '\n') lines.push(i + 1);

  segments.forEach((seg, segIdx) => {
    if (seg.kind === 'text') {
      pieces.push({ text: opts.textLigatures ? textLigatures(seg.body) : seg.body, kind: 'text' });
      return;
    }

    mathSegments++;
    const ctx: RenderCtx = {
      source,
      offset: seg.bodyStart,
      segIdx,
      opts,
      issues,
      dry: false,
      flatten: false,
      // −/′ substitution is a math-mode convention only.
      textMode: seg.texMode === 'text',
      memo: new WeakMap(),
      lines,
      labelCommand: frontend.labelCommand,
    };

    let rendered: Piece[];
    try {
      rendered = renderNodes(frontend.parse(seg), ctx, []);
    } catch {
      // Pathological input (thousands of nested groups) must never throw.
      pieces.push({ text: seg.raw, kind: 'text' });
      return;
    }
    if (rendered.every((p) => p.text === '')) {
      // Nothing came out — safer to leave the original than to delete it.
      pieces.push({ text: seg.raw, kind: 'text' });
      return;
    }
    convertedChars += seg.raw.length;
    pieces.push(...rendered);
  });

  return {
    pieces: mergePieces(pieces),
    issues,
    text: pieces.map((p) => p.text).join(''),
    stats: { segments: mathSegments, issues: issues.length, convertedChars },
  };
}

/** Collapse adjacent pieces of the same kind so the UI renders fewer spans. */
function mergePieces(pieces: Piece[]): Piece[] {
  const out: Piece[] = [];
  for (const p of pieces) {
    const last = out[out.length - 1];
    if (last && last.kind === p.kind && last.issueId === p.issueId && p.kind !== 'fallback') {
      last.text += p.text;
    } else {
      out.push({ ...p });
    }
  }
  return out;
}
