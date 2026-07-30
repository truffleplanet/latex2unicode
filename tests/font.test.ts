import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ESM helper, no type declarations needed
import { collect, charset } from '../scripts/collect-glyphs.mjs';

describe('self-hosted font subset', () => {
  /**
   * "Sheet Sans" only contains the glyphs listed in scripts/font-charset.txt.
   * A new Korean UI string would otherwise fall back to the system font with no
   * visible error, so this guards the charset against drift.
   */
  it('covers every character the UI chrome can render', () => {
    const have: Set<string> = charset();
    const missing = (collect() as string[]).filter((ch) => !have.has(ch));
    expect(missing, 'Run: npm run font').toEqual([]);
  });
});
