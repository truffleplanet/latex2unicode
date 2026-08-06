import type { Frontend } from '../frontend.js';
import { segment } from './segment.js';
import { parse } from './parse.js';

/** LaTeX: `$…$`, `\(…\)`, math environments, and bare `\commands` in prose. */
export const latexFrontend: Frontend = {
  name: 'latex',
  segment: (source, opts) => segment(source, { convertBareCommands: opts.convertBareCommands }),
  parse: (seg) => parse(seg.body),
  labelCommand: (name) => `\\${name}`,
};

export { segment, looksLikeMath, looksLikeDisplayMath, KNOWN_COMMANDS } from './segment.js';
export { parse } from './parse.js';
export { tokenize } from './tokenize.js';
