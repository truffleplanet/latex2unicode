# latex2unicode

글 속의 LaTeX 또는 평문 수식을 읽기 쉬운 유니코드 문자로 바꾸는 도구입니다.
브라우저에서 바로 사용하거나 TypeScript 라이브러리로 호출할 수 있습니다.

## 이런 변환을 할 수 있습니다

### LaTeX가 섞인 글

```text
입력: 이 논문에서 $\alpha \leq \beta$ 이고 $x^2 + H_2O$ 를 사용한다. 가격은 $100이다.
출력: 이 논문에서 α ≤ β 이고 x² + H₂O 를 사용한다. 가격은 $100이다.
```

수식만 변환하고 주변 문장은 그대로 둡니다. `$100` 같은 통화 표기도 수식으로 오인하지 않습니다.

| 입력 | 출력 |
|---|---|
| `$\alpha + \beta$` | `α + β` |
| `$x^{n+1}$` | `xⁿ⁺¹` |
| `$SO_4^{2-}$` | `SO₄²⁻` |
| `$\sqrt{a+b}$` | `√(a+b)` |
| `$\frac{1}{2} + \frac{3}{4}$` | `½ + ¾` |
| `$\theta \in \mathbb{R}^d$` | `θ ∈ ℝᵈ` |
| `$\sum_{i=1}^{n} i$` | `∑ᵢ₌₁ⁿ i` |
| `$\hat{x} + \vec{v}$` | `x̂ + v⃗` |

다음 LaTeX 구분자를 인식합니다.

- `$...$`, `$$...$$`
- `\(...\)`, `\[...\]`
- `equation`, `align`, `matrix`, `cases` 등의 수식 환경
- 본문에 단독으로 적은 `\alpha`, `\textbf{...}` 같은 명령어

### LaTeX 없이 쓴 수학 표기

웹 UI에서 **일반 텍스트** 모드를 선택하거나 API에 `mode: 'ascii'`를 지정하면 됩니다.

```text
입력: <=> Exists x in f^-1(B1) s.t. y = f(x)
출력: ⇔ ∃ x ∈ f⁻¹(B1) s.t. y = f(x)

입력: forall y, y in B -> y in A
출력: ∀ y, y ∈ B → y ∈ A

입력: => x >= y and z != w
출력: ⇒ x ≥ y ∧ z ≠ w
```

일반 문장이나 코드는 함부로 바꾸지 않습니다.

```text
Take any y in f(f^-1(B1)).
→ Take any y in f(f⁻¹(B1)).

배포 순서는 빌드 -> 테스트 -> 릴리스 입니다.
→ 그대로 유지

if (a <= b) return ptr->value;
→ 그대로 유지

인라인 코드와 코드 블록 안의 수식 표기
→ 그대로 유지
```

### 원하는 기호 찾아 쓰기

웹 UI의 원문 도구에서 **기호 넣기**를 누르면 변환할 원문이 없어도 수학 기호를 직접 찾아 쓸 수 있습니다.

- `부분집합`, `subset`, `\subseteq`처럼 한글 이름·영문 이름·표기법으로 검색
- 집합, 논리, 관계, 화살표, 그리스 문자별로 필터링
- 기호를 클릭해 클립보드에 복사
- 현재 모드의 표기법을 원문 커서 위치에 삽입하거나 선택한 범위 교체

LaTeX 모드에서는 `\subseteq`, `\in`처럼 LaTeX 표기만 보여주고 원문에도 그 표기를
넣습니다. 일반 텍스트 모드에서는 `subseteq`, `in`처럼 해당 모드에서 변환 가능한 표기만
보여주고 삽입합니다. 큰 기호 버튼을 누르면 완성된 유니코드 기호를 바로 복사합니다.
현재 모드에 별도 입력 표기가 없는 기호는 **유니코드로 넣기**로 원문에 직접 삽입할 수 있습니다.

## 유니코드로 표현할 수 없는 수식

유니코드는 위아래로 쌓인 일반 분수나 행렬 같은 구조를 모두 표현할 수 없습니다.
이런 수식은 깨진 문자를 만들지 않고 원본을 유지하며, 웹 UI에서 평문으로 풀어 쓸지 선택할 수 있습니다.

| 입력 | 원본 유지 | 평문으로 풀기 |
|---|---|---|
| `$\frac{a+b}{c}$` | `\frac{a+b}{c}` | `(a+b)/c` |
| `$\lim_{x \to 0} f$` | `\lim_{x \to 0} f` | `lim(x → 0) f` |
| `$\binom{n}{k}$` | `\binom{n}{k}` | `C(n, k)` |
| `$\begin{pmatrix}a&b\\c&d\end{pmatrix}$` | 원본 유지 | `(a, b; c, d)` |

웹 UI에서는 변환하지 못한 항목을 따로 표시하고, 항목마다 처리 방법을 고를 수 있습니다.

## 웹 UI

- 텍스트를 붙여 넣거나 `.txt`, `.md`, `.tex` 파일 열기
- LaTeX 모드와 일반 텍스트 모드 선택
- 입력 즉시 변환
- 변환 결과 복사 또는 `.txt` 저장
- 수학 기호 검색·복사·원문 삽입
- 변환하지 못한 수식별 폴백 선택
- 키보드만으로 모든 변환 및 폴백 기능 사용
- 입력 내용은 서버로 보내지 않고 브라우저 안에서 처리

로컬에서 실행하려면:

```bash
npm ci
npm run dev
```

production build를 확인하려면:

```bash
npm run build:site
npm run preview
```

## TypeScript API

### 결과 문자열만 받기

```ts
import { toUnicode } from 'latex2unicode';

toUnicode('학습률은 $\\eta = 10^{-3}$ 이다.');
// '학습률은 η = 10⁻³ 이다.'

toUnicode('<=> Exists x in f^-1(B)', { mode: 'ascii' });
// '⇔ ∃ x ∈ f⁻¹(B)'

toUnicode('$\\frac{a+b}{c}$', { defaultPolicy: 'flatten' });
// '(a+b)/c'
```

### 변환 결과와 이슈 함께 받기

```ts
import { convert } from 'latex2unicode';

const result = convert('값은 $x^2$ 이고 분수는 $\\frac{a+b}{c}$ 이다.');

result.text;
// '값은 x² 이고 분수는 \frac{a+b}{c} 이다.'

result.issues;
// 유니코드로 표현하지 못한 수식, 위치, 이유, 폴백 미리보기

result.stats;
// 변환한 구간과 이슈 개수
```

주요 옵션:

| 옵션 | 기본값 | 설명 |
|---|---:|---|
| `mode` | `'latex'` | `'latex'` 또는 `'ascii'` 입력 모드 |
| `defaultPolicy` | `'keep'` | 변환 불가 수식을 `'keep'` 또는 `'flatten'`으로 처리 |
| `convertBareCommands` | `true` | `$...$` 밖의 LaTeX 명령어 변환 |
| `prettyMinus` | `true` | 수식의 `-`를 유니코드 마이너스 `−`로 변환 |
| `textLigatures` | `false` | 본문의 TeX 대시·따옴표 관용 표기 변환 |

## 테스트

```bash
npm test                         # 코어 단위 테스트
npm run typecheck                # TypeScript 검사
npx playwright install chromium # E2E 브라우저 최초 설치
npm run test:e2e                 # production UI 및 axe 접근성 검사
```

`main` 브랜치 배포 전에도 같은 단위 테스트, 타입 검사, Playwright E2E와 접근성 검사를 실행합니다.

## 라이선스

MIT
