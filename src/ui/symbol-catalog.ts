export type SymbolCategory = 'sets' | 'logic' | 'relations' | 'arrows' | 'greek';
export type SymbolNotationMode = 'latex' | 'ascii';

export interface SymbolEntry {
  symbol: string;
  name: string;
  category: SymbolCategory;
  latex: string;
  ascii?: string;
  aliases: readonly string[];
}

export const SYMBOL_CATEGORIES: ReadonlyArray<readonly [SymbolCategory, string]> = [
  ['sets', '집합'],
  ['logic', '논리'],
  ['relations', '관계'],
  ['arrows', '화살표'],
  ['greek', '그리스 문자'],
];

export const SYMBOL_CATALOG: readonly SymbolEntry[] = [
  { symbol: '∈', name: '원소', category: 'sets', latex: '\\in', ascii: 'in', aliases: ['element', 'belongs'] },
  { symbol: '∉', name: '원소가 아님', category: 'sets', latex: '\\notin', ascii: 'notin', aliases: ['not element'] },
  { symbol: '∋', name: '원소를 포함', category: 'sets', latex: '\\ni', aliases: ['owns', 'contains'] },
  { symbol: '⊂', name: '진부분집합', category: 'sets', latex: '\\subset', ascii: 'subset', aliases: ['proper subset'] },
  { symbol: '⊆', name: '부분집합', category: 'sets', latex: '\\subseteq', ascii: 'subseteq', aliases: ['subset'] },
  { symbol: '⊃', name: '진상위집합', category: 'sets', latex: '\\supset', ascii: 'supset', aliases: ['proper superset'] },
  { symbol: '⊇', name: '상위집합', category: 'sets', latex: '\\supseteq', ascii: 'supseteq', aliases: ['superset'] },
  { symbol: '∪', name: '합집합', category: 'sets', latex: '\\cup', ascii: 'union', aliases: ['cup'] },
  { symbol: '∩', name: '교집합', category: 'sets', latex: '\\cap', ascii: 'intersect', aliases: ['intersection', 'cap'] },
  { symbol: '∖', name: '차집합', category: 'sets', latex: '\\setminus', ascii: 'setminus', aliases: ['difference'] },
  { symbol: '∅', name: '공집합', category: 'sets', latex: '\\emptyset', ascii: 'emptyset', aliases: ['empty set'] },
  { symbol: '∀', name: '모든', category: 'logic', latex: '\\forall', ascii: 'forall', aliases: ['for all', '전칭'] },
  { symbol: '∃', name: '존재', category: 'logic', latex: '\\exists', ascii: 'exists', aliases: ['there exists', '존재한다'] },
  { symbol: '¬', name: '부정', category: 'logic', latex: '\\neg', ascii: 'not', aliases: ['not'] },
  { symbol: '∧', name: '논리곱', category: 'logic', latex: '\\land', ascii: 'and', aliases: ['and', '그리고'] },
  { symbol: '∨', name: '논리합', category: 'logic', latex: '\\lor', ascii: 'or', aliases: ['or', '또는'] },
  { symbol: '⊤', name: '참', category: 'logic', latex: '\\top', aliases: ['true'] },
  { symbol: '⊥', name: '거짓', category: 'logic', latex: '\\bot', aliases: ['false', 'bottom'] },
  { symbol: '≠', name: '같지 않음', category: 'relations', latex: '\\neq', ascii: '!=', aliases: ['not equal'] },
  { symbol: '≤', name: '작거나 같음', category: 'relations', latex: '\\leq', ascii: '<=', aliases: ['less equal'] },
  { symbol: '≥', name: '크거나 같음', category: 'relations', latex: '\\geq', ascii: '>=', aliases: ['greater equal'] },
  { symbol: '≈', name: '근사', category: 'relations', latex: '\\approx', ascii: 'approx', aliases: ['approximately'] },
  { symbol: '≡', name: '동치', category: 'relations', latex: '\\equiv', ascii: 'equiv', aliases: ['identical', 'congruent'] },
  { symbol: '∝', name: '비례', category: 'relations', latex: '\\propto', aliases: ['proportional'] },
  { symbol: '⟂', name: '수직', category: 'relations', latex: '\\perp', ascii: 'perp', aliases: ['perpendicular'] },
  { symbol: '→', name: '오른쪽 화살표', category: 'arrows', latex: '\\to', ascii: '->', aliases: ['right arrow'] },
  { symbol: '←', name: '왼쪽 화살표', category: 'arrows', latex: '\\leftarrow', ascii: '<-', aliases: ['left arrow'] },
  { symbol: '↔', name: '양방향 화살표', category: 'arrows', latex: '\\leftrightarrow', ascii: '<->', aliases: ['both arrow'] },
  { symbol: '⇒', name: '함의', category: 'arrows', latex: '\\Rightarrow', ascii: '=>', aliases: ['implies'] },
  { symbol: '⇔', name: '필요충분조건', category: 'arrows', latex: '\\Leftrightarrow', ascii: '<=>', aliases: ['iff', 'if and only if'] },
  { symbol: '↦', name: '대응', category: 'arrows', latex: '\\mapsto', ascii: '|->', aliases: ['maps to'] },
  { symbol: 'α', name: '알파', category: 'greek', latex: '\\alpha', aliases: ['alpha'] },
  { symbol: 'β', name: '베타', category: 'greek', latex: '\\beta', aliases: ['beta'] },
  { symbol: 'γ', name: '감마', category: 'greek', latex: '\\gamma', aliases: ['gamma'] },
  { symbol: 'δ', name: '델타', category: 'greek', latex: '\\delta', aliases: ['delta'] },
  { symbol: 'ε', name: '엡실론', category: 'greek', latex: '\\epsilon', aliases: ['epsilon'] },
  { symbol: 'θ', name: '세타', category: 'greek', latex: '\\theta', aliases: ['theta'] },
  { symbol: 'λ', name: '람다', category: 'greek', latex: '\\lambda', aliases: ['lambda'] },
  { symbol: 'μ', name: '뮤', category: 'greek', latex: '\\mu', aliases: ['mu'] },
  { symbol: 'π', name: '파이', category: 'greek', latex: '\\pi', aliases: ['pi'] },
  { symbol: 'σ', name: '시그마', category: 'greek', latex: '\\sigma', aliases: ['sigma'] },
  { symbol: 'φ', name: '파이(피)', category: 'greek', latex: '\\phi', aliases: ['phi'] },
  { symbol: 'ω', name: '오메가', category: 'greek', latex: '\\omega', aliases: ['omega'] },
];

export function notationFor(
  entry: SymbolEntry,
  mode: SymbolNotationMode,
): string | undefined {
  return mode === 'latex' ? entry.latex : entry.ascii;
}

export function filterSymbols(
  query: string,
  category: SymbolCategory | 'all' = 'all',
  mode?: SymbolNotationMode,
): readonly SymbolEntry[] {
  const needle = query.trim().toLocaleLowerCase('ko-KR');
  return SYMBOL_CATALOG.filter((entry) => {
    if (category !== 'all' && entry.category !== category) return false;
    if (needle === '') return true;
    const notation = mode ? [notationFor(entry, mode) ?? ''] : [entry.latex, entry.ascii ?? ''];
    return [entry.symbol, entry.name, ...notation, ...entry.aliases]
      .join(' ')
      .toLocaleLowerCase('ko-KR')
      .includes(needle);
  });
}
