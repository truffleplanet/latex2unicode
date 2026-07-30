# latex2unicode

LaTeX 문법이 섞인 긴 글에서 **LaTeX 부분만** 유니코드로 변환하는 TypeScript/JavaScript 코어 라이브러리입니다.
본문(프로즈)은 그대로 두고, 유니코드로 표현할 수 없는 부분은 정해진 규칙에 따라 폴백 처리 및 이슈 리포트를 반환합니다.

```ts
import { toUnicode, convert } from 'latex2unicode';

toUnicode('$\alpha = 10^{-3}$ 이고 $\theta \in \mathbb{R}^d$ 입니다.');
// => 'α = 10⁻³ 이고 θ ∈ ℝᵈ 입니다.'
```

## 설치 및 빌드

```bash
npm install
npm run build   # dist/index.js 및 dist/index.d.ts 생성
npm test        # vitest 단위 테스트 실행 (53 tests)
```

## 사용법

### 1. 간단 변환 (`toUnicode`)

```ts
import { toUnicode } from 'latex2unicode';

const result = toUnicode('$x^2 + \\alpha$');
// => 'x² + α'

// 폴백 정책 지정 (flatten: 유니코드 비대응 수식을 평문으로 펼침)
const flattened = toUnicode('$\\frac{a}{b}$', { defaultPolicy: 'flatten' });
// => 'a/b'
```

### 2. 상세 변환 및 리포트 수집 (`convert`)

```ts
import { convert } from 'latex2unicode';

const { text, pieces, issues, stats } = convert(doc, {
  defaultPolicy: 'keep',
  convertBareCommands: true,
  prettyMinus: true,
  textLigatures: false,
});

// 특정 이슈 항목에 대해 개별 정책 재설정
if (issues.length > 0) {
  const updated = convert(doc, {
    overrides: {
      [issues[0].id]: 'flatten',
    },
  });
}
```

## 핵심 파이프라인

```
원문 텍스트
  │
  ├─ ① Segmenter   본문 vs LaTeX 구간 분리 (본문 보존)
  ├─ ② Converter   LaTeX 구간 토크나이즈 → AST → 유니코드 렌더
  └─ ③ Fallback    렌더 불가 노드에 정책(keep / flatten) 적용 + 이슈 리포트 생성
  │
결과 텍스트 + 변환 결과 객체
```

| 모듈 | 역할 |
|---|---|
| `src/core/segment.ts` | `$…$`, `$$…$$`, `\(…\)`, `\[…\]`, 수식 환경 및 맨몸 명령어 탐지 |
| `src/core/tokenize.ts` | LaTeX 토크나이저 |
| `src/core/parse.ts` | 미니 AST (스크립트, 분수, 근호, 악센트, 폰트, 환경 등) |
| `src/core/render.ts` | AST → 유니코드 변환 및 폴백 판정 |
| `src/core/convert.ts` | 파이프라인 통합 조립 및 결과/통계 생성 |
| `src/core/tables/` | 심볼, 상하첨자, 수학 알파벳, 악센트, 분수 맵핑 테이블 |

## 라이선스

MIT License
