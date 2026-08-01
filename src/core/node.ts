/**
 * The AST both front-ends produce and the renderer consumes.
 *
 * Offsets (`s`, `e`) are relative to the segment body they came from, and must
 * point into the **original document** — the renderer slices the source with
 * them to build `keep` output and issue previews. A front-end that rewrites its
 * input before parsing would report text the author never wrote.
 */
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
  | { t: 'unknown'; name: string; args: Node[]; s: number; e: number };
