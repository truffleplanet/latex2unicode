import { describe, expect, it } from 'vitest';
import { segment, looksLikeMath } from '../src/core/segment.js';

const seg = (s: string) => segment(s, { convertBareCommands: true });
const mathBodies = (s: string) => seg(s).filter((x) => x.kind === 'math').map((x) => x.body);

describe('inline $ detection', () => {
  it('finds real inline math', () => {
    expect(mathBodies('let $x^2$ be')).toEqual(['x^2']);
    expect(mathBodies('for all $n$ we have')).toEqual(['n']);
    expect(mathBodies('given $f(x)$ smooth')).toEqual(['f(x)']);
    expect(mathBodies('since $a \\leq b$ holds')).toEqual(['a \\leq b']);
  });

  it('leaves currency alone', () => {
    expect(mathBodies('costs $100 and then $200 total')).toEqual([]);
    expect(mathBodies('가격은 $50, 할인 후 $40 입니다')).toEqual([]);
    expect(mathBodies('from $1,000 up to $2,000')).toEqual([]);
  });

  it('does not span newlines', () => {
    expect(mathBodies('price $5\nand $6 more')).toEqual([]);
  });

  it('rejects padded delimiters', () => {
    expect(looksLikeMath(' x + y')).toBe(false);
    expect(looksLikeMath('x + y ')).toBe(false);
    expect(looksLikeMath('x + y')).toBe(true);
  });
});

describe('display math and environments', () => {
  it('handles $$, \\[ and \\(', () => {
    expect(mathBodies('$$a+b$$')).toEqual(['a+b']);
    expect(mathBodies('\\[a+b\\]')).toEqual(['a+b']);
    expect(mathBodies('\\(a+b\\)')).toEqual(['a+b']);
    expect(seg('$$a$$')[0].display).toBe(true);
    expect(seg('\\(a\\)')[0].display).toBe(false);
  });

  it('keeps the environment wrapper in the body', () => {
    const bodies = mathBodies('see \\begin{align} a &= b \\end{align} above');
    expect(bodies).toEqual(['\\begin{align} a &= b \\end{align}']);
  });

  it('handles nested environments of the same name', () => {
    const src = '\\begin{matrix}\\begin{matrix}a\\end{matrix}\\end{matrix}';
    expect(mathBodies(src)).toEqual([src]);
  });
});

describe('code spans are never math', () => {
  it('skips fenced blocks', () => {
    expect(mathBodies('```\n$x^2$ \\alpha\n```')).toEqual([]);
  });
  it('skips inline code', () => {
    expect(mathBodies('use `$x^2$` here')).toEqual([]);
  });
  it('still converts outside the fence', () => {
    expect(mathBodies('```\n$a$\n```\nbut $b^2$ counts')).toEqual(['b^2']);
  });
});

describe('bare commands in prose', () => {
  it('picks up known commands with their arguments', () => {
    expect(mathBodies('the \\alpha particle')).toEqual(['\\alpha']);
    expect(mathBodies('a \\textbf{bold} word')).toEqual(['\\textbf{bold}']);
    expect(mathBodies('degree \\sqrt[3]{8} root')).toEqual(['\\sqrt[3]{8}']);
  });

  it('ignores unknown backslash sequences', () => {
    expect(mathBodies('path C:\\Users\\home')).toEqual([]);
    expect(mathBodies('regex \\d+ matches')).toEqual([]);
  });

  it('can be switched off', () => {
    const bodies = segment('the \\alpha particle', { convertBareCommands: false })
      .filter((x) => x.kind === 'math');
    expect(bodies).toEqual([]);
  });
});

describe('segments cover the input exactly', () => {
  it('reassembles the source', () => {
    const src = 'a $x^2$ b \\alpha c $$y$$ d `$e$` f';
    expect(seg(src).map((s) => s.raw).join('')).toBe(src);
  });
});
