# latex2unicode

수식이 섞인 긴 글에서 **수식 부분만** 유니코드로 변환하는 도구입니다.
본문(프로즈)은 그대로 두고, 유니코드로 표현할 수 없는 부분은 정해진 규칙에 따라 폴백 처리 및 이슈 리포트를 반환합니다.

TypeScript 코어 라이브러리와, 이를 그대로 사용하는 정적 웹 UI로 구성됩니다.

```ts
import { toUnicode, convert } from 'latex2unicode';

// LaTeX 모드 (기본값)
toUnicode('$\\alpha = 10^{-3}$ 이고 $\\theta \\in \\mathbb{R}^d$ 입니다.');
// => 'α = 10⁻³ 이고 θ ∈ ℝᵈ 입니다.'

// 일반 텍스트 모드
toUnicode('<=> Exists x in f^-1(B) s.t. y = f(x)', { mode: 'ascii' });
// => '⇔ ∃ x ∈ f⁻¹(B) s.t. y = f(x)'
```

## 두 가지 입력 표기법

| 모드 | 읽는 것 | 예 |
|---|---|---|
| `latex` (기본) | `$…$`, `\(…\)`, `\[…\]`, 수식 환경, 본문 속 `\명령어` | `$\frac{a}{b}$`, `\alpha` |
| `ascii` | LaTeX 없이 타이핑한 평문 수식 | `forall x`, `<=>`, `f^-1`, `x in A` |

모드는 **명시적으로 선택하며 자동 판별하지 않습니다.** 산문을 수식으로 오인하면 조용히 문서가 훼손되기 때문입니다.

일반 텍스트 모드는 줄 단위로 판단합니다. 유도 과정처럼 보이는 줄에서는 `->`가 화살표, `and`가 논리곱이지만,
문장에서는 그렇지 않습니다. 그래서 산문 줄에서는 `f^-1` 같은 명백한 표기만 바꾸고,
코드로 보이는 줄(들여쓰기, 키워드, `ptr->x`)과 코드펜스·인라인 코드는 아예 건드리지 않습니다.

```
<=> Exists x in f^-1(B1) s.t. y = f(x)   →  ⇔ ∃ x ∈ f⁻¹(B1) s.t. y = f(x)
Take any y in f(f^-1(B1)).               →  Take any y in f(f⁻¹(B1)).
배포 순서는 빌드 -> 테스트 -> 릴리스        →  (그대로)
if (a <= b) return ptr->value;           →  (그대로)
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

### GitHub Pages 배포

`main` 브랜치에 변경이 들어오면 `.github/workflows/deploy-pages.yml`이 테스트와 타입 검사를
통과한 뒤 `site/` 빌드 결과만 GitHub Pages에 배포합니다. Actions 탭에서 수동 실행도 가능합니다.

저장소에서 처음 한 번은 **Settings → Pages → Build and deployment → Source**를
**GitHub Actions**로 설정해야 합니다. `site/`는 빌드 산출물이므로 Git에는 커밋하지 않습니다.

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

표기법을 읽는 부분(프론트엔드)만 모드마다 다르고, 그 아래는 전부 공유합니다.

| 모듈 | 역할 |
|---|---|
| **공통** | |
| `src/core/node.ts` | 양쪽 프론트엔드가 만드는 AST. 오프셋은 **원본 문서**를 가리켜야 함 |
| `src/core/frontend.ts` | `Segment`/`Frontend` 계약 |
| `src/core/render.ts` | AST → 유니코드 변환 및 폴백 판정 |
| `src/core/pipeline.ts` | 구간 순회 → 렌더 → 병합 → 통계 |
| `src/core/text/code.ts` | 코드펜스·인라인 코드 건너뛰기 (산문 보호) |
| `src/core/tables/` | 심볼, 상하첨자, 수학 알파벳, 악센트, 분수 맵핑 테이블 |
| **LaTeX 전용** | |
| `src/core/latex/segment.ts` | `$…$`, `$$…$$`, `\(…\)`, `\[…\]`, 수식 환경 및 맨몸 명령어 탐지 |
| `src/core/latex/tokenize.ts` | LaTeX 토크나이저 |
| `src/core/latex/parse.ts` | LaTeX 파서 |
| **일반 텍스트 전용** | |
| `src/core/ascii/classify.ts` | 줄 분류 (formal / prose / code) |
| `src/core/ascii/segment.ts` | 변환 대상 구간 탐지 |
| `src/core/ascii/scan.ts` | 평문 표기 → AST |
| `src/ui/` | 웹 UI (바닐라 TS, 프레임워크 없음) |

새 표기법을 추가하려면 `Frontend` 하나만 구현하면 됩니다. 단, **입력을 재작성해서는 안 됩니다** —
노드 오프셋이 원본을 벗어나면 `keep` 정책이 사용자가 쓴 적 없는 텍스트를 문서에 삽입하게 됩니다.

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
