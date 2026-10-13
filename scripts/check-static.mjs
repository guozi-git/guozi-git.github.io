/* global document, getComputedStyle, location, URL, innerWidth */
import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { log } from 'node:console';

const address = process.argv[2] || 'http://127.0.0.1:3000/';
const site = new URL(address.endsWith('/') ? address : `${address}/`);
const temp = resolve('.preview/tmp');
mkdirSync(temp, { recursive: true });
process.env.TEMP = process.env.TMP = temp;
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL === 'chromium' ? undefined : 'msedge',
});
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });
  async function assets() {
    for (const image of await page.locator('img:visible').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() => image.evaluate((el) => el.complete && el.naturalWidth > 0))
        .toBe(true);
    }
    // Include SVG images, full-size links and CSS backgrounds, not only <img>.
    const urls = await page.evaluate(() => {
      const found = new Set();
      for (const element of document.querySelectorAll('*')) {
        for (const match of getComputedStyle(element).backgroundImage.matchAll(
          /url\(["']?([^"')]+)["']?\)/g,
        )) {
          found.add(match[1]);
        }
      }
      for (const el of document.querySelectorAll('svg image, .hearthstone-screenshot')) {
        const href = el.getAttribute('href');
        if (href) found.add(new URL(href, location.href).href);
      }
      return [...found];
    });
    for (const url of urls) {
      if (!url.startsWith(site.origin)) continue;
      expect(new URL(url).pathname.startsWith(site.pathname)).toBe(true);
      expect((await page.request.get(url)).status(), url).toBe(200);
    }
  }
  for (const width of [1440, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const hash of [
      '',
      '#publications/grid-dissociation',
      '#projects/personal-website',
      '#interests/badminton',
      '#interests/swimming',
      '#interests/gaming',
      '#factory',
    ]) {
      await page.goto(`${site}${hash}`);
      await expect(page).toHaveTitle('果子 · 个人网站');
      if (hash) await expect(page.getByRole('dialog')).toBeVisible();
      else await expect(page.locator('.orbit')).toBeVisible();
      await page.reload();
      if (hash) await expect(page.getByRole('dialog')).toBeVisible();
      await assets();
      if (hash === '#interests/badminton') {
        for (const id of ['racket', 'shirt', 'shoes']) {
          await page.locator(`[data-equipment="${id}"]`).click();
          await assets();
          await page.keyboard.press('Escape');
        }
      }
      if (hash === '#interests/gaming') {
        for (const id of ['devices', 'cs', 'hearthstone']) {
          await page.locator(`.game-${id} > summary`).click();
          await assets();
          await page.keyboard.press('Escape');
        }
      }
      if (hash === '#factory') {
        await page.locator('[data-door="workshop"]').focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('heading', { name: '研究论文', exact: true })).toBeVisible();
        await page.getByLabel('搜索论文').fill('P045');
        await page.locator('[data-paper="P045"]').click();
        const pdf = page.getByRole('link', { name: '阅读原文' });
        const href = await pdf.getAttribute('href');
        const url = new URL(href, site);
        expect(url.pathname).toBe(`${site.pathname}papers/P045.pdf`);
        expect(url.searchParams.get('v')).toMatch(/^[a-f0-9]{16}$/);
        const response = await page.request.get(url.href);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/pdf');
        await expect(page.locator('a[download]')).toHaveCount(0);
        await page.getByRole('button', { name: '返回论文汇总' }).click();
      }
      if (hash) {
        await page.getByRole('button', { name: 'Home', exact: true }).click();
        await expect(page.getByRole('dialog')).toHaveCount(0);
        expect(new URL(page.url()).pathname).toBe(site.pathname);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
  expect(failures).toEqual([]);
  for (const selector of ['link[rel="icon"]', 'link[rel="apple-touch-icon"]']) {
    const path = await page.locator(selector).getAttribute('href');
    expect((await page.request.get(new URL(path, site).href)).status()).toBe(200);
  }
  const share = new URL(await page.locator('meta[property="og:image"]').getAttribute('content'));
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (publicUrl) {
    const canonical = `${publicUrl.replace(/\/$/, '')}/`;
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(canonical);
    expect(await page.locator('meta[property="og:url"]').getAttribute('content')).toBe(canonical);
    expect(share.href).toBe(new URL('share-cover.png', canonical).href);
  } else {
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  }
  expect(await page.locator('meta[name="robots"]').getAttribute('content')).toBe(
    publicUrl && process.env.INDEX_SITE === 'true' ? 'index, follow' : 'noindex, follow',
  );
  expect(await page.locator('meta[name="twitter:image"]').getAttribute('content')).toBe(share.href);
  expect(share.pathname).toBe(`${site.pathname}share-cover.png`);
  expect((await page.request.get(new URL(share.pathname, site.origin).href)).status()).toBe(200);
  expect((await page.request.get(new URL('devices/setup.png', site).href)).status()).toBe(404);
  expect((await page.request.get(new URL('missing-file.png', site).href)).status()).toBe(404);
  log(
    `Static export verified: ${site} — desktop/mobile, hash refresh, nested images, CSS backgrounds, return, 404.`,
  );
} finally {
  await browser.close();
}
