import { convert } from './core/convert.js';
import { defaultOptions, type ConvertOptions, type FallbackPolicy, type Issue } from './core/types.js';
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
  inputStats: $<HTMLSpanElement>('inputStats'),
  outputStats: $<HTMLSpanElement>('outputStats'),
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

let settings = loadSettings();

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
      mark.dataset.issue = p.issueId;
      mark.title = '변환 불가 — 클릭하면 리포트에서 확인할 수 있습니다';
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
    line.textContent = `L${issue.line}`;

    const body = document.createElement('div');
    body.className = 'body';

    const src = document.createElement('p');
    src.className = 'src';
    src.textContent = issue.source;

    const why = document.createElement('p');
    why.className = 'why';
    why.textContent = issue.reason;

    const preview = document.createElement('p');
    preview.className = 'preview';
    preview.textContent = `펼치면 → ${issue.flattenPreview}`;

    body.append(src, why, preview);

    const choice = document.createElement('div');
    choice.className = 'choice';
    for (const [policy, label] of [
      ['keep', '원본 유지'],
      ['flatten', '펼치기'],
    ] as const) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.className = active === policy ? 'on' : 'ghost';
      btn.addEventListener('click', () => {
        if (policy === settings.defaultPolicy) delete overrides[issue.id];
        else overrides[issue.id] = policy;
        run();
      });
      choice.append(btn);
    }

    li.append(line, body, choice);
    els.issues.append(li);
  }
}

let lastIssueIds: string[] = [];

function run(): void {
  const source = els.input.value;
  const result = convert(source, { ...settings, overrides });
  lastText = result.text;
  lastIssueIds = result.issues.map((i) => i.id);

  renderOutput(result.pieces);
  renderIssues(result.issues);

  els.inputStats.textContent = source ? `${source.length.toLocaleString()}자` : '';
  els.outputStats.textContent = source
    ? `LaTeX 구간 ${result.stats.segments}개 · 변환 불가 ${result.stats.issues}개`
    : '';

  try {
    localStorage.setItem(DRAFT_KEY, source);
  } catch {
    // ignore
  }
}

/** Highlight the pair (output span, report row) for one issue. */
function focusIssue(id: string): void {
  for (const el of document.querySelectorAll('.focus')) el.classList.remove('focus');
  const row = els.issues.querySelector<HTMLElement>(`li[data-issue="${CSS.escape(id)}"]`);
  const mark = els.output.querySelector<HTMLElement>(`mark[data-issue="${CSS.escape(id)}"]`);
  row?.classList.add('focus');
  mark?.classList.add('focus');
  row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// ── wiring ─────────────────────────────────────────────────────────

let debounce: number | undefined;
els.input.addEventListener('input', () => {
  window.clearTimeout(debounce);
  debounce = window.setTimeout(run, 120);
});

els.policy.addEventListener('change', () => {
  settings.defaultPolicy = els.policy.value as FallbackPolicy;
  // Per-item choices describe deviations from the default, so a new default
  // makes the old deviations meaningless.
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

els.copy.addEventListener('click', async () => {
  const label = els.copy.textContent;
  try {
    await navigator.clipboard.writeText(lastText);
    els.copy.textContent = '복사됨';
  } catch {
    els.copy.textContent = '복사 실패';
  }
  window.setTimeout(() => {
    els.copy.textContent = label;
  }, 1200);
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
