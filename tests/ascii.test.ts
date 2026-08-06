import { describe, expect, it } from 'vitest';
import { convert, toUnicode } from '../src/core/convert.js';
import { classifyLine } from '../src/core/ascii/classify.js';

const a = (s: string) => toUnicode(s, { mode: 'ascii' });

describe('formal notation lines', () => {
  it('converts a line of a derivation', () => {
    expect(a('<=> Exists x in f^-1(B1) s.t. y = f(x)')).toBe('⇔ ∃ x ∈ f⁻¹(B1) s.t. y = f(x)');
    expect(a('forall y, y in B -> y in A')).toBe('∀ y, y ∈ B → y ∈ A');
    expect(a('<=> a in S and b notin S')).toBe('⇔ a ∈ S ∧ b ∉ S');
  });

  it('reads the ascii relations', () => {
    expect(a('=> x <= y')).toBe('⇒ x ≤ y');
    expect(a('=> x >= y and z != w')).toBe('⇒ x ≥ y ∧ z ≠ w');
    expect(a('<-> p iff q')).toBe('↔ p ⇔ q');
  });

  it('reads exponents in every spelling', () => {
    expect(a('=> f^-1 and g^(-1) and x^2 and y^(n+1)')).toBe('⇒ f⁻¹ ∧ g⁻¹ ∧ x² ∧ yⁿ⁺¹');
  });

  it('keeps indentation', () => {
    expect(a('  <=> y in B')).toBe('  ⇔ y ∈ B');
  });

  it('leaves inline code inside a derivation alone', () => {
    expect(a('=> x in A and `f^-1`')).toBe('⇒ x ∈ A ∧ `f^-1`');
    expect(a('=> `x in A` and y in B')).toBe('⇒ `x in A` ∧ y ∈ B');
  });
});

describe('prose lines keep their words', () => {
  it('converts only the exponent', () => {
    expect(a('Take any y in f(f^-1(B1)).')).toBe('Take any y in f(f⁻¹(B1)).');
    expect(a('There exists x in f^-1(B) such that y = f(x).')).toBe(
      'There exists x in f⁻¹(B) such that y = f(x).',
    );
  });

  it('leaves ordinary English alone', () => {
    for (const line of [
      'The set of users in the system and their roles are cached.',
      'This is not a bug; it is expected behavior.',
      'Choose A or B, but not both.',
      'Rollback -> redeploy -> verify.',
      'The migration runs in under 5 minutes.',
    ]) {
      expect(a(line)).toBe(line);
    }
  });

  it('leaves Korean prose alone', () => {
    for (const line of [
      '이 논문에서 partition을 다루고, 각 원소는 서로소이다.',
      '배포 순서는 빌드 -> 테스트 -> 릴리스 입니다.',
      '릴리스 기준: 오류율 <= 0.1% 이면 통과.',
      'a~b if and only if there is an element C of P such that a,b are elements of C.',
    ]) {
      expect(a(line)).toBe(line);
    }
  });

  it('never turns a tilde into a space', () => {
    // `~` is the conventional symbol for an equivalence relation here.
    expect(a('1.~이 X의 동치관계라고 하자.')).toBe('1.~이 X의 동치관계라고 하자.');
    expect(a('X위의 relation ~을 정의하자.')).toBe('X위의 relation ~을 정의하자.');
  });
});

describe('code is never notation', () => {
  it('leaves source lines alone', () => {
    for (const line of [
      'for (int i = 0; i <= n; i++) sum += a[i];',
      'if (a != b && c >= d) return ptr->value;',
      'const double = arr.map(x => x * 2);',
      'const MAX = 2^32 - 1;',
      'df = df[df.col >= 10]',
      '    <=> four spaces is a markdown code block',
      '\tx^2 = y',
    ]) {
      expect(a(line)).toBe(line);
    }
  });

  it('leaves fenced blocks and inline code alone', () => {
    const fenced = '```\nforall x, x in A -> x^2\n```';
    expect(a(fenced)).toBe(fenced);
    expect(a('use `f^-1` for the inverse')).toBe('use `f^-1` for the inverse');
  });

  it('still converts after a closed fence', () => {
    expect(a('```\nx^2\n```\n=> y in B')).toBe('```\nx^2\n```\n⇒ y ∈ B');
  });
});

describe('markdown and lists stay prose', () => {
  it('leaves structural lines alone', () => {
    for (const line of ['| 입력 -> 출력 | 비고 |', '- 다음 단계: 배포 -> 검증', '# forall x in A']) {
      expect(a(line)).toBe(line);
    }
  });
});

describe('mode isolation', () => {
  it('does not read latex in ascii mode', () => {
    expect(a('$\\alpha$')).toBe('$\\alpha$');
  });

  it('does not read ascii notation in latex mode', () => {
    const src = '<=> Exists x in B';
    expect(toUnicode(src)).toBe(src);
    expect(toUnicode(src, { mode: 'latex' })).toBe(src);
  });

  it('defaults to latex', () => {
    expect(toUnicode('$x^2$')).toBe('x²');
  });
});

describe('the shared machinery still applies', () => {
  it('reports issues with the author-written source, not a rewrite', () => {
    const { issues, text } = convert('=> x^q and a_b', { mode: 'ascii' });
    expect(issues.map((i) => i.code)).toEqual(['no-superscript', 'no-subscript']);
    // keep policy must echo exactly what was typed
    expect(issues[0].keepPreview).toBe('x^q');
    expect(issues[1].keepPreview).toBe('a_b');
    expect(text).toBe('⇒ x^q ∧ a_b');
  });

  it('names commands without a backslash', () => {
    const { issues } = convert('=> x^q', { mode: 'ascii' });
    expect(issues[0].reason).not.toContain('\\');
  });

  it('honours the flatten policy and per-issue overrides', () => {
    // Plain-text input often already is its own flattened form, so the two
    // policies coincide; `infty^Q` is a case where they differ.
    const src = '=> infty^Q and x^q';
    const first = convert(src, { mode: 'ascii' });
    expect(first.issues).toHaveLength(2);
    expect(first.text).toBe('⇒ infty^Q ∧ x^q');
    expect(toUnicode(src, { mode: 'ascii', defaultPolicy: 'flatten' })).toBe('⇒ ∞^Q ∧ x^q');
    const after = convert(src, { mode: 'ascii', overrides: { [first.issues[0].id]: 'flatten' } });
    expect(after.text).toBe('⇒ ∞^Q ∧ x^q');
  });

  it('keeps the pieces/text invariant', () => {
    for (const src of ['=> x in B', 'plain prose', 'f^-1 in a sentence.', '```\nx^2\n```']) {
      const r = convert(src, { mode: 'ascii' });
      expect(r.pieces.map((p) => p.text).join('')).toBe(r.text);
    }
  });
});

describe('line classification', () => {
  it('separates a derivation from its narration', () => {
    expect(classifyLine('<=> Exists x in f^-1(B1) s.t. y = f(x)')).toBe('formal');
    expect(classifyLine('N.T.S. forall y, y in f(B) -> y in B.')).toBe('formal');
    expect(classifyLine('Take any y in f(f^-1(B1)).')).toBe('prose');
    expect(classifyLine('We need to show that y is in B1.')).toBe('prose');
    expect(classifyLine('const MAX = 2^32 - 1;')).toBe('code');
    expect(classifyLine('')).toBe('blank');
  });
});
