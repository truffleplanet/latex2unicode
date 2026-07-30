import type { Issue, IssueCode } from './core/types.js';

/**
 * Korean presentation for each failure cause.
 *
 * The core emits a stable `code` plus a `detail`; wording lives here so the
 * converter stays language-neutral and reusable.
 */
const MESSAGES: Record<IssueCode, (detail: string) => string> = {
  'no-superscript': (d) => `유니코드에 ${quote(d)}의 위첨자 글자가 없습니다`,
  'no-subscript': (d) => `유니코드에 ${quote(d)}의 아래첨자 글자가 없습니다`,
  'script-base': (d) => `첨자가 붙은 ${quote(d)}를 먼저 변환할 수 없습니다`,
  'operator-limits': (d) => `${d}의 위·아래 범위는 한 줄에 놓을 수 없습니다`,
  'stacked-fraction': () => '위아래로 쌓인 분수에 해당하는 유니코드 글자가 없습니다',
  binomial: () => '이항계수는 2차원 배치라 한 줄로 표현할 수 없습니다',
  'radical-degree': (d) => `유니코드 근호는 2·3·4제곱근까지만 있습니다 (요청: ${d}제곱근)`,
  radicand: (d) => `근호 안의 ${quote(d)}를 변환할 수 없습니다`,
  'accent-base': (d) => `결합 악센트는 한 글자에만 붙습니다 (${quote(d)}는 여러 글자)`,
  'accent-body': (d) => `악센트를 붙일 ${quote(d)}를 변환할 수 없습니다`,
  'style-alphabet': (d) => `해당 서체에 ${quote(d)}에 대응하는 유니코드 글자가 없습니다`,
  'unknown-command': (d) => `${d} 명령어를 알지 못합니다`,
  'env-grid': (d) => `${d} 격자 배치는 한 줄짜리 텍스트로 표현할 수 없습니다`,
  'env-lines': (d) => `${d}줄로 정렬된 수식은 한 줄짜리 텍스트로 표현할 수 없습니다`,
};

function quote(s: string): string {
  const trimmed = s.length > 24 ? `${s.slice(0, 24)}…` : s;
  return `‘${trimmed}’`;
}

/** Korean explanation for an issue, falling back to the core's English text. */
export function describe(issue: Issue): string {
  return MESSAGES[issue.code]?.(issue.detail) ?? issue.reason;
}
