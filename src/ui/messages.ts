import type { Issue } from '../core/types.js';

/**
 * 이슈 코드를 사용자에게 보여줄 한국어 문구로 바꾼다.
 * 코어는 언어 중립이므로 표현은 전부 여기에서 결정한다.
 */
export function issueTitle(issue: Issue): string {
  const d = issue.detail;
  switch (issue.code) {
    case 'unknown-command':
      return `알 수 없는 명령어 ${d}`;
    case 'operator-limits':
      return `${d} 의 위·아래 범위 표기`;
    case 'script-base':
      return '첨자가 붙은 대상을 변환할 수 없음';
    case 'no-superscript':
      return `“${d}” 의 유니코드 위 첨자가 없음`;
    case 'no-subscript':
      return `“${d}” 의 유니코드 아래 첨자가 없음`;
    case 'stacked-fraction':
      return '세로로 쌓인 분수';
    case 'binomial':
      return '이항계수';
    case 'radical-degree':
      return `${d}제곱근 기호가 유니코드에 없음`;
    case 'radicand':
      return '근호 안의 식을 변환할 수 없음';
    case 'accent-base':
      return `악센트가 여러 글자(“${d}”)에 걸쳐 있음`;
    case 'accent-body':
      return '악센트 아래의 식을 변환할 수 없음';
    case 'style-alphabet':
      return `“${d}” 에 해당하는 스타일 문자가 없음`;
    case 'env-grid':
      return `${d} 격자(행렬) 배치`;
    case 'env-lines':
      return `${d}줄 정렬 수식`;
  }
}

export function issueExplanation(issue: Issue): string {
  switch (issue.code) {
    case 'unknown-command':
      return '변환기가 모르는 명령어입니다. 원본을 유지하거나 명령어 이름만 남길 수 있습니다.';
    case 'operator-limits':
      return '기호 위아래에 붙는 범위는 한 줄짜리 텍스트로 표현할 수 없습니다.';
    case 'script-base':
      return '첨자 자체보다, 첨자가 붙는 본체가 유니코드로 변환되지 않습니다.';
    case 'no-superscript':
    case 'no-subscript':
      return '유니코드 위·아래 첨자 문자는 일부 글자만 존재합니다.';
    case 'stacked-fraction':
      return '½ 같은 몇몇 분수만 한 글자로 존재합니다. 그 외에는 a/b 꼴로 풀 수 있습니다.';
    case 'binomial':
      return '이항계수는 위아래 2단 배치라서 C(n, k) 꼴로만 풀 수 있습니다.';
    case 'radical-degree':
      return '유니코드 근호 기호는 제곱근(√)·세제곱근(∛)·네제곱근(∜)뿐입니다.';
    case 'radicand':
      return '근호 기호는 있지만 그 안의 식이 유니코드로 변환되지 않습니다.';
    case 'accent-base':
      return '유니코드 결합 문자는 바로 앞 한 글자에만 붙습니다.';
    case 'accent-body':
      return '악센트를 붙일 대상이 유니코드로 변환되지 않습니다.';
    case 'style-alphabet':
      return '수학용 볼드·필기체 등은 라틴 문자와 숫자에만 존재합니다.';
    case 'env-grid':
      return '행렬·격자는 2차원 배치라서 (a, b; c, d) 꼴로만 풀 수 있습니다.';
    case 'env-lines':
      return '여러 줄 정렬은 유지되지 않고, 줄바꿈으로만 풀 수 있습니다.';
  }
}
