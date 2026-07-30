/**
 * Accent commands, mapped to Unicode combining marks.
 * A combining mark attaches to the single preceding character, so these only
 * work over a one-character base.
 */
export const ACCENTS: Record<string, string> = {
  hat: '̂',
  widehat: '̂',
  tilde: '̃',
  widetilde: '̃',
  bar: '̄',
  overline: '̅',
  underline: '̲',
  underbar: '̲',
  vec: '⃗',
  overrightarrow: '⃗',
  overleftarrow: '⃖',
  overleftrightarrow: '⃡',
  dot: '̇',
  ddot: '̈',
  dddot: '⃛',
  ddddot: '⃜',
  breve: '̆',
  check: '̌',
  acute: '́',
  grave: '̀',
  mathring: '̊',
  ring: '̊',
  not: '̸', // combining long solidus overlay
  cancel: '̸',
};

/**
 * Attach a combining mark to a single-character base.
 *
 * NFC does the heavy lifting: `a` + U+0302 composes to `â`, `=` + U+0338
 * composes to `≠`. Where no precomposed character exists the decomposed
 * sequence is returned as-is, which is still correct — just more
 * font-dependent in how it renders.
 */
export function applyAccent(base: string, mark: string): string {
  return (base + mark).normalize('NFC');
}
