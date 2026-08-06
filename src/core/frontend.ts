import type { Node } from './node.js';
import type { ConvertOptions } from './types.js';

/** A contiguous run of the document: untouched prose, or something to convert. */
export interface Segment {
  kind: 'text' | 'math';
  /** Original text including any delimiters. */
  raw: string;
  /** The part to convert (delimiters stripped). */
  body: string;
  /** Offset of `raw` in the source. */
  start: number;
  /** Offset of `body` in the source. */
  bodyStart: number;
  /** Block-level rather than inline. */
  display: boolean;
  /**
   * `math` applies math typography (minus signs, primes); `text` keeps prose
   * conventions. A front-end tags each region with the one that fits.
   */
  texMode: 'math' | 'text';
}

/**
 * A notation the tool can read. Each front-end owns two decisions — which parts
 * of the document are convertible, and what they mean — and nothing else: the
 * renderer, the Unicode tables and the fallback machinery are shared.
 */
export interface Frontend {
  name: string;
  segment(source: string, opts: ConvertOptions): Segment[];
  /** Parse one region's body. Offsets must be relative to `seg.bodyStart`. */
  parse(seg: Segment): Node[];
  /**
   * How to name a command in an issue message. LaTeX writes `\alpha`; a
   * notation without escapes writes the bare word.
   */
  labelCommand(name: string): string;
}
