import { convert } from './core/convert.js';
import { defaultOptions, type ConvertOptions, type FallbackPolicy, type Issue } from './core/types.js';
import { describe } from './messages.js';
import { SAMPLE } from './sample.js';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing element #${id}`);
  return el as T;
};

const els = {
  input: $<HTMLTextAreaElement>('input'),
  output: $<HTMLDivElement>('output'),
  issues: $<HTMLOListElement>('issues'),
  issueCount: $<HTMLSpanElement>('issueCount'),
  inputStats: $<HTMLParagraphElement>('inputStats'),
  outputStats: $<HTMLParagraphElement>('outputStats'),
  live: $<HTMLParagraphElement>('live'),
  policy: $<HTMLSelectElement>('policy'),
  prettyMinus: $<HTMLInputElement>('prettyMinus'),
  convertBareCommands: $<HTMLInputElement>('convertBareCommands'),
  textLigatures: $<HTMLInputElement>('textLigatures'),
  copy: $<HTMLButtonElement>('copy'),
  sample: $<HTMLButtonElement>('sample'),
  clear: $<HTMLButtonElement>('clear'),
  flattenAll: $<HTMLButtonElement>('flattenAll'),
  resetAll: $<HTMLButtonElement>('resetAll'),
};

const SETTINGS_KEY = 'latex2unicode.settings.v1';
const DRAFT_KEY = 'latex2unicode.draft.v1';

/** Per-construct choices. Kept in memory only: ids describe one exact input. */
let overrides: Record<string, FallbackPolicy> = {};
let lastText = '';
let lastIssueIds: string[] = [];

function loadSettings(): ConvertOptions {
  const opts = { ...defaultOptions };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) Object.assign(opts, JSON.parse(raw) as Partial<ConvertOptions>);
  } catch {
    // Corrupt or unavailable storage is not worth failing over.
  }
  opts.overrides = {};
  return opts;
}

const settings = loadSettings();

function saveSettings(): void {
  try {
    const { defaultPolicy, prettyMinus, convertBareCommands, textLigatures } = settings;
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ defaultPolicy, prettyMinus, convertBareCommands, textLigatures }),
    );
  } catch {
    // ignore
  }
}

function syncControls(): void {
  els.policy.value = settings.defaultPolicy;
  els.prettyMinus.checked = settings.prettyMinus;
  els.convertBareCommands.checked = settings.convertBareCommands;
  els.textLigatures.checked = settings.textLigatures;
}

function renderOutput(pieces: ReturnType<typeof convert>['pieces']): void {
  els.output.replaceChildren();
  if (pieces.length === 0) {
    const hint = document.createElement('span');
    hint.className = 'empty';
    hint.textContent = '왼쪽에 글을 붙여넣으면 변환 결과가 여기에 표시됩니다.';
    els.output.append(hint);
    return;
  }

  for (const p of pieces) {
    if (p.kind === 'text') {
      els.output.append(document.createTextNode(p.text));
      continue;
    }
    const mark = document.createElement('mark');
    mark.className = p.kind === 'fallback' ? 'bad' : 'ok';
    mark.textContent = p.text;

    if (p.issueId) {
      // Keyboard-reachable: these are the jump targets into the report.
      mark.dataset.issue = p.issueId;
      mark.tabIndex = 0;
      mark.setAttribute('role', 'button');
      mark.setAttribute('aria-label', `변환 불가 항목 ${p.text} — 리포트에서 보기`);
    }
    els.output.append(mark);
  }
}

function policyOf(issue: Issue): FallbackPolicy {
  return overrides[issue.id] ?? settings.defaultPolicy;
}

function renderIssues(issues: Issue[]): void {
  els.issueCount.textContent = String(issues.length);
  els.issues.replaceChildren();

  if (issues.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = '변환하지 못한 부분이 없습니다.';
    els.issues.append(li);
    return;
  }

  for (const issue of issues) {
    const active = policyOf(issue);
    const li = document.createElement('li');
    li.dataset.issue = issue.id;

    const line = document.createElement('span');
    line.className = 'line';
    line.textContent = `${issue.line}행`;

    const body = document.createElement('div');
    body.className = 'body';

    const src = document.createElement('p');
    src.className = 'src';
    src.textContent = issue.source;

    const why = document.createElement('p');
    why.className = 'why';
    why.textContent = describe(issue);

    const preview = document.createElement('p');
    preview.className = 'preview';
    preview.textContent = `펼치면 → ${issue.flattenPreview}`;

    body.append(src, why, preview);

    const choice = document.createElement('div');
    choice.className = 'choice';
    choice.setAttribute('role', 'group');
    choice.setAttribute('aria-label', `${issue.line}행 ${issue.source} 처리 방식`);

    for (const [policy, label] of [
      ['keep', '원본 유지'],
      ['flatten', '펼치기'],
    ] as const) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.setAttribute('aria-pressed', String(active === policy));
      btn.addEventListener('click', () => {
        // An override records a deviation from the default, nothing more.
        if (policy === settings.defaultPolicy) delete overrides[issue.id];
        else overrides[issue.id] = policy;
        run();
        // Keep focus where the user was working.
        const again = els.issues.querySelector<HTMLElement>(
          `li[data-issue="${CSS.escape(issue.id)}"] .choice button[aria-pressed="true"]`,
        );
        again?.focus();
      });
      choice.append(btn);
    }

    li.append(line, body, choice);
    els.issues.append(li);
  }
}

let announce: number | undefined;

function run(): void {
  const source = els.input.value;
  const result = convert(source, { ...settings, overrides });
  lastText = result.text;
  lastIssueIds = result.issues.map((i) => i.id);

  renderOutput(result.pieces);
  renderIssues(result.issues);

  els.inputStats.textContent = source ? `${source.length.toLocaleString('ko-KR')}자` : '';
  const summary = source
    ? `LaTeX 구간 ${result.stats.segments}개 · 변환 불가 ${result.stats.issues}개`
    : '';
  els.outputStats.textContent = summary;

  // The result pane rewrites itself on every keystroke, so it must not be a
  // live region. Announce the summary instead, once the typing settles.
  window.clearTimeout(announce);
  announce = window.setTimeout(() => {
    els.live.textContent = summary;
  }, 700);

  try {
    localStorage.setItem(DRAFT_KEY, source);
  } catch {
    // ignore
  }
}

/** Highlight the pair (result mark, report row) for one issue. */
function focusIssue(id: string): void {
  for (const el of document.querySelectorAll('.focus')) el.classList.remove('focus');
  const row = els.issues.querySelector<HTMLElement>(`li[data-issue="${CSS.escape(id)}"]`);
  const mark = els.output.querySelector<HTMLElement>(`mark[data-issue="${CSS.escape(id)}"]`);
  row?.classList.add('focus');
  mark?.classList.add('focus');
  row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  row?.querySelector<HTMLButtonElement>('.choice button')?.focus();
}

// ── wiring ─────────────────────────────────────────────────────────

let debounce: number | undefined;
els.input.addEventListener('input', () => {
  window.clearTimeout(debounce);
  debounce = window.setTimeout(run, 120);
});

els.policy.addEventListener('change', () => {
  settings.defaultPolicy = els.policy.value as FallbackPolicy;
  // Per-item choices are deviations from the default, so a new default makes
  // the old deviations meaningless.
  overrides = {};
  saveSettings();
  run();
});

for (const key of ['prettyMinus', 'convertBareCommands', 'textLigatures'] as const) {
  els[key].addEventListener('change', () => {
    settings[key] = els[key].checked;
    saveSettings();
    run();
  });
}

els.output.addEventListener('click', (e) => {
  const mark = (e.target as HTMLElement).closest<HTMLElement>('mark[data-issue]');
  if (mark?.dataset.issue) focusIssue(mark.dataset.issue);
});

els.output.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const mark = (e.target as HTMLElement).closest<HTMLElement>('mark[data-issue]');
  if (!mark?.dataset.issue) return;
  e.preventDefault();
  focusIssue(mark.dataset.issue);
});

els.copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(lastText);
    els.copy.textContent = '복사됨';
    els.live.textContent = '결과를 클립보드에 복사했습니다.';
  } catch {
    els.copy.textContent = '복사 실패';
    els.live.textContent = '복사에 실패했습니다. 직접 선택해 복사해 주세요.';
  }
  window.setTimeout(() => {
    els.copy.textContent = '복사';
  }, 1400);
});

els.sample.addEventListener('click', () => {
  els.input.value = SAMPLE;
  overrides = {};
  run();
});

els.clear.addEventListener('click', () => {
  els.input.value = '';
  overrides = {};
  run();
  els.input.focus();
});

els.flattenAll.addEventListener('click', () => {
  for (const id of lastIssueIds) overrides[id] = 'flatten';
  run();
});

els.resetAll.addEventListener('click', () => {
  overrides = {};
  run();
});

syncControls();
try {
  els.input.value = localStorage.getItem(DRAFT_KEY) ?? '';
} catch {
  // ignore
}
run();
