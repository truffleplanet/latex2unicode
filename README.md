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
| `src/messages.ts` | 실패 원인(`code`) → 한국어 문구. 코어는 언어 중립 유지 |
| `src/style.css` | 디자인 토큰 + 레이아웃 |

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

## 디자인 · 접근성

**종이(paper) 한 가지만 가져왔습니다.** 따뜻한 오프화이트 바탕, 헤어라인 규선, 0px 라운드,
그림자 없음, 넉넉한 여백, 미세한 노이즈·괘선 텍스처. 대형 세리프 디스플레이 타입이나
전면 반전 같은 에디토리얼 극단은 의도적으로 뺐습니다 — 이 도구의 본질은 텍스트를
훑고 좌우로 대조하는 일이고, 거기서는 드라마보다 가독성이 이깁니다.

**색은 의미가 있는 곳에만.** 결과 창의 두 하이라이트가 전부입니다. 그리고 둘은
색 없이도 구별됩니다 — 변환됨은 평평한 워시, 변환 불가는 **밑줄**이 추가로 붙습니다.

**타이포그래피**
- UI: Pretendard 서브셋(자체 호스팅), 가변 굵기축 45–930
- 입력·결과 창: 모노스페이스. 좌우 줄 대조와 수식 정렬이 목적이라 의도적으로 유지
- 한국어 줄바꿈: `word-break: keep-all` — 기본값은 음절 단위로 끊어 단어를 반토막 냅니다

**접근성** (자동 검증 항목)
- 명암비: 라이트·다크 모두 전 요소 WCAG AA 통과 (포커스된 리포트 행 포함)
- 키보드: 모든 조작 지점에 2px 포커스 링. 결과 창의 변환 불가 표시는
  `Tab`으로 도달 + `Enter`/`Space`로 리포트 이동
- 터치 타깃: 포인터가 coarse면 44px, 체크박스는 라벨과 한 덩어리로 24px 이상 확보
- 결과 창은 라이브 리전이 **아님**. 매 타이핑마다 전체가 바뀌므로 스크린리더를
  도배하게 됩니다. 대신 별도 `role="status"`가 요약만 지연 안내
- 건너뛰기 링크, `prefers-reduced-motion`, `prefers-reduced-transparency` 대응

### 웹폰트 — 왜 서브셋하고, 왜 이름이 다른가

한글 폰트는 크기가 문제입니다. 실측값:

| 방식 | 전송량 | 비고 |
|---|---|---|
| Pretendard 전체 가변폰트 | 2.0MB | 과함 |
| 한글 블록(U+AC00–D7A3) 전체 서브셋 | 1.7MB | 과함 |
| Pretendard 공식 dynamic-subset | **352KB** / 14개 청크 | 한글 음절이 여러 unicode-range에 흩어져 있어 이 화면에서 14조각을 받음 |
| 이 화면 글자만 서브셋 | **75KB** / 1개 | 채택 |

UI 크롬에 실제로 쓰이는 글자만 남겨 **75KB 한 파일**로 자체 호스팅합니다.
외부 요청이 0이므로 "입력한 글은 어디에도 전송되지 않는다"는 약속이 폰트까지 포함해
유지되고, 오프라인에서도 동작합니다.

**이름이 `Sheet Sans`인 이유**: SIL Open Font License 1.1에서 서브셋은 *Modified Version*이고,
3항이 Modified Version에 예약 이름 `Pretendard`를 쓰지 못하게 합니다. 그래서 서체 이름만 바꾸고,
원작(길형진)은 `src/fonts/LICENSE.txt`·README·화면 푸터에 명시했습니다. 폰트 스택은
`"Sheet Sans", Pretendard, …` 순이라 Pretendard가 설치된 환경에서는 서브셋에 없는 글자도
같은 서체로 이어집니다.

서브셋은 곧 계약입니다. UI 문구에 새 음절이 들어오면 그 글자만 시스템 폰트로 조용히
떨어지므로, `npm test`가 소스의 모든 문자가 서브셋 목록에 있는지 검사합니다.
UI 문구를 고친 뒤에는 한 번만 실행하면 됩니다 (목록 재수집과 woff2 재생성이 한 명령입니다):

```bash
npm run font   # pip install fonttools brotli 필요
```

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm test         # vitest (54 tests)
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
`issue.code`(`'no-subscript'`, `'operator-limits'` …)와 `issue.detail`을 함께 주므로
직접 문구를 만들 수 있습니다. 한국어 문구는 `src/messages.ts`에 있습니다.

## 배포

`main`에 푸시하면 `.github/workflows/deploy.yml`이 GitHub Pages로 배포합니다.

**최초 1회만 수동 설정이 필요합니다** — 저장소 **Settings → Pages → Source**를
**GitHub Actions**로 바꿔주세요. 이걸 워크플로가 대신 할 수는 없습니다:
Pages 사이트 *생성*은 저장소 관리자 권한이 필요하고, 워크플로의 `GITHUB_TOKEN`이 가진
`pages: write`는 이미 존재하는 사이트에 *배포*하는 권한까지만 커버합니다
(`enablement: true`를 주면 `Resource not accessible by integration`으로 실패).
설정 후에는 Actions 탭에서 실패한 실행을 **Re-run**하면 됩니다.

프로젝트 사이트는 `/<repo>/` 경로에서 서비스되므로 빌드 시 `BASE_PATH`가 주입됩니다.
커스텀 도메인이나 사용자 사이트에서는 `BASE_PATH=/ npm run build`로 빌드하세요.

## 알려진 한계

- 결합 문자(`x̂`)와 수학 알파벳(`𝔽`, `ℝ`)은 **보는 쪽 폰트**에 따라 다르게 보일 수 있습니다.
- `$…$` 판정은 휴리스틱입니다. 애매하면 변환하지 않는 쪽을 택합니다.
- 사용자 정의 매크로(`\newcommand`)는 확장하지 않습니다. 모르는 명령어는 리포트에 남습니다.
- `\text{...}` 안의 서식은 유니코드로 표현 가능한 범위에서만 반영됩니다.
