import { test, expect } from '@playwright/test';
import { publications } from './src/lib/publications';
test('first project preview, detail, history and mobile', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: '打开兴趣造物', exact: true }).click();
  await expect(page.locator('.project-card')).toHaveCount(1);
  await expect(page.locator('.project-status')).toHaveText('制作中');
  await expect
    .poll(() =>
      page
        .locator('.project-cover img')
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.screenshot({ path: '.preview/projects-desktop.png' });
  await page.getByRole('button', { name: '查看作品：果子的个人网站' }).click();
  await expect(page.locator('#project-title')).toHaveText('果子的个人网站');
  await expect(page.getByText('你正在浏览的，就是我的第一件作品。', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.project-card')).toBeFocused();
  await page.locator('.project-card').click();
  await page.goBack();
  await expect(page.locator('.project-card')).toBeVisible();
  await page.goForward();
  await expect(page.locator('#project-title')).toBeVisible();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#projects/personal-website');
  await expect(page.locator('#project-title')).toBeVisible();
  expect(
    await page.locator('.detail').evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await page.getByRole('button', { name: '返回作品列表' }).click();
  await expect(page.locator('.project-card')).toBeVisible();
  await page.screenshot({ path: '.preview/projects-mobile.png' });
});

test('interest stack, linked equipment, empty sections and layered return', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: '打开兴趣爱好', exact: true }).click();
  await expect(page.locator('.hobby-row')).toHaveCount(3);
  const positions = await page
    .locator('.hobby-row')
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().top));
  expect(positions[0]).toBeLessThan(positions[1]);
  expect(positions[1]).toBeLessThan(positions[2]);
  await page.screenshot({ path: '.preview/interests-desktop.png' });
  await page.locator('[data-hobby="badminton"]').click();
  await expect(page.locator('.equipment-card')).toHaveCount(3);
  await expect(page.locator('.player-illustration')).toBeVisible();
  await page.screenshot({ path: '.preview/badminton-desktop.png' });
  for (const id of ['racket', 'shirt', 'shoes']) {
    const card = page.locator(`[data-equipment="${id}"]`);
    await card.click();
    await expect(page.locator('.equipment-description')).toBeVisible();
    await expect(page.locator('.kit-item')).toHaveCount(
      id === 'racket' ? 4 : id === 'shirt' ? 1 : 2,
    );
    if (id === 'racket') {
      await expect(page.locator('.kit-status-active')).toHaveCount(3);
      await expect(page.locator('.kit-status-retired')).toHaveCount(1);
      await expect(page.locator('.kit-item').first()).toHaveAttribute('data-kit', 'astrox-88dp');
      await expect(page.locator('.kit-item').last()).toHaveAttribute('data-kit', 'rocket11');
      await expect(page.getByText('有轻微磕碰', { exact: true })).toBeVisible();
      await expect(page.getByText('漆水全新', { exact: true })).toBeVisible();
    }
    for (const photo of await page.locator('.kit-photo img').all()) {
      await photo.scrollIntoViewIfNeeded();
      await expect
        .poll(() => photo.evaluate((image) => (image as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
    }
    if (id === 'shoes') {
      await expect(page.locator('.kit-item').first()).toHaveAttribute('data-kit', 'blade2p');
      await expect(page.locator('.kit-item').last()).toHaveAttribute('data-kit', '65z3');
      await expect(page.locator('[data-kit="blade2p"] img')).toHaveAttribute(
        'alt',
        /标准白 \/ 银色/,
      );
    }
    await expect(page.locator('.equipment-description a')).toHaveCount(0);
    await expect(page.locator('.kit-footnote')).toHaveCount(0);
    await expect(card).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.equipment-node.is-active')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('.equipment-description')).toHaveCount(0);
    await expect(card).toBeFocused();
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-hobby="badminton"]')).toBeFocused();
  for (const id of ['gaming']) {
    await page.locator(`[data-hobby="${id}"]`).click();
    await expect(page.locator('.game-card')).toHaveCount(3);
    for (const card of await page.locator('.game-card').all()) {
      await card.locator('summary').click();
      if (await card.evaluate((element) => element.classList.contains('game-devices'))) {
        await expect(page.locator('#devices-title')).toBeVisible();
        await expect(page.locator('.game-cs')).toBeHidden();
        await expect(page.locator('.devices-peripherals')).toContainText('KTC 大师 27M2');
        await expect(page.locator('.peripheral-card')).toHaveCount(5);
        await card.locator('summary').click();
        continue;
      }
      const isCs = await card.evaluate((element) => element.classList.contains('game-cs'));
      await expect(
        card.getByRole('heading', { name: isCs ? '留下的瞬间' : '天梯', exact: true }),
      ).toBeVisible();
      await expect(
        card.getByRole('heading', { name: isCs ? '收藏与偏好' : '酒馆', exact: true }),
      ).toBeVisible();
      if (await card.evaluate((element) => element.classList.contains('game-cs'))) {
        await expect(page.locator('.game-hearthstone')).toBeHidden();
        await expect(page.locator('.cs-combination strong')).toHaveText([
          '超导体',
          '火神',
          '伽马多普勒',
        ]);
        await expect(page.locator('.cs-items li')).toHaveCount(10);
        await expect(page.locator('.cs-items h6')).toHaveText(
          [
            '渐变大理石',
            '外表生锈',
            '北方森林',
            '渐变大理石',
            '黑色层压板',
            '紫外狂潮',
            '自动化',
            '多普勒',
            '渐变大理石',
            '渐变之色',
          ].reverse(),
        );
        await expect(page.locator('.cs-combination')).toContainText('606');
        await page.screenshot({ path: '.preview/cs-updated-desktop.png' });
      }
      await card.locator('summary').click();
    }
    await page.screenshot({ path: '.preview/gaming-desktop.png' });
    await page.getByRole('button', { name: '返回兴趣列表' }).click();
  }
  await page.locator('[data-hobby="badminton"]').click();
  await page.goBack();
  await expect(page.locator('.hobby-row')).toHaveCount(3);
  await page.goForward();
  await expect(page.locator('.equipment-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#interests/badminton');
  await expect(page.locator('.equipment-card')).toHaveCount(3);
  expect(
    await page.locator('.detail').evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: '.preview/badminton-mobile.png' });
  await page.locator('[data-equipment="racket"]').click();
  await expect(page.locator('.equipment-description')).toBeVisible();
  await page.locator('.kit-item').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.preview/equipment-mobile.png' });
  expect(
    await page.locator('.detail').evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await page.getByRole('button', { name: '收起装备介绍' }).click();
  await page.getByRole('button', { name: '返回兴趣列表' }).click();
  await expect(page.locator('.hobby-row')).toHaveCount(3);
});

test('three publication cards, sources, nested history and keyboard return', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: '打开论文发表', exact: true }).click();
  const cards = page.locator('.publication-card');
  await expect(cards).toHaveCount(3);
  const boxes = await cards.evaluateAll((elements) =>
    elements.map((element) => ({
      x: element.getBoundingClientRect().x,
      y: element.getBoundingClientRect().y,
    })),
  );
  expect(boxes[0].y).toBe(boxes[2].y);
  expect(boxes[0].x).toBeLessThan(boxes[1].x);
  expect(boxes[1].x).toBeLessThan(boxes[2].x);
  await page.screenshot({ path: '.preview/publications-desktop.png' });
  for (const paper of publications) {
    const card = page.locator(`[data-paper="${paper.id}"]`);
    await card.click();
    await expect(page.locator('#paper-title')).toHaveText(paper.title);
    await expect(page.locator('.paper-authors')).toHaveText(paper.authors.join(' · '));
    await expect(page.locator('.paper-detail .paper-status')).toHaveText(paper.status);
    const source = page.locator(`.paper-links a[href="${paper.source}"]`);
    await expect(source).toHaveAttribute('target', '_blank');
    if (paper.fullText)
      await expect(page.getByRole('link', { name: /阅读原文 PDF/ })).toHaveAttribute(
        'href',
        paper.fullText,
      );
    else await expect(page.getByRole('link', { name: /阅读原文 PDF/ })).toHaveCount(0);
    await page.keyboard.press('Tab');
    await expect(page.locator('.paper-links a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(cards).toHaveCount(3);
    await expect(card).toBeFocused();
  }
  await cards.first().click();
  await page.screenshot({ path: '.preview/publication-detail.png' });
  await page.goBack();
  await expect(cards).toHaveCount(3);
  await page.goForward();
  await expect(page.locator('#paper-title')).toBeVisible();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('mobile publication stack and direct paper link', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#publications/bipartite-stability');
  await expect(page.locator('#paper-title')).toHaveText(publications[2].title);
  await page.getByRole('button', { name: '返回论文列表' }).click();
  await expect(page.locator('.publication-card')).toHaveCount(3);
  const boxes = await page.locator('.publication-card').evaluateAll((elements) =>
    elements.map((element) => ({
      x: element.getBoundingClientRect().x,
      y: element.getBoundingClientRect().y,
    })),
  );
  expect(boxes[0].x).toBe(boxes[2].x);
  expect(boxes[0].y).toBeLessThan(boxes[1].y);
  expect(boxes[1].y).toBeLessThan(boxes[2].y);
  expect(
    await page.locator('.detail').evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await page.locator('.detail').evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({ path: '.preview/publications-mobile.png' });
});

test('opening and closing include visible intermediate geometry', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('button', { name: '打开兴趣爱好', exact: true }).click();
  await page.waitForTimeout(120);
  const intermediate = await page.getByRole('dialog').boundingBox();
  expect(
    await page
      .locator('.detail-body')
      .evaluate((element) => Number(getComputedStyle(element).opacity)),
  ).toBeLessThan(0.5);
  await page.screenshot({ path: '.preview/opening-midway.png' });
  await page.waitForTimeout(800);
  const expanded = await page.getByRole('dialog').boundingBox();
  expect(intermediate!.width).toBeLessThan(expanded!.width - 20);
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.waitForTimeout(180);
  const shrinking = await page.getByRole('dialog').boundingBox();
  expect(shrinking!.width).toBeLessThan(expanded!.width - 20);
  await page.screenshot({ path: '.preview/closing-midway.png' });
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Escape during opening is preserved, including repeated presses', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: '打开兴趣爱好', exact: true });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(() => {
    const panel = document.querySelector('[role="dialog"]')!;
    if (!panel.getAnimations({ subtree: true }).some((a) => a.playState === 'running')) {
      throw new Error('Expected an opening animation');
    }
    for (let i = 0; i < 3; i++) {
      panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }
  });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('five entrances, return, keyboard focus and browser history', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.screenshot({ path: '.preview/desktop.png', fullPage: true });
  for (const title of ['兴趣爱好', '论文发表', '兴趣造物', '论文工厂', '自我介绍']) {
    const trigger = page.getByRole('button', { name: `打开${title}`, exact: true });
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    if (title === '兴趣爱好') {
      await expect
        .poll(() => page.evaluate(() => document.getAnimations().length))
        .toBeGreaterThan(0);
    }
    await page.waitForTimeout(850);
    if (title === '兴趣爱好') await page.screenshot({ path: '.preview/detail.png' });
    await page.keyboard.press('Tab');
    if (title === '兴趣爱好') {
      await expect(page.locator('.hobby-row').first()).toBeFocused();
    } else if (title === '论文发表') {
      await expect(page.locator('.publication-card').first()).toBeFocused();
    } else if (title === '兴趣造物') {
      await expect(page.locator('.project-card')).toBeFocused();
    } else if (title === '论文工厂') {
      await expect(page.locator('[data-door="atelier"]')).toBeFocused();
    } else {
      await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeFocused();
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.waitForTimeout(850);
    await expect(trigger).toBeFocused();
  }
  await page.getByRole('button', { name: '打开论文发表', exact: true }).click();
  await page.waitForTimeout(850);
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.waitForTimeout(850);
  await page.goForward();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile layout and directly linked section with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.screenshot({ path: '.preview/mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: '打开兴趣爱好', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: '.preview/mobile-detail.png', fullPage: true });
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#about');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: '果子', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '你好，我是果子，欢迎来到我的个人网站。' }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('.about-hero-photo')
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.screenshot({ path: '.preview/about-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: '.preview/about-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});
test('swimming metrics, dates, records and mobile layout', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#interests/swimming');
  await expect(page.locator('.swim-stats')).toContainText('6.5');
  await expect(page.locator('.swim-record')).toHaveCount(5);
  await expect(page.locator('.swim-selected')).toContainText('2026-09-24');
  await page.getByRole('button', { name: '09/10', exact: true }).click();
  await expect(page.locator('.swim-selected')).toContainText('1100 m');
  await page.getByRole('button', { name: '距离', exact: true }).click();
  await expect(page.getByRole('button', { name: '距离', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.locator('.swim-record summary').first().click();
  await expect(page.locator('.swim-record').first()).toContainText('1004');
  await page.screenshot({ path: '.preview/swimming-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.locator('.detail').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await page.screenshot({ path: '.preview/swimming-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(page.locator('.hobby-row')).toHaveCount(3);
});

test('responsive game pages, loaded assets and layered Escape', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto('/#interests/gaming');
    for (const id of ['devices', 'cs', 'hearthstone']) {
      const card = page.locator(`.game-${id}`);
      await card.locator('summary').click();
      for (const img of await card.locator('img').all()) {
        await img.scrollIntoViewIfNeeded();
        await img.evaluate((element) => (element as HTMLImageElement).decode());
      }
      expect(await page.locator('.detail').evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
        true,
      );
      await card.locator('.game-bottom-back').click();
      await expect(card.locator('summary')).toBeFocused();
      await card.locator('summary').click();
      await page.keyboard.press('Escape');
      await expect(card).not.toHaveAttribute('open', '');
      await expect(page.locator('.game-card')).toHaveCount(3);
    }
  }
  expect(errors).toEqual([]);
});

test('factory gateway, collection dossier and workshop preserve layered navigation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#factory');
  const left = page.locator('[data-door="atelier"]');
  const right = page.locator('[data-door="workshop"]');
  await expect(left).toBeVisible();
  const box = await left.boundingBox();
  await page.mouse.click(box!.x + box!.width * 0.25, box!.y + box!.height * 0.48);
  await page
    .getByRole('button', { name: '打开档案 01：Nesterov 流何时收敛到一点？', exact: true })
    .click();
  await expect(page.getByRole('img', { name: /五维评分雷达图/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /阅读原文/ })).toHaveAttribute(
    'href',
    /atelier\/P089.pdf/,
  );
  await page.reload();
  await expect(
    page.getByRole('heading', { name: /Point convergence and curvature selection/ }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: '打开档案 01：Nesterov 流何时收敛到一点？', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('region', { name: '匠心造收藏档案' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(left).toBeFocused();
  const rightBox = await right.boundingBox();
  await page.mouse.click(
    rightBox!.x + rightBox!.width * 0.76,
    rightBox!.y + rightBox!.height * 0.48,
  );
  await page.getByLabel('搜索论文').fill('P045');
  await expect(page.locator('[data-paper]')).toHaveCount(1);
  await page.locator('[data-paper="P045"]').click();
  await expect(page.getByRole('link', { name: /阅读原文/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('搜索论文')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(right).toBeFocused();
  await page.goForward();
  await expect(page.getByLabel('搜索论文')).toBeVisible();
});

test('site motion overrides system preference and mobile calligraphy loads', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '打开论文工厂', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0);
  const canvas = page.locator('canvas[data-particles="divider"]');
  await expect(canvas).toBeVisible();
  const snapshot = () => canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
  const first = await snapshot();
  await expect.poll(snapshot).not.toBe(first);
  await page.evaluate(() => document.fonts.load('78px "Factory Script"', '匠心造小作坊'));
  expect(
    await page.evaluate(() => document.fonts.check('78px "Factory Script"', '匠心造小作坊')),
  ).toBe(true);
  const heading = page.locator('[data-door="atelier"] h3');
  await expect(heading).toHaveCSS('font-size', '78px');
  await expect(heading).toHaveCSS('font-weight', '400');
  const toggle = page.getByRole('button', { name: '动态效果', exact: true });
  await expect(toggle).toBeHidden();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: '打开论文工厂', exact: true }).click();
  await expect(toggle).toBeHidden();
  await expect(canvas).toBeVisible();
  // Visibility precedes ResizeObserver initialization on slower CI machines.
  // Compare stationary pixels only after the backing store matches the layout.
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const c = element as HTMLCanvasElement;
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        return (
          c.clientWidth > 0 &&
          c.clientHeight > 0 &&
          c.width === Math.round(c.clientWidth * dpr) &&
          c.height === Math.round(c.clientHeight * dpr)
        );
      }),
    )
    .toBe(true);
  const stopped = await snapshot();
  await page.waitForTimeout(300);
  expect(await snapshot()).toBe(stopped);
  await page.reload();
  await expect(toggle).toBeHidden();
  const restarted = await snapshot();
  await expect.poll(snapshot).not.toBe(restarted);
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  for (const name of ['打开兴趣爱好', '打开论文发表', '打开兴趣造物', '打开自我介绍']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(toggle).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeVisible();
  }
  await page.goto('/paper-factory/');
  await expect(toggle).toBeHidden();
});
