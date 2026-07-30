#!/usr/bin/env node
/**
 * Collect every non-ASCII character the UI chrome can render, and write it to
 * scripts/font-charset.txt.
 *
 * The webfont is a subset, so its charset is a contract: a new Korean UI string
 * whose syllables the subset lacks would silently fall back to the system font.
 * `npm test` asserts this file still covers the sources, and
 * scripts/subset-font.sh rebuilds the woff2 from it.
 *
 * Only chrome text matters. The input and result panes are monospace and hold
 * arbitrary user text, which no practical subset could cover.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHARSET = join(root, 'scripts', 'font-charset.txt');

/** Files whose literals reach the UI. sample.ts is user content — excluded. */
const SOURCES = ['index.html', 'src/main.ts', 'src/messages.ts'];

export function collect() {
  const chars = new Set();
  for (const rel of SOURCES) {
    for (const ch of readFileSync(join(root, rel), 'utf8')) {
      // ASCII is always present; the subset keeps U+0020-007E wholesale.
      if (ch.codePointAt(0) > 0x7f) chars.add(ch);
    }
  }
  return [...chars].sort();
}

export function charset() {
  return new Set(readFileSync(CHARSET, 'utf8').replace(/\s/g, ''));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const chars = collect();
  writeFileSync(CHARSET, `${chars.join('')}\n`, 'utf8');
  console.log(`${chars.length} non-ASCII characters -> scripts/font-charset.txt`);
}
