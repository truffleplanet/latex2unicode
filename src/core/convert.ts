import type { Frontend } from './frontend.js';
import { latexFrontend } from './latex/index.js';
import { run } from './pipeline.js';
import { defaultOptions, type ConvertOptions, type ConvertResult, type Mode } from './types.js';

const FRONTENDS: Record<Mode, Frontend> = {
  latex: latexFrontend,
};

export function convert(source: string, options: Partial<ConvertOptions> = {}): ConvertResult {
  const opts: ConvertOptions = { ...defaultOptions, ...options };
  const frontend = FRONTENDS[opts.mode] ?? latexFrontend;
  return run(source, frontend, opts);
}

/** Convenience wrapper for tests and any programmatic use. */
export function toUnicode(source: string, options: Partial<ConvertOptions> = {}): string {
  return convert(source, options).text;
}
