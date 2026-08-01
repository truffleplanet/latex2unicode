# latex2unicode

LaTeX 문법이 섞인 긴 글에서 **LaTeX 부분만** 유니코드로 변환하는 도구입니다.
본문(프로즈)은 그대로 두고, 유니코드로 표현할 수 없는 부분은 정해진 규칙에 따라 폴백 처리 및 이슈 리포트를 반환합니다.

TypeScript 코어 라이브러리와, 이를 그대로 사용하는 정적 웹 UI로 구성됩니다.

```ts
import { toUnicode, convert } from 'latex2unicode';

toUnicode('$\\alpha = 10^{-3}$ 이고 $\\theta \\in \\mathbb{R}^d$ 입니다.');
// => 'α = 10⁻³ 이고 θ ∈ ℝᵈ 입니다.'
```

## 설치 및 빌드

```bash
npm install
npm run dev         # 웹 UI 개발 서버 (vite)
npm run build:site  # 웹 UI 정적 빌드 → site/
npm run build       # 라이브러리 빌드 → dist/index.js, dist/index.d.ts
npm test            # vitest 단위 테스트
```

## 웹 UI

`index.html` + `src/ui/` 의 프레임워크 없는 정적 앱입니다.

- 원문을 붙여 넣거나 파일을 끌어다 놓으면 즉시 변환됩니다. 모든 처리는 브라우저 안에서 끝납니다.
- 결과에서 변환된 부분과 변환하지 못한 부분이 하이라이트됩니다. 변환 불가 구간을 누르면 해당 이슈 카드로 이동합니다.
- 이슈마다 **원본 유지 / 평문으로 풀기**를 따로 선택할 수 있고, 두 선택지의 실제 결과 미리보기가 함께 표시됩니다.
- 결과는 복사하거나 `.txt` 로 저장할 수 있습니다.

## 사용법 (라이브러리)

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
| `src/ui/` | 웹 UI (바닐라 TS, 프레임워크 없음) |

## 설계 원칙

- **본문 보호 우선.** `$100 and $200` 같은 통화 표기, 코드 펜스/인라인 코드,
  문단을 건너뛰는 `$$` 는 수식으로 취급하지 않습니다. 애매하면 건드리지 않는 쪽을 택합니다.
- **전부 아니면 폴백.** 구성 요소 일부만 변환되어 `√{2}` 나 `x̂}` 같은 깨진 출력이
  나오는 일은 없습니다. 변환 불가 구간은 통째로 keep(원본 유지) 또는 flatten(평문)으로
  처리되고, 기계가 읽을 수 있는 이슈 코드와 함께 보고됩니다.
- **이슈 id는 안정적.** 같은 입력에 대해 재변환해도 id가 유지되므로,
  UI에서 항목별 정책 오버라이드가 가능합니다.
- **예외 없음.** 어떤 입력에도 `convert` 는 던지지 않습니다(비정상 중첩 등은 원본 유지로 폴백).

## unicodeit 등 기존 오픈소스와의 관계

[unicodeit](https://github.com/svenkreiss/unicodeit) 는 심볼 사전(약 3,000개 명령어)이 넓지만,
파서 없이 문자열 치환으로 동작해 혼합 문서 처리에는 구조적으로 맞지 않습니다
(구분자 `$` 를 제거하지 않고, `\hat{xy}` → `x̂}` 처럼 깨진 출력을 내며, 이슈 리포트가 없습니다).
이 저장소의 코어는 세그멘테이션·전부-아니면-폴백·이슈 리포트가 목적이므로 자체 구현을 유지하고,
심볼 커버리지만 선별적으로 테이블에 이식합니다.

## 라이선스

MIT License
