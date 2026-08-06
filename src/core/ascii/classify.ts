import { WORD_KEYS } from './tokens.js';

/**
 * What a line is, which decides how much of it may be rewritten.
 *
 * `formal` is a line of notation — a step in a derivation — where `->` means
 * an arrow and `and` means conjunction. `prose` is a sentence that happens to
 * mention notation: only unambiguous forms like `f^-1` are touched there,
 * because "users in the system and their roles" is not a formula. `code` is
 * left alone entirely; source is full of `->` and `<=` that mean neither.
 */
export type LineKind = 'formal' | 'prose' | 'code' | 'blank';

/** Identifiers that read as variables rather than words. */
const MATH_VOCAB = new Set([...WORD_KEYS, 'st', 'iff', 'nts', 'qed', 'wlog']);

const CODE_KEYWORD =
  /\b(if|else|for|while|return|const|let|var|def|function|class|import|export|print|int|float|void|public|static)\b/;
/** `ptr->field`, `x=>y`: an arrow glued to identifiers is code, not notation. */
const GLUED_ARROW = /[A-Za-z0-9_)\]](->|=>)[A-Za-z0-9_("[]/;

export function classifyLine(line: string): LineKind {
  const t = line.trim();
  if (t === '') return 'blank';

  // Markdown structure and comments are prose scaffolding, never notation.
  if (/^(\/\/|#|>|\||```|\*\s|-\s|\d+\.\s)/.test(t)) return 'prose';

  if (/^\s{4,}|\t/.test(line)) return 'code';
  if (CODE_KEYWORD.test(t) || GLUED_ARROW.test(t)) return 'code';
  if (/[;{}]\s*$/.test(t)) return 'code';

  // Korean (or any Hangul) means a sentence, whatever else is on the line.
  if (/[가-힣]/.test(t)) return 'prose';

  // A line opening with a relation is a step in a derivation.
  if (/^(<=>|==>|=>|->|<->|<=|>=|=)\s/.test(t)) return 'formal';

  const words = t.split(/[\s,.()[\]{}]+/).filter(Boolean);
  const proseWords = words.filter(
    (w) => /^[A-Za-z]{2,}$/.test(w) && !MATH_VOCAB.has(w.toLowerCase()),
  ).length;
  if (proseWords >= 2) return 'prose';

  const marks = t.match(/<=>|->|=>|<=|>=|!=|[=^_]|\b(forall|exists|in|subset|union)\b/g) ?? [];
  return marks.length >= 2 ? 'formal' : 'prose';
}
