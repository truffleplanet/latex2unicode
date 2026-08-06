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
  await expect(page.getByRole('status')).toHaveText('LaTeX 구간 1개 변환 · 모두 변환됨');
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

  await fallback.focus();
  await fallback.press('Space');
  await expect(issue).toBeFocused();
});

test('has no detectable accessibility violations in the fallback flow', async ({ page }) => {
  await page.getByRole('textbox', { name: '원문' }).fill('복잡한 수식 $\\frac{a+b}{c+d}$ 확인');
  await expect(
    page.getByRole('button', { name: /세로로 쌓인 분수.*처리 방법으로 이동/ }),
  ).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
