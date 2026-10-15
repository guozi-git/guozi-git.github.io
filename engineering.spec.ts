import { test, expect } from '@playwright/test';

test('font is discovered before entering the factory', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="preload"][as="font"]')).toHaveCount(1);
  await page.evaluate(() => document.fonts.load('80px "Factory Script"', '匠心造小作坊'));
  expect(
    await page.evaluate(
      () =>
        performance.getEntriesByType('resource').filter((e) => /factory-script.*otf/.test(e.name))
          .length,
    ),
  ).toBe(1);
  await expect(page.locator('h1')).toHaveText('果子 · 个人网站');
});

test('display rank preserves old paper and PDF identity', async ({ page }) => {
  await page.goto('/#factory/P088');
  await expect(page.getByText('P002 · 数值分析与优化', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '阅读原文', exact: true })).toHaveAttribute(
    'href',
    /P088.pdf/,
  );
  await page.goto('/#factory/workshop');
  await expect(page.locator('[data-paper="P046"]')).toContainText('P001');
  await page.getByLabel('搜索论文').fill('P088');
  await expect(page.locator('[data-paper="P088"]')).toContainText('P002');
});

test('invalid manuscripts and true 404 remain explicit errors', async ({ page }) => {
  for (const path of ['/#factory/P999', '/#factory/atelier/P999']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: '未找到这篇论文' })).toBeVisible();
  }
  const response = await page.goto('/missing-document/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '页面或文件不存在' })).toBeVisible();
  await expect(page.getByRole('link', { name: '返回首页' })).toHaveAttribute('href', '/');
});

test('factory views fit narrow, phone, tablet and desktop widths', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const hash of [
      '',
      '#factory',
      '#factory/workshop',
      '#factory/P088',
      '#factory/atelier/scoring',
    ]) {
      await page.goto(`/${hash}`);
      if (hash) await expect(page.getByRole('dialog')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (hash)
        expect(await page.getByRole('dialog').evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
          true,
        );
    }
  }
});
