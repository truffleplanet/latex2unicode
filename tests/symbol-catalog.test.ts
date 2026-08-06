import { describe, expect, it } from 'vitest';
import { filterSymbols, notationFor } from '../src/ui/symbol-catalog.js';

describe('symbol catalog search', () => {
  it('finds a symbol by Korean name, ASCII notation, and LaTeX notation', () => {
    expect(filterSymbols('부분집합').map((entry) => entry.symbol)).toEqual(['⊂', '⊆']);
    expect(filterSymbols('notin').map((entry) => entry.symbol)).toEqual(['∉']);
    expect(filterSymbols('\\subseteq').map((entry) => entry.symbol)).toEqual(['⊆']);
  });

  it('filters results by category', () => {
    expect(filterSymbols('', 'logic').every((entry) => entry.category === 'logic')).toBe(true);
    expect(filterSymbols('alpha', 'sets')).toEqual([]);
  });

  it('ignores surrounding whitespace and letter case', () => {
    expect(filterSymbols('  ALPHA  ').map((entry) => entry.symbol)).toEqual(['α']);
  });

  it('returns only the notation used by the selected mode', () => {
    const subseteq = filterSymbols('부분집합').find((entry) => entry.symbol === '⊆');
    expect(subseteq).toBeDefined();
    expect(notationFor(subseteq!, 'latex')).toBe('\\subseteq');
    expect(notationFor(subseteq!, 'ascii')).toBe('subseteq');
    expect(filterSymbols('\\subseteq', 'all', 'ascii')).toEqual([]);
  });
});
