# latex2unicode

LaTeX 문법이 섞인 긴 글에서 **LaTeX 부분만** 유니코드로 변환하는 정적 웹 도구입니다.
본문(프로즈)은 그대로 두고, 유니코드로 표현할 수 없는 부분은 정해진 규칙에 따라 처리한 뒤 리포트로 보여줍니다.

브라우저 안에서만 동작하며 입력한 글은 서버로 전송되지 않습니다.

```
$\alpha = 10^{-3}$ 이고 $\theta \in \mathbb{R}^d$ 입니다.
  ↓
α = 10⁻³ 이고 θ ∈ ℝᵈ 입니다.
```

## 왜 3단 파이프라인인가

LaTeX → 유니코드는 **손실 변환**입니다. 어려운 부분은 변환기가 아니라 (1) 본문에서 LaTeX 구간만 골라내는 일과 (2) 변환 불가 영역을 어떻게 처리할지 결정하는 일입니다.

```
원문 텍스트
  │
  ├─ ① Segmenter   본문 vs LaTeX 구간 분리 (본문은 절대 건드리지 않음)
  ├─ ② Converter   LaTeX 구간만 토크나이즈 → AST → 유니코드 렌더
  └─ ③ Fallback    렌더 불가 노드에 정책 적용 + 리포트 수집
  │
결과 텍스트 + 변환 리포트
```

| 파일 | 역할 |
|---|---|
| `src/core/segment.ts` | `$…$`, `$$…$$`, `\(…\)`, `\[…\]`, 수식 환경, 맨몸 `\명령어` 탐지 |
| `src/core/tokenize.ts` | LaTeX 토크나이저 |
| `src/core/parse.ts` | 미니 AST (스크립트, 분수, 근호, 악센트, 폰트, 환경) |
| `src/core/render.ts` | AST → 유니코드, 그리고 폴백 판정 |
| `src/core/convert.ts` | 파이프라인 조립, 리포트 생성 |
| `src/core/tables/` | 심볼 · 상하첨자 · 수학 알파벳 · 악센트 · 분수 표 |

## ① 무엇을 LaTeX로 볼 것인가

`$`는 통화 기호와 충돌합니다. 이 도구는 **오탐(본문 훼손)보다 미탐(그냥 놔둠)을 선호**합니다.

```
전체 비용은 $1,200 이었고 GPU 시간은 $48 였다.   →  그대로 유지
학습률 $\alpha$ 를 사용했다.                      →  변환
```

`$…$`가 수식으로 인정되는 조건:

- 같은 줄 안에서 닫히고, 여는/닫는 `$` 바로 안쪽에 공백이 없음
- 내부에 `\ ^ _` 또는 관계·연산 기호가 있음, 또는 `x` · `n` · `f(x)` · `3` 같은 짧은 수식 형태
- 백틱 코드 스팬과 ``` 코드 블록 안은 항상 본문으로 취급
- 맨몸 `\명령어`는 **아는 명령어일 때만** 변환 (`C:\Users\home`, `\d+` 같은 건 건드리지 않음)

## ② 변환 계층

| 계층 | 예 |
|---|---|
| 심볼 (456개) | `\alpha`→α, `\leq`→≤, `\to`→→, `\partial`→∂ |
| 수학 알파벳 | `\mathbb{R}`→ℝ, `\mathbf{A}`→𝐀, `\mathcal{L}`→ℒ, `\mathfrak{g}`→𝔤 |
| 상·하첨자 | `x^2`→x², `H_2O`→H₂O, `x^{n+1}`→xⁿ⁺¹, `B_{\text{max}}`→Bₘₐₓ |
| 결합 악센트 (24개) | `\hat{x}`→x̂, `\bar{a}`→ā, `\vec{v}`→v⃗ |
| 분수·근호 | `\frac{1}{2}`→½, `\sqrt{x}`→√x, `\sqrt[3]{27}`→∛27 |
| 명명 함수 | `\sin x`→sin x, `\det A`→det A |
| 이스케이프 | `92\%`→92% |

### 공백 처리

TeX는 공백을 버리고 연산자 클래스에서 간격을 다시 계산하지만, 평문은 그럴 수 없습니다.
그래서 **저자가 쓴 공백을 보존**하고 다음만 정규화합니다.

```
$\alpha + \beta$      →  α + β        (쓴 대로)
$\left( a \right)$    →  (a)          (구분자에 붙은 공백 제거)
$$ a + b $$           →  a + b        (구간 양끝 트림)
```

## ③ 변환 불가 영역 — 폴백 규칙

유니코드의 한계는 실재합니다. 상첨자에는 `q`가 없고, **하첨자에는 `b c d f g q w y z`가 아예 없습니다.**
2단 이상 중첩 첨자, 쌓인 분수, 행렬, 큰 연산자의 위아래 극한도 선형 텍스트로 표현할 수 없습니다.

기본 정책은 `keep`(원본 유지, 정보 손실 0)이고, 리포트에서 항목별로 `flatten`을 선택할 수 있습니다.

| 원본 | `keep` | `flatten` |
|---|---|---|
| `\frac{a+b}{c}` | `\frac{a+b}{c}` | `(a+b)/c` |
| `\sum_{i=1}^{n}` | `\sum_{i=1}^{n}` | `∑(i=1→n)` |
| `\lim_{t \to \infty}` | `\lim_{t \to \infty}` | `lim(t → ∞)` |
| `a_b` | `a_b` | `a_b` |
| `\hat{xy}` | `\hat{xy}` | `hat(xy)` |
| `\binom{n}{k}` | `\binom{n}{k}` | `C(n, k)` |
| `\begin{pmatrix}a&b\\c&d\end{pmatrix}` | (원본) | `(a, b; c, d)` |
| `\begin{bmatrix}…\end{bmatrix}` | (원본) | `[a, b; c, d]` |
| `\begin{cases}…\end{cases}` | (원본) | `{a, 조건; b, 조건}` |
| `\begin{align}…\end{align}` | (원본) | 줄바꿈으로 분리된 여러 줄 |

변환 리포트에는 항목마다 **줄 번호 · 원본 · 실패 이유 · 펼친 결과 미리보기**가 표시되고,
결과 창의 해당 부분을 클릭하면 리포트 항목으로 이동합니다.

```
L4  \sum_{i=1}^{N}
    limits on ∑ cannot be placed above and below inline
    펼치면 → ∑(i=1→N)                      [원본 유지] [펼치기]
```

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm test         # vitest (53 tests)
npm run build    # 타입체크 + 프로덕션 빌드
```

프로그램적으로 쓸 때:

```ts
import { convert, toUnicode } from './src/core/convert.js';

toUnicode('$x^2 + \\alpha$');                          // 'x² + α'
toUnicode('$\\frac{a}{b}$', { defaultPolicy: 'flatten' }); // 'a/b'

const { text, issues } = convert(doc);
// issues[i].id 를 overrides 에 넣으면 그 항목만 정책을 바꿀 수 있습니다.
convert(doc, { overrides: { [issues[0].id]: 'flatten' } });
```

`issue.id`는 같은 입력에 대해 안정적이므로, 항목별 선택이 재변환 후에도 유지됩니다.

## 배포

`main`에 푸시하면 `.github/workflows/deploy.yml`이 GitHub Pages로 배포합니다.
저장소 **Settings → Pages → Source**를 **GitHub Actions**로 한 번 설정해 주세요.

프로젝트 사이트는 `/<repo>/` 경로에서 서비스되므로 빌드 시 `BASE_PATH`가 주입됩니다.
커스텀 도메인이나 사용자 사이트에서는 `BASE_PATH=/ npm run build`로 빌드하세요.

## 알려진 한계

- 결합 문자(`x̂`)와 수학 알파벳(`𝔽`, `ℝ`)은 **보는 쪽 폰트**에 따라 다르게 보일 수 있습니다.
- `$…$` 판정은 휴리스틱입니다. 애매하면 변환하지 않는 쪽을 택합니다.
- 사용자 정의 매크로(`\newcommand`)는 확장하지 않습니다. 모르는 명령어는 리포트에 남습니다.
- `\text{...}` 안의 서식은 유니코드로 표현 가능한 범위에서만 반영됩니다.
