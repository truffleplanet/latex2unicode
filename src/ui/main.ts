import { convert } from '../core/convert.js';
import type { ConvertResult, FallbackPolicy } from '../core/types.js';
import { issueExplanation, issueTitle } from './messages.js';
import './style.css';

const $ = <T extends HTMLElement>(selector: string): T => {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`missing element: ${selector}`);
  return el;
};

const input = $<HTMLTextAreaElement>('#input');
const output = $<HTMLDivElement>('#output');
const inputStats = $<HTMLParagraphElement>('#input-stats');
const status = $<HTMLParagraphElement>('#status');
const copyButton = $<HTMLButtonElement>('#copy-button');
const downloadButton = $<HTMLButtonElement>('#download-button');
const issuesSection = $<HTMLElement>('#issues');
const issueCount = $<HTMLSpanElement>('#issue-count');
const issueList = $<HTMLOListElement>('#issue-list');

const optBare = $<HTMLInputElement>('#opt-bare');
const optMinus = $<HTMLInputElement>('#opt-minus');
const optLigatures = $<HTMLInputElement>('#opt-ligatures');
const optHighlight = $<HTMLInputElement>('#opt-highlight');

const STORAGE_KEY = 'latex2unicode:v1';

interface UiState {
  defaultPolicy: FallbackPolicy;
  overrides: Record<string, FallbackPolicy>;
  convertBareCommands: boolean;
  prettyMinus: boolean;
  textLigatures: boolean;
  highlight: boolean;
}

const state: UiState = {
  defaultPolicy: 'keep',
  overrides: {},
  convertBareCommands: true,
  prettyMinus: true,
  textLigatures: false,
  highlight: true,
};

let lastResult: ConvertResult | null = null;
/** 오버라이드의 이슈 id는 같은 입력에서만 안정적이다 — 원문이 바뀌면 버린다. */
let overridesFor = '';

const SAMPLE = `그래디언트 하강법에서 학습률 $\\eta = 10^{-3}$ 을 사용했다.
손실 함수는 $L(\\theta) = \\frac{1}{n} \\sum_{i=1}^{n} \\ell_i(\\theta)$ 로 정의되며,
여기서 $\\theta \\in \\mathbb{R}^d$ 이고 수렴 조건은 $\\|\\nabla L\\| \\leq \\epsilon$ 이다.

케이스 구분은 다음과 같다.
\\[ f(x) = \\begin{cases} x^2 & x \\geq 0 \\\\ -x & x < 0 \\end{cases} \\]

참고로 GPU 대여 비용이 $100 에서 $80 으로 내려간 것과 이 실험은 무관하다.`;

/* ── 변환 실행 ─────────────────────────────────────────────── */

function run(): void {
  const source = input.value;

  if (overridesFor !== source) {
    state.overrides = {};
    overridesFor = source;
  }

  inputStats.textContent = `${source.length.toLocaleString('ko-KR')}자`;

  if (source === '') {
    lastResult = null;
    output.innerHTML = '';
    const placeholder = document.createElement('p');
    placeholder.className = 'output-placeholder';
    placeholder.textContent = '결과가 여기에 표시됩니다.';
    output.append(placeholder);
    copyButton.disabled = true;
    downloadButton.disabled = true;
    issuesSection.hidden = true;
    status.textContent = '';
    persist();
    return;
  }

  lastResult = convert(source, {
    defaultPolicy: state.defaultPolicy,
    overrides: state.overrides,
    convertBareCommands: state.convertBareCommands,
    prettyMinus: state.prettyMinus,
    textLigatures: state.textLigatures,
  });

  renderOutput(lastResult);
  renderIssues(lastResult);

  const { segments, issues } = lastResult.stats;
  status.textContent =
    segments === 0
      ? 'LaTeX 구간을 찾지 못했습니다.'
      : `LaTeX 구간 ${segments}개 변환` + (issues > 0 ? ` · 변환 불가 ${issues}건` : ' · 모두 변환됨');

  copyButton.disabled = false;
  downloadButton.disabled = false;
  persist();
}

function renderOutput(result: ConvertResult): void {
  output.classList.toggle('plain', !state.highlight);
  output.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (const piece of result.pieces) {
    if (piece.kind === 'text') {
      fragment.append(piece.text);
      continue;
    }
    const mark = document.createElement('mark');
    mark.className = piece.kind === 'math' ? 'converted' : 'fallback';
    mark.textContent = piece.text;
    if (piece.kind === 'fallback' && piece.issueId) {
      const issue = result.issues.find((i) => i.id === piece.issueId);
      mark.dataset.issue = piece.issueId;
      if (issue) mark.title = `${issueTitle(issue)} — 아래 목록에서 처리 방법을 고를 수 있습니다.`;
    }
    fragment.append(mark);
  }
  output.append(fragment);
}

function renderIssues(result: ConvertResult): void {
  issuesSection.hidden = result.issues.length === 0;
  issueCount.textContent = `${result.issues.length}건`;
  issueList.innerHTML = '';

  result.issues.forEach((issue, index) => {
    const item = document.createElement('li');
    item.className = 'issue';
    item.id = `issue-${issue.id}`;

    const meta = document.createElement('p');
    meta.className = 'issue-meta';
    meta.textContent = `#${index + 1} · ${issue.line}번째 줄`;

    const title = document.createElement('p');
    title.className = 'issue-title';
    title.textContent = issueTitle(issue);

    const explain = document.createElement('p');
    explain.className = 'issue-explain';
    explain.textContent = issueExplanation(issue);

    const choice = document.createElement('fieldset');
    choice.className = 'issue-choice';
    const legend = document.createElement('legend');
    legend.className = 'visually-hidden';
    legend.textContent = '처리 방법';
    choice.append(legend);

    const options: Array<[FallbackPolicy, string, string]> = [
      ['keep', '원본 유지', issue.keepPreview],
      ['flatten', '평문으로', issue.flattenPreview],
    ];
    for (const [policy, label, preview] of options) {
      const wrapper = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = `issue-${issue.id}`;
      radio.value = policy;
      radio.checked = issue.policy === policy;
      radio.addEventListener('change', () => {
        state.overrides[issue.id] = policy;
        run();
      });
      const code = document.createElement('code');
      code.textContent = preview;
      wrapper.append(radio, `${label} `, code);
      choice.append(wrapper);
    }

    item.append(meta, title, explain, choice);
    issueList.append(item);
  });
}

/* ── 입력과 옵션 이벤트 ────────────────────────────────────── */

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
input.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(run, 150);
});

for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="default-policy"]')) {
  radio.addEventListener('change', () => {
    if (!radio.checked) return;
    state.defaultPolicy = radio.value as FallbackPolicy;
    run();
  });
}

const bindOption = (checkbox: HTMLInputElement, key: keyof UiState): void => {
  checkbox.addEventListener('change', () => {
    (state[key] as boolean) = checkbox.checked;
    run();
  });
};
bindOption(optBare, 'convertBareCommands');
bindOption(optMinus, 'prettyMinus');
bindOption(optLigatures, 'textLigatures');
bindOption(optHighlight, 'highlight');

$<HTMLButtonElement>('#sample-button').addEventListener('click', () => {
  input.value = SAMPLE;
  input.focus();
  run();
});

$<HTMLButtonElement>('#clear-button').addEventListener('click', () => {
  input.value = '';
  input.focus();
  run();
});

/* ── 파일 열기와 끌어다 놓기 ───────────────────────────────── */

const fileInput = $<HTMLInputElement>('#file-input');
$<HTMLButtonElement>('#file-button').addEventListener('click', () => fileInput.click());

async function loadFile(file: File): Promise<void> {
  input.value = await file.text();
  run();
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) void loadFile(file);
  fileInput.value = '';
});

input.addEventListener('dragover', (event) => {
  if (event.dataTransfer?.types.includes('Files')) {
    event.preventDefault();
    input.classList.add('dragover');
  }
});
input.addEventListener('dragleave', () => input.classList.remove('dragover'));
input.addEventListener('drop', (event) => {
  const file = event.dataTransfer?.files[0];
  if (!file) return;
  event.preventDefault();
  input.classList.remove('dragover');
  void loadFile(file);
});

/* ── 결과 내보내기 ─────────────────────────────────────────── */

copyButton.addEventListener('click', async () => {
  if (!lastResult) return;
  try {
    await navigator.clipboard.writeText(lastResult.text);
    status.textContent = '결과를 클립보드에 복사했습니다.';
  } catch {
    status.textContent = '복사하지 못했습니다. 결과를 직접 선택해 복사해 주세요.';
  }
});

downloadButton.addEventListener('click', () => {
  if (!lastResult) return;
  const blob = new Blob([lastResult.text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = '변환결과.txt';
  anchor.click();
  URL.revokeObjectURL(url);
});

/* 결과의 변환 불가 구간을 누르면 해당 이슈 카드로 이동 */
output.addEventListener('click', (event) => {
  const mark = (event.target as HTMLElement).closest<HTMLElement>('mark.fallback');
  if (!mark?.dataset.issue) return;
  const card = document.getElementById(`issue-${mark.dataset.issue}`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.remove('flash');
  void card.offsetWidth; // 리플로우를 강제해 애니메이션을 처음부터 다시 재생한다.
  card.classList.add('flash');
});

/* ── 상태 저장/복원 ────────────────────────────────────────── */

function persist(): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        input: input.value,
        defaultPolicy: state.defaultPolicy,
        convertBareCommands: state.convertBareCommands,
        prettyMinus: state.prettyMinus,
        textLigatures: state.textLigatures,
        highlight: state.highlight,
      }),
    );
  } catch {
    // 저장 공간이 없어도 변환 자체는 동작해야 한다.
  }
}

function restore(): void {
  let saved: Record<string, unknown>;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>;
  } catch {
    return;
  }
  if (typeof saved.input === 'string') input.value = saved.input;
  if (saved.defaultPolicy === 'keep' || saved.defaultPolicy === 'flatten') {
    state.defaultPolicy = saved.defaultPolicy;
    const radio = document.querySelector<HTMLInputElement>(
      `input[name="default-policy"][value="${saved.defaultPolicy}"]`,
    );
    if (radio) radio.checked = true;
  }
  const flags: Array<[keyof UiState, HTMLInputElement]> = [
    ['convertBareCommands', optBare],
    ['prettyMinus', optMinus],
    ['textLigatures', optLigatures],
    ['highlight', optHighlight],
  ];
  for (const [key, checkbox] of flags) {
    if (typeof saved[key] === 'boolean') {
      (state[key] as boolean) = saved[key];
      checkbox.checked = saved[key];
    }
  }
}

restore();
run();
