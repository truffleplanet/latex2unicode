import type { Segment } from '../frontend.js';
import { skipInlineCode } from '../text/code.js';
import { classifyLine } from './classify.js';

/**
 * On a prose line only this shape is converted: an identifier carrying an
 * exponent. The base must be a letter — `2^32` is a computing idiom far more
 * often than it is arithmetic, and a sentence is the wrong place to guess.
 */
const SCRIPT_IN_PROSE = /[A-Za-z][A-Za-z0-9]*\^\(?[-+]?[A-Za-z0-9]+\)?/g;

/**
 * Split a document written in plain-text notation.
 *
 * Work is done a line at a time because that is the unit a reader judges too:
 * a line of a derivation is notation throughout, while a sentence mentioning
 * `f^-1` is a sentence. Fenced blocks and inline code are never either.
 */
export function segmentAscii(source: string): Segment[] {
  const out: Segment[] = [];
  let textStart = 0;
  let inFence = false;

  const flushText = (upto: number) => {
    if (upto <= textStart) return;
    out.push({
      kind: 'text',
      raw: source.slice(textStart, upto),
      body: source.slice(textStart, upto),
      start: textStart,
      bodyStart: textStart,
      display: false,
      texMode: 'text',
    });
  };

  const pushMath = (start: number, end: number, display: boolean) => {
    if (end <= start) return;
    flushText(start);
    out.push({
      kind: 'math',
      raw: source.slice(start, end),
      body: source.slice(start, end),
      start,
      bodyStart: start,
      display,
      texMode: 'math',
    });
    textStart = end;
  };

  let lineStart = 0;
  while (lineStart <= source.length) {
    const nl = source.indexOf('\n', lineStart);
    const lineEnd = nl === -1 ? source.length : nl;
    const line = source.slice(lineStart, lineEnd);

    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
    } else if (!inFence) {
      const kind = classifyLine(line);
      if (kind === 'formal') {
        // Keep the indentation as prose so the layout of a proof survives.
        const lead = line.length - line.trimStart().length;
        const trail = line.length - line.trimEnd().length;
        pushMath(lineStart + lead, lineEnd - trail, true);
      } else if (kind === 'prose') {
        for (const m of findScripts(line)) {
          pushMath(lineStart + m.start, lineStart + m.end, false);
        }
      }
    }

    if (nl === -1) break;
    lineStart = nl + 1;
  }

  flushText(source.length);
  return out;
}

/** Exponent expressions on a prose line, skipping anything inside code spans. */
function findScripts(line: string): Array<{ start: number; end: number }> {
  const spans: Array<{ start: number; end: number }> = [];
  const code: Array<[number, number]> = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== '`') continue;
    const close = skipInlineCode(line, i);
    if (close === -1) break;
    code.push([i, close]);
    i = close - 1;
  }

  SCRIPT_IN_PROSE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SCRIPT_IN_PROSE.exec(line)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (code.some(([a, b]) => start < b && end > a)) continue;
    spans.push({ start, end });
  }
  return spans;
}
