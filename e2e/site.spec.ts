import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('converts LaTeX while preserving currency text', async ({ page }) => {
  await page.getByRole('textbox', { name: '원문' }).fill(
    '가격은 $100 이고 수식은 $\\alpha + x^2$ 입니다.',
  );

  await expect(page.locator('#output')).toHaveText('가격은 $100 이고 수식은 α + x² 입니다.');
  await expect(page.locator('#status')).toHaveText('LaTeX 구간 1개 변환 · 모두 변환됨');
});

test('converts formal ASCII notation without changing inline code or prose', async ({ page }) => {
  await page.getByRole('radio', { name: /일반 텍스트/ }).check();
  await page
    .getByRole('textbox', { name: '원문' })
    .fill('forall x, x in A -> x in B\n\n`ptr->value` 와 배포 -> 완료는 그대로');

  await expect(page.locator('#output')).toHaveText(
    '∀ x, x ∈ A → x ∈ B\n\n`ptr->value` 와 배포 -> 완료는 그대로',
  );
});

test('opens a fallback issue with the keyboard', async ({ page }) => {
  await page.getByRole('textbox', { name: '원문' }).fill('복잡한 수식 $\\frac{a+b}{c+d}$ 확인');

  const fallback = page.getByRole('button', { name: /세로로 쌓인 분수.*처리 방법으로 이동/ });
  const issue = page.locator('#issue-list > li').first();

  await expect(page.locator('.panes + #issues')).toBeVisible();
  await fallback.focus();
  await fallback.press('Space');
  await expect(issue).toBeFocused();
});

test('finds, copies, and inserts a symbol at the cursor', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const input = page.getByRole('textbox', { name: '원문' });
  await input.fill('A  B');
  await input.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(2, 2));

  await page.getByRole('button', { name: '기호 넣기' }).click();
  const dialog = page.getByRole('dialog', { name: '기호 찾기' });
  const search = page.getByRole('searchbox', { name: '기호 검색' });
  await expect(dialog).toBeVisible();
  await expect(search).toBeFocused();
  await search.fill('부분집합');
  await expect(page.getByText('2개 기호')).toBeVisible();
  await expect(dialog.getByText('\\subseteq', { exact: true })).toBeVisible();
  await expect(dialog.getByText('subseteq', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: '⊂ 진부분집합 기호 복사' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('⊂');

  await page.getByRole('button', { name: '⊆ 부분집합 LaTeX로 넣기' }).click();
  await expect(input).toHaveValue('A \\subseteq B');
  await expect(page.locator('#output')).toHaveText('A ⊆ B');
  await expect(input).toBeFocused();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#status')).toContainText('\\subseteq 표기를 원문에 넣었습니다.');
});

test('shows and inserts only the current plain-text notation', async ({ page }) => {
  await page.getByRole('radio', { name: /일반 텍스트/ }).check();
  const input = page.getByRole('textbox', { name: '원문' });
  await input.fill('forall x, x  A');
  await input.evaluate((element: HTMLTextAreaElement) => {
    const cursor = element.value.indexOf('  ') + 1;
    element.setSelectionRange(cursor, cursor);
  });

  await page.getByRole('button', { name: '기호 넣기' }).click();
  const dialog = page.getByRole('dialog', { name: '기호 찾기' });
  await page.getByRole('searchbox', { name: '기호 검색' }).fill('원소');
  await expect(dialog.getByText('in', { exact: true })).toBeVisible();
  await expect(dialog.getByText('\\in', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: '∈ 원소 일반 텍스트로 넣기' }).click();
  await expect(input).toHaveValue('forall x, x in A');
  await expect(page.locator('#output')).toHaveText('∀ x, x ∈ A');

  await input.evaluate((element: HTMLTextAreaElement) => {
    element.setSelectionRange(element.value.length, element.value.length);
  });
  await page.getByRole('button', { name: '기호 넣기' }).click();
  await page.getByRole('searchbox', { name: '기호 검색' }).fill('알파');
  await page.getByRole('button', { name: 'α 알파 유니코드로 넣기' }).click();
  await expect(input).toHaveValue('forall x, x in A α');
});

test('has no detectable accessibility violations in the fallback flow', async ({ page }) => {
  await page.getByRole('textbox', { name: '원문' }).fill('복잡한 수식 $\\frac{a+b}{c+d}$ 확인');
  await expect(
    page.getByRole('button', { name: /세로로 쌓인 분수.*처리 방법으로 이동/ }),
  ).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('has no detectable accessibility violations in the symbol finder', async ({ page }) => {
  const trigger = page.getByRole('button', { name: '기호 넣기' });
  await trigger.click();
  await page.getByRole('searchbox', { name: '기호 검색' }).fill('subset');
  await expect(page.getByText('2개 기호')).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.getByRole('dialog', { name: '기호 찾기' }).press('Escape');
  await expect(trigger).toBeFocused();
});
