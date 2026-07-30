/**
 * Unicode superscript / subscript coverage.
 *
 * These blocks are deliberately incomplete in Unicode — there is no superscript
 * `q`, and subscripts exist for only 14 Latin letters. Anything outside these
 * tables is a genuine dead end and must go through the fallback path.
 */

export const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  // Lowercase Latin — every letter except q.
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ',
  i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ', n: 'ⁿ', o: 'ᵒ', p: 'ᵖ',
  r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
  // Uppercase Latin — C, F, Q, S, X, Y, Z are missing from Unicode.
  A: 'ᴬ', B: 'ᴮ', D: 'ᴰ', E: 'ᴱ', G: 'ᴳ', H: 'ᴴ', I: 'ᴵ', J: 'ᴶ',
  K: 'ᴷ', L: 'ᴸ', M: 'ᴹ', N: 'ᴺ', O: 'ᴼ', P: 'ᴾ', R: 'ᴿ', T: 'ᵀ',
  U: 'ᵁ', V: 'ⱽ', W: 'ᵂ',
  // Greek — only a handful exist.
  β: 'ᵝ', γ: 'ᵞ', δ: 'ᵟ', θ: 'ᶿ', ι: 'ᶥ', ϕ: 'ᵠ', φ: 'ᵠ', χ: 'ᵡ',
  // Common punctuation that has a modifier form.
  '·': '˙', '∘': '°', '*': '*',
};

export const SUBSCRIPT: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '−': '₋', '=': '₌', '(': '₍', ')': '₎',
  // Lowercase Latin — Unicode only provides these 14.
  a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ',
  n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
  // Greek subscripts.
  β: 'ᵦ', γ: 'ᵧ', ρ: 'ᵨ', ϕ: 'ᵩ', φ: 'ᵩ', χ: 'ᵪ',
};

/** Map every code point of `s`, or return null if any one has no counterpart. */
export function toScript(s: string, table: Record<string, string>): string | null {
  let out = '';
  for (const ch of s) {
    const mapped = table[ch];
    if (mapped === undefined) return null;
    out += mapped;
  }
  return out === '' ? null : out;
}
