/**
 * Plain-text mathematical notation — the shorthand people type in chat and
 * email when they have no LaTeX. Every entry maps to a key in the shared
 * symbol table, so the renderer and its fallback rules are untouched.
 */

/** Multi-character operators, longest first so `<=>` wins over `<=`. */
export const OPERATORS: ReadonlyArray<readonly [string, string]> = [
  ['<=>', 'Leftrightarrow'],
  ['<->', 'leftrightarrow'],
  ['|->', 'mapsto'],
  ['==>', 'Longrightarrow'],
  ['=>', 'Rightarrow'],
  ['->', 'to'],
  ['<-', 'gets'],
  ['<=', 'leq'],
  ['>=', 'geq'],
  ['!=', 'neq'],
  ['/=', 'neq'],
  ['~=', 'approx'],
];

/**
 * Words that are operators rather than prose. Only consulted on lines the
 * classifier judged to be formal notation — `and`, `or` and `in` are ordinary
 * English everywhere else.
 */
export const WORDS: Readonly<Record<string, string>> = {
  forall: 'forall',
  exists: 'exists',
  in: 'in',
  notin: 'notin',
  subset: 'subset',
  subseteq: 'subseteq',
  supset: 'supset',
  supseteq: 'supseteq',
  union: 'cup',
  cup: 'cup',
  intersect: 'cap',
  cap: 'cap',
  and: 'land',
  or: 'lor',
  not: 'lnot',
  iff: 'Leftrightarrow',
  implies: 'Rightarrow',
  emptyset: 'emptyset',
  empty: 'emptyset',
  infty: 'infty',
  infinity: 'infty',
  setminus: 'setminus',
  times: 'times',
  leq: 'leq',
  geq: 'geq',
  neq: 'neq',
  approx: 'approx',
  equiv: 'equiv',
  perp: 'perp',
};

/** Every word the notation treats as an operator, for the classifier. */
export const WORD_KEYS: ReadonlySet<string> = new Set(Object.keys(WORDS));
