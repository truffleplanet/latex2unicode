import { describe, expect, it } from 'vitest';
import { convert, toUnicode } from '../src/core/convert.js';

const u = (s: string) => toUnicode(s);
const flat = (s: string) => toUnicode(s, { defaultPolicy: 'flatten' });

describe('symbols', () => {
  it('maps greek and operators', () => {
    expect(u('$\\alpha + \\beta$')).toBe('α + β');
    expect(u('$a \\leq b \\neq c$')).toBe('a ≤ b ≠ c');
    expect(u('$x \\in \\mathbb{R}$')).toBe('x ∈ ℝ');
    expect(u('$\\forall \\epsilon > 0$')).toBe('∀ ϵ > 0');
  });

  it('drops sizing and spacing commands', () => {
    expect(u('$\\left( a \\right)$')).toBe('(a)');
    expect(u('$a \\, b$')).toBe('a\u2009b'); // \, is a thin space
  });

  it('keeps a space after a named function', () => {
    expect(u('$\\sin x$')).toBe('sin x');
    expect(u('$\\log(n)$')).toBe('log(n)');
  });
});

describe('whitespace policy', () => {
  // Plain text cannot re-derive spacing from operator classes the way TeX
  // does, so authored whitespace is preserved and only normalised.
  it('keeps the spaces the author wrote', () => {
    expect(u('$a + b$')).toBe('a + b');
    expect(u('$a+b$')).toBe('a+b');
  });

  it('squeezes spaces against delimiters', () => {
    expect(u('$f( a ) = 1$')).toBe('f(a) = 1');
    expect(u('$[ a , b ] = c$')).toBe('[a, b] = c');
  });

  it('trims the edges of a segment', () => {
    // `$ x $` is deliberately not math — padded delimiters read as currency.
    expect(u('\\( x \\)')).toBe('x');
    expect(u('$$ a + b $$')).toBe('a + b');
  });

  it('collapses doubled spacing', () => {
    expect(u('$a \\quad b$')).toBe('a\u2003b');
  });
});

describe('scripts', () => {
  it('converts what Unicode supports', () => {
    expect(u('$x^2$')).toBe('x²');
    expect(u('$H_2O$')).toBe('H₂O');
    expect(u('$x^{n+1}$')).toBe('xⁿ⁺¹');
    expect(u('$a_i^2$')).toBe('a²ᵢ');
  });

  it('falls back where Unicode has no glyph', () => {
    // there is no subscript "b"
    expect(u('$a_b$')).toBe('a_b');
    expect(flat('$a_b$')).toBe('a_b');
    // there is no superscript "q"
    expect(u('$x^q$')).toBe('x^q');
    const { issues } = convert('$a_b$');
    expect(issues).toHaveLength(1);
    expect(issues[0].reason).toContain('no subscript form for "b"');
  });

  it('flattens nested scripts', () => {
    expect(flat('$x^{y^z}$')).toBe('x^(yᶻ)');
  });
});

describe('fractions and roots', () => {
  it('uses vulgar fractions when they exist', () => {
    expect(u('$\\frac{1}{2}$')).toBe('½');
    expect(u('$\\frac34$')).toBe('¾');
  });

  it('falls back on general fractions', () => {
    expect(u('$\\frac{a+b}{c}$')).toBe('\\frac{a+b}{c}');
    expect(flat('$\\frac{a+b}{c}$')).toBe('(a+b)/c');
    expect(flat('$\\frac{x}{y}$')).toBe('x/y');
  });

  it('handles roots', () => {
    expect(u('$\\sqrt{x}$')).toBe('√x');
    expect(u('$\\sqrt{a+b}$')).toBe('√(a+b)');
    expect(u('$\\sqrt[3]{8}$')).toBe('∛8');
    expect(u('$\\sqrt[3]{27} = 3$')).toBe('∛27 = 3');
    expect(u('$\\sqrt{ab} > 0$')).toBe('√(ab) > 0');
    expect(flat('$\\sqrt[5]{x}$')).toBe('x^(1/5)');
  });
});

describe('accents', () => {
  it('composes single-character bases', () => {
    expect(u('$\\hat{x}$')).toBe('x̂'.normalize('NFC'));
    expect(u('$\\bar{a}$')).toBe('ā');
    expect(u('$\\vec{v}$')).toBe('v⃗');
  });

  it('falls back over multi-character bases', () => {
    expect(u('$\\hat{xy}$')).toBe('\\hat{xy}');
    expect(flat('$\\hat{xy}$')).toBe('hat(xy)');
  });
});

describe('alphabets', () => {
  it('maps the styled alphabets', () => {
    expect(u('$\\mathbb{R}$')).toBe('ℝ');
    expect(u('$\\mathbf{A}$')).toBe('𝐀');
    expect(u('$\\mathcal{L}$')).toBe('ℒ');
    expect(u('$\\mathfrak{g}$')).toBe('𝔤');
    expect(u('\\textbf{Bold}')).toBe('𝐁𝐨𝐥𝐝');
  });

  it('passes \\text through unchanged', () => {
    expect(u('$\\text{if } x > 0$')).toBe('if x > 0');
  });
});

describe('limit operators', () => {
  it('keeps the bare operator', () => {
    expect(u('$\\sum x$')).toBe('∑ x');
  });

  it('falls back when limits are attached', () => {
    expect(u('$\\sum_{i=1}^{n} i$')).toBe('\\sum_{i=1}^{n} i');
    expect(flat('$\\sum_{i=1}^{n} i$')).toBe('∑(i=1→n) i');
    expect(flat('$\\int_a^b f$')).toBe('∫(a→b) f');
    expect(flat('$\\lim_{x \\to 0} f$')).toBe('lim(x → 0) f');
  });
});

describe('environments', () => {
  it('linearizes matrices', () => {
    expect(flat('$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$')).toBe('(a, b; c, d)');
    expect(flat('$\\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}$')).toBe('[1, 0; 0, 1]');
  });

  it('linearizes aligned equations to lines', () => {
    expect(flat('\\begin{align} a &= b \\\\ c &= d \\end{align}')).toBe('a = b\nc = d');
  });

  it('unwraps a single-line equation without complaint', () => {
    expect(u('\\begin{equation} x^2 \\end{equation}')).toBe('x²');
    expect(convert('\\begin{equation} x^2 \\end{equation}').issues).toHaveLength(0);
  });
});

describe('prose is left alone', () => {
  it('does not touch surrounding text', () => {
    const src = '이 논문에서 우리는 $\\alpha$ 값을 사용하고, 가격은 $100 이다.';
    expect(u(src)).toBe('이 논문에서 우리는 α 값을 사용하고, 가격은 $100 이다.');
  });

  it('leaves TeX prose idioms unless asked', () => {
    expect(u('a --- b')).toBe('a --- b');
    expect(toUnicode('a --- b', { textLigatures: true })).toBe('a — b');
  });

  it('converts escaped literals', () => {
    expect(u('50\\% of cases')).toBe('50% of cases');
  });
});

describe('per-issue overrides', () => {
  it('flattens only the selected construct', () => {
    const src = 'both $\\frac{a}{b}$ and $\\frac{c}{d}$ here';
    const first = convert(src);
    expect(first.issues).toHaveLength(2);

    const target = first.issues[0].id;
    const after = convert(src, { overrides: { [target]: 'flatten' } });
    expect(after.text).toBe('both a/b and \\frac{c}{d} here');
  });

  it('keeps ids stable across runs', () => {
    const src = '$\\frac{a}{b}$ and $x^q$';
    const a = convert(src).issues.map((i) => i.id);
    const b = convert(src, { prettyMinus: false }).issues.map((i) => i.id);
    expect(a).toEqual(b);
  });

  it('reports line numbers', () => {
    const { issues } = convert('line one\nline two $a_b$\n');
    expect(issues[0].line).toBe(2);
  });
});

describe('the documented fallback table', () => {
  // Every row of the table in README.md, kept honest.
  const rows: Array<[string, string, string]> = [
    ['$\\frac{a+b}{c}$', '\\frac{a+b}{c}', '(a+b)/c'],
    ['$\\sum_{i=1}^{n}$', '\\sum_{i=1}^{n}', '∑(i=1→n)'],
    ['$\\lim_{t \\to \\infty}$', '\\lim_{t \\to \\infty}', 'lim(t → ∞)'],
    ['$a_b$', 'a_b', 'a_b'],
    ['$\\hat{xy}$', '\\hat{xy}', 'hat(xy)'],
    ['$\\binom{n}{k}$', '\\binom{n}{k}', 'C(n, k)'],
    [
      '$\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$',
      '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}',
      '(a, b; c, d)',
    ],
    [
      '$\\begin{cases} a & x>0 \\\\ b & x<0 \\end{cases}$',
      '\\begin{cases} a & x>0 \\\\ b & x<0 \\end{cases}',
      '{a, x>0; b, x<0}',
    ],
  ];

  it.each(rows)('%s', (src, keep, flatten) => {
    expect(u(src)).toBe(keep);
    expect(flat(src)).toBe(flatten);
  });
});

describe('output invariants', () => {
  it('pieces always join to the output text', () => {
    const src = 'x $\\frac{a}{b}$ y $\\alpha$ z';
    const r = convert(src);
    expect(r.pieces.map((p) => p.text).join('')).toBe(r.text);
  });

  it('tags fallback pieces with their issue id', () => {
    const r = convert('$\\frac{a}{b}$');
    const fb = r.pieces.filter((p) => p.kind === 'fallback');
    expect(fb).toHaveLength(1);
    expect(fb[0].issueId).toBe(r.issues[0].id);
  });

  it('never throws on malformed input', () => {
    const bad = ['$', '$$', '\\frac{', '\\begin{align}', '${}^{}_{}$', '\\sqrt[', '$x^$'];
    for (const s of bad) expect(() => convert(s)).not.toThrow();
  });
});
