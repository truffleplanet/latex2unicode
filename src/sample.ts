/** A backtick — `String.raw` cannot escape one, but it does interpolate. */
const T = '`';

/** Demo document: exercises every conversion tier and every fallback rule. */
export const SAMPLE = String.raw`# 실험 결과

우리는 학습률 $\alpha = 10^{-3}$ 을 사용했고, 배치 크기는 $B_{\text{max}} = 256$ 으로 두었다.
손실 함수는 $\mathcal{L}(\theta) = \frac{1}{N}\sum_{i=1}^{N} \ell(f_\theta(x_i), y_i)$ 이며,
여기서 $\theta \in \mathbb{R}^d$ 이고 $\|\theta\| \leq C$ 를 가정한다.

전체 비용은 $1,200 이었고 GPU 시간은 $48 였다. (이 문장의 $ 기호는 건드리지 않습니다.)

\begin{align}
\hat{y} &= \sigma(W x + b) \\
\nabla_\theta \mathcal{L} &\approx \frac{1}{|B|} \sum_{i \in B} g_i
\end{align}

수렴 조건은 $\lim_{t \to \infty} \|x_t - x^*\| = 0$ 이고, 유의수준은 $p < 0.05$ 였다.
행렬 $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$ 의 행렬식은 $\det A = ad - bc$ 이다.

집합 $S = \{x \in \mathbb{N}\}$ 에 대해 $|S| = \infty$ 이고, $\sqrt[3]{27} = 3$ 이다.
이차방정식의 근은 $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ 로 주어진다.

코드 안의 ${T}$x^2$${T} 와 ${T}\alpha${T} 는 그대로 남습니다.
정확도는 92\% 였고 \textbf{유의미한} 차이를 보였다.
`;
