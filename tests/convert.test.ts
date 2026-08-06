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
    // Subscript before superscript, as x₁² is read — whatever the source order.
    expect(u('$a_i^2$')).toBe('aᵢ²');
    expect(u('$a^2_i$')).toBe('aᵢ²');
    expect(u('$SO_4^{2-}$')).toBe('SO₄²⁻');
  });

  it('ignores whitespace before ^ and _, as TeX does', () => {
    expect(u('$x ^2$')).toBe('x²');
    expect(u('$(x+y) ^2$')).toBe('(x+y)²');
    expect(u('$a _1$')).toBe('a₁');
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

  it('sets fully-scriptable limits inline on glyph operators', () => {
    expect(u('$\\sum_{i=1}^{n} i$')).toBe('∑ᵢ₌₁ⁿ i');
    expect(u('$\\int_a^b f$')).toBe('∫ₐᵇ f');
    expect(convert('$\\sum_{i=1}^{n} i$').issues).toHaveLength(0);
    // ∞ has no superscript form — this one still falls back.
    expect(flat('$\\int_0^\\infty$')).toBe('∫(0→∞)');
  });

  it('falls back when a limit has no script form', () => {
    expect(u('$\\lim_{x \\to 0} f$')).toBe('\\lim_{x \\to 0} f');
    expect(flat('$\\lim_{x \\to 0} f$')).toBe('lim(x → 0) f');
    expect(flat('$\\sum_{k \\in S}$')).toBe('∑(k ∈ S)');
    expect(flat('$\\max_{x \\in D} f$')).toBe('max(x ∈ D) f');
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

  it('does not apply text ligatures inside code', () => {
    const fenced = '```\na---b and ``quoted\'\'\n```';
    expect(toUnicode(`before --- \`a---b\` after ---`, { textLigatures: true })).toBe(
      'before — `a---b` after —',
    );
    expect(toUnicode(fenced, { textLigatures: true })).toBe(fenced);
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
    ['$\\sum_{k \\in S}$', '\\sum_{k \\in S}', '∑(k ∈ S)'],
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

describe('math-mode vs text-mode typography', () => {
  it('keeps apostrophes in text content', () => {
    expect(u("$\\text{don't}$")).toBe("don't");
    expect(u("We say \\textbf{don't} here.")).toBe('We say 𝐝𝐨𝐧\u0027𝐭 here.');
    expect(u("\\(f'\\)")).toBe('f′'); // math prime still applies
  });

  it('keeps hyphens in text content', () => {
    expect(u('$\\textbf{well-known}$')).toBe('𝐰𝐞𝐥𝐥-𝐤𝐧𝐨𝐰𝐧');
    expect(u('$\\text{a - b}$')).toBe('a - b');
    expect(u('$\\mathbf{a-b}$')).toBe('𝐚−𝐛'); // math mode keeps the minus
  });
});

describe('regressions: segmentation', () => {
  it('leaves currency joined by an operator alone', () => {
    expect(u('Total: $100+$200 today.')).toBe('Total: $100+$200 today.');
    expect(u('가격이 $100=$200 이다')).toBe('가격이 $100=$200 이다');
  });

  it('leaves compact currency tables alone', () => {
    expect(u('|$5|$6|')).toBe('|$5|$6|');
  });

  it('applies a plausibility check to $$ bodies', () => {
    expect(u('It costs $$100 now and $$200 later.')).toBe('It costs $$100 now and $$200 later.');
    expect(u('$$a+b$$')).toBe('a + b'.replace(' + ', '+'));
    expect(u('$$ E = mc^2 $$')).toBe('E = mc²');
  });

  it('never lets $$ cross a paragraph break or a code fence', () => {
    expect(u('Stray $$ here.\n\n$$x^2$$')).toBe('Stray $$ here.\n\nx²');
    // Windows line endings and trailing spaces still read as a blank line.
    const crlf = 'Stray $$ here.\r\n\r\n노트: x^2 = y 입니다 $$ 끝';
    expect(u(crlf)).toBe(crlf);
    const padded = 'Stray $$ here.\n   \n노트: x^2 = y 입니다 $$ 끝';
    expect(u(padded)).toBe(padded);
    const fenced = 'Stray $$ here.\n```\nExample: $$E=mc^2$$\n```\nafter';
    expect(u(fenced)).toBe(fenced);
  });

  it('honours escaped \\$ inside $$', () => {
    expect(u('so $$x = \\$$$ done')).toBe('so x = $ done');
  });

  it('protects double-backtick code spans', () => {
    expect(u('use ``$x^2$`` here')).toBe('use ``$x^2$`` here');
    expect(u('run ``a `$x^2$` b`` now')).toBe('run ``a `$x^2$` b`` now');
  });

  it('does not eat a prose asterisk after a bare command', () => {
    expect(u('the \\alpha* note')).toBe('the α* note');
  });

  it('converts a starred operator name found in prose', () => {
    expect(u('we use \\operatorname*{argmax} here')).toBe('we use argmax here');
  });
});

describe('regressions: parsing and rendering', () => {
  it('keeps multiplication asterisks after commands', () => {
    expect(u('$y = \\sigma*x$')).toBe('y = σ*x');
  });

  it('renders \\left. and \\right. as nothing', () => {
    expect(flat('$\\left. \\frac{dy}{dx} \\right|_0$')).toBe('(dy)/(dx) |₀');
    // The dot itself vanishes; authored spacing around it is preserved.
    expect(u('$\\left. x \\right| = y$')).toBe('x | = y');
    expect(u('$\\left.\\frac{1}{2}\\right|$')).toBe('½|');
  });

  it('skips a stray top-level } instead of truncating', () => {
    expect(u('$x^2}y+z$')).toBe('x²y+z');
  });

  it('treats starred line environments like their unstarred forms', () => {
    expect(flat('\\begin{align*} a &= b \\\\ c &= d \\end{align*}')).toBe('a = b\nc = d');
    expect(u('\\begin{equation*} x^2 \\end{equation*}')).toBe('x²');
  });

  it('keeps unknown commands verbatim including their arguments', () => {
    expect(u('$\\overset{a}{=}$')).toBe('\\overset{a}{=}');
    expect(u('$A \\xrightarrow{f} B$')).toBe('A \\xrightarrow{f} B');
    expect(flat('$\\overset{a}{=}$')).toBe('overset(a, =)');
    const { issues } = convert('$\\overset{a}{=}$');
    expect(issues[0].source).toBe('\\overset{a}{=}');
  });

  it('parenthesizes products under radicals and in flattened fractions', () => {
    expect(u('$\\sqrt{(a+b)(c+d)}$')).toBe('√((a+b)(c+d))');
    expect(flat('$\\frac{(a+b)(c+d)}{2}$')).toBe('((a+b)(c+d))/2');
    expect(u('$\\sqrt{f(x)}$')).toBe('√(f(x))');
  });

  it('maps the dotted-equality and eqsim relations correctly', () => {
    expect(u('$a \\risingdotseq b$')).toBe('a ≓ b');
    expect(u('$a \\fallingdotseq b$')).toBe('a ≒ b');
    expect(u('$a \\eqsim b$')).toBe('a ≂ b');
  });

  it('supports \\sfrac like \\frac', () => {
    expect(u('$\\sfrac{1}{2}$')).toBe('½');
    expect(flat('$\\sfrac{a}{b}$')).toBe('a/b');
  });
});

describe('robustness', () => {
  it('does not throw on thousands of nested groups', () => {
    const deep = '\\(' + '{'.repeat(3000) + 'x' + '}'.repeat(3000) + '\\)';
    expect(() => convert(deep)).not.toThrow();
  });

  it('converts deeply nested fractions in linear time', () => {
    let s = 'x+y';
    for (let i = 0; i < 40; i++) s = `\\frac{${s}}{z}`;
    const start = performance.now();
    convert('$' + s + '$');
    expect(performance.now() - start).toBeLessThan(1000);
  });

  it('converts a large mixed document quickly', () => {
    const para =
      '이 절에서는 $x^2 + y^2 = r^2$ 을 사용한다. The value $\\alpha$ satisfies $a_b$, 비용은 $100 이다. ';
    const doc = para.repeat(2000); // ~200k chars
    const start = performance.now();
    const r = convert(doc);
    expect(performance.now() - start).toBeLessThan(2000);
    expect(r.pieces.map((p) => p.text).join('')).toBe(r.text);
  });
});

describe('issue codes', () => {
  // Every IssueCode, pinned to a minimal input that produces it.
  const cases: Array<[string, string]> = [
    ['$\\foobar$', 'unknown-command'],
    ['$\\sum_{k \\in S}$', 'operator-limits'],
    ['$\\foobar^2$', 'script-base'],
    ['$x^q$', 'no-superscript'],
    ['$a_b$', 'no-subscript'],
    ['$\\frac{a+b}{c}$', 'stacked-fraction'],
    ['$\\binom{n}{k}$', 'binomial'],
    ['$\\sqrt[5]{x}$', 'radical-degree'],
    ['$\\sqrt{\\frac{a}{b}}$', 'radicand'],
    ['$\\hat{xy}$', 'accent-base'],
    ['$\\hat{\\frac{a}{b}}$', 'accent-body'],
    ['$\\mathit{123}$', 'style-alphabet'],
    ['$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$', 'env-grid'],
    ['\\begin{align} a &= b \\\\ c &= d \\end{align}', 'env-lines'],
  ];

  it.each(cases)('%s → %s', (src, code) => {
    const { issues } = convert(src);
    expect(issues.map((i) => i.code)).toContain(code);
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

  it('counts only notation regions whose output changed', () => {
    expect(convert('x^q = y', { mode: 'ascii' }).stats.convertedChars).toBe(0);
    expect(convert('=> x in A', { mode: 'ascii' }).stats.convertedChars).toBe(9);
    expect(convert('$x^2$').stats.convertedChars).toBe(5);
  });

  it('never throws on malformed input', () => {
    const bad = ['$', '$$', '\\frac{', '\\begin{align}', '${}^{}_{}$', '\\sqrt[', '$x^$'];
    for (const s of bad) expect(() => convert(s)).not.toThrow();
  });
});
