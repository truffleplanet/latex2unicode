import type { Frontend } from '../frontend.js';
import { segmentAscii } from './segment.js';
import { scan } from './scan.js';

/** Plain-text notation: `forall x, x in A -> f^-1(x) <= y`. */
export const asciiFrontend: Frontend = {
  name: 'ascii',
  segment: (source) => segmentAscii(source),
  parse: (seg) => scan(seg.body),
  // No escape character in this notation — a command is just the word.
  labelCommand: (name) => name,
};

export { segmentAscii } from './segment.js';
export { scan } from './scan.js';
export { classifyLine, type LineKind } from './classify.js';
