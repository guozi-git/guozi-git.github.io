import { test, expect, type Page } from '@playwright/test';

async function clickVisibleReadingHome(page: Page) {
  const button = page.getByRole('button', { name: '回首页', exact: true });
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  // WebKit scrollIntoView on a zero-height sticky anchor moves the list unnecessarily.
  // Use the actual visible target, as a pointer user does, without an automation scroll.
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
}

for (const section of ['interests', 'publications', 'projects']) {
  test(`first ${section} entry has no overlapping inner fade`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const state = window as Window & { innerFades?: number };
      state.innerFades = 0;
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (...args: Parameters<Element['animate']>) {
        if (this.matches('.interests-content, .publications-content, .projects-content'))
          state.innerFades = (state.innerFades ?? 0) + 1;
        return animate.apply(this, args);
      };
    });
    const entrance = page.locator(`[data-section="${section}"]`);
    await entrance.focus();
    await page.waitForTimeout(700);
    await entrance.click();
    await expect(page.locator(`.${section}-content`)).toBeVisible();
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => (window as Window & { innerFades?: number }).innerFades)).toBe(
      0,
    );
  });
}

test('late section content fades once after the panel has opened', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const state = window as Window & { innerFades?: number };
    state.innerFades = 0;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args: Parameters<Element['animate']>) {
      if (this.matches('.interests-content')) state.innerFades = (state.innerFades ?? 0) + 1;
      return animate.apply(this, args);
    };
  });
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/_next/static/chunks/*.js', async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.locator('[data-section="interests"]').click();
    await expect(page.getByRole('status')).toBeVisible();
    await page.waitForTimeout(800);
  } finally {
    release();
  }
  await expect(page.locator('.hobby-row')).toHaveCount(3);
  await expect
    .poll(() => page.evaluate(() => (window as Window & { innerFades?: number }).innerFades))
    .toBe(1);
  await page.waitForTimeout(220);
  await expect(page.locator('.interests-content')).toHaveCSS('opacity', '1');
});

test('interest list position survives nested return and Home reentry', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/#interests');
  const gaming = page.locator('[data-hobby="gaming"]');
  await gaming.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const position = await page.locator('.detail').evaluate((el) => el.scrollTop);
  expect(position).toBeGreaterThan(100);
  await gaming.click();
  await page.getByRole('button', { name: '返回兴趣列表' }).click();
  await expect
    .poll(() => page.locator('.detail').evaluate((el) => el.scrollTop))
    .toBeCloseTo(position, 0);
  // Escape preserves the current viewport instead of scrolling to an offscreen Home button.
  await page.keyboard.press('Escape');
  await page.locator('[data-section="interests"]').click();
  await expect
    .poll(() => page.locator('.detail').evaluate((el) => el.scrollTop))
    .toBeCloseTo(position, 0);
});

test('leaving an interest detail directly does not overwrite its list position', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/');
  await page.locator('[data-section="interests"]').click();
  const gaming = page.locator('[data-hobby="gaming"]');
  await gaming.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const position = await page.locator('.detail').evaluate((el) => el.scrollTop);
  await gaming.click();
  await page.locator('.detail').evaluate((el) => {
    el.scrollTop = 600;
  });
  await clickVisibleReadingHome(page);
  await page.locator('[data-section="interests"]').click();
  await expect
    .poll(() => page.locator('.detail').evaluate((el) => el.scrollTop))
    .toBeCloseTo(position, 0);
});

test('workshop keeps filters across room reentry and can reset them', async ({ page }) => {
  await page.goto('/#factory/workshop');
  await page.getByLabel('搜索论文').fill('Nesterov');
  await page.getByLabel('研究方向').selectOption({ label: '数值分析与优化' });
  await page.getByRole('button', { name: '返回上一级', exact: true }).click();
  await page.locator('[data-door="workshop"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('搜索论文')).toHaveValue('Nesterov');
  await expect(page.getByLabel('研究方向')).toHaveValue('数值分析与优化');
  await page.getByRole('button', { name: '重置筛选', exact: true }).click();
  await expect(page.getByLabel('搜索论文')).toHaveValue('');
  await expect(page.getByLabel('研究方向')).toHaveValue('全部方向');
  await page.getByLabel('搜索论文').fill('Nesterov');
  await page.reload();
  await expect(page.getByLabel('搜索论文')).toHaveValue('');
});

test('workshop keeps expanded rows and scroll after Home reentry', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/#factory/workshop');
  await page.getByRole('button', { name: /显示更多/ }).click();
  await expect(page.locator('[data-paper]')).toHaveCount(40);
  await page.locator('[data-paper]').nth(24).scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const position = await page.locator('.detail').evaluate((el) => el.scrollTop);
  await clickVisibleReadingHome(page);
  await page.locator('[data-section="factory"]').click();
  await page.locator('[data-door="workshop"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-paper]')).toHaveCount(40);
  await expect
    .poll(() => page.locator('.detail').evaluate((el) => el.scrollTop))
    .toBeCloseTo(position, 0);
});

test('workshop catalog does not ship the complete manuscript library', async ({ page }) => {
  const scripts: Promise<Buffer>[] = [];
  page.on('response', (response) => {
    if (response.url().endsWith('.js')) scripts.push(response.body());
  });
  await page.goto('/#factory/workshop');
  await expect(page.getByLabel('搜索论文')).toBeVisible();
  const bodies = await Promise.all(scripts);
  expect(bodies.reduce((bytes, body) => bytes + body.length, 0)).toBeLessThan(700000);
  expect(bodies.map((body) => body.toString()).join('')).not.toContain('/papers/P088.pdf');
});

test('failed individual manuscript keeps the list return available', async ({ page }) => {
  await page.goto('/#factory/workshop');
  await page.getByLabel('搜索论文').fill('P062');
  await page.route('**/_next/static/chunks/*.js', (route) => route.abort());
  await page.locator('[data-paper="P062"]').click();
  await expect(page.getByText('论文内容未能载入，可返回列表或重新加载。')).toBeVisible();
  await page.getByRole('button', { name: '返回论文汇总' }).click();
  await expect(page.getByLabel('搜索论文')).toHaveValue('P062');
});

test('leaving a delayed manuscript cannot replace the current list', async ({ page }) => {
  await page.goto('/#factory/workshop');
  await page.getByLabel('搜索论文').fill('P062');
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/_next/static/chunks/*.js', async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.locator('[data-paper="P062"]').click();
    await expect(page.getByText('正在载入论文内容…')).toBeVisible();
    await page.getByRole('button', { name: '返回论文汇总' }).click();
  } finally {
    release();
  }
  await expect(page.getByLabel('搜索论文')).toHaveValue('P062');
  await page.waitForTimeout(200);
  await expect(page.getByRole('heading', { name: '研究论文', exact: true })).toBeVisible();
});

test('missing idle and network APIs still allow one conservative warmup', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: undefined, configurable: true });
    Object.defineProperty(window, 'requestIdleCallback', { value: undefined, configurable: true });
  });
  const scripts: Promise<string>[] = [];
  page.on('response', (response) => {
    if (response.url().endsWith('.js')) scripts.push(response.text());
  });
  await page.goto('/');
  await expect
    .poll(async () => (await Promise.all(scripts)).join('').includes('data-factory-view'), {
      timeout: 6000,
    })
    .toBe(true);
  expect((await Promise.all(scripts)).join('')).not.toContain('/papers/P088.pdf');
});

test('late startup removes the recovery notice and restores interaction', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/_next/static/chunks/*.js', async (route) => {
    await held;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'commit' });
  try {
    await expect(page.locator('#site-startup-recovery')).toBeVisible({ timeout: 15000 });
  } finally {
    release();
  }
  await expect(page.locator('#site-startup-recovery')).toHaveCount(0);
  await page.locator('[data-section="publications"]').click();
  await expect(page.locator('.publication-card')).toHaveCount(3);
  expect(errors).toEqual([]);
});

for (const width of [320, 390, 768, 1440]) {
  test(`main sections remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const [hash, selector] of [
      ['interests', '.hobby-row'],
      ['publications', '.publication-card'],
      ['projects', '.project-card'],
      ['factory/workshop', '[data-paper="P046"]'],
      ['factory/atelier/P089', 'article header h2'],
    ]) {
      await page.goto(`/#${hash}`);
      await expect(page.locator(selector).first()).toBeVisible();
      expect(
        await page.evaluate(() => {
          const panel = document.querySelector('.detail');
          return (
            document.documentElement.scrollWidth > innerWidth + 1 ||
            (!!panel && panel.scrollWidth > panel.clientWidth + 1)
          );
        }),
      ).toBe(false);
      if (hash === 'publications' && width >= 768) {
        const tops = await page
          .locator('.publication-card')
          .evaluateAll((cards) =>
            cards.map((card) => Math.round(card.getBoundingClientRect().top)),
          );
        expect(new Set(tops).size).toBe(1);
      }
    }
    expect(errors).toEqual([]);
  });
}

test('core script failure shows a usable recovery action without React', async ({ page }) => {
  await page.clock.install();
  await page.route('**/_next/static/chunks/*.js', (route) => route.abort());
  await page.goto('/');
  await page.clock.fastForward(12500);
  await expect(page.locator('#site-startup-recovery')).toBeVisible();
  await expect(page.locator('#site-startup-recovery button')).toHaveText('重新加载');
});

test('stalled section offers recovery but late content can still arrive', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '动态效果' }).click();
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/_next/static/chunks/*.js', async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.getByRole('button', { name: '打开论文发表', exact: true }).click();
    await expect(page.getByRole('button', { name: '重新加载此页', exact: true })).toBeVisible({
      timeout: 12000,
    });
  } finally {
    release();
  }
  await expect(page.locator('.publication-card')).toHaveCount(3);
  await expect(page.getByRole('button', { name: '重新加载此页', exact: true })).toHaveCount(0);
});

test('home does not block first paint on the full review stylesheet', async ({ page }) => {
  const css: Promise<string>[] = [];
  page.on('response', (r) => {
    if (r.url().endsWith('.css')) css.push(r.text());
  });
  await page.goto('/');
  const styles = (await Promise.all(css)).join('');
  expect(styles.includes('scoreItem')).toBe(false);
  expect(styles.includes('.swim-page')).toBe(false);
  expect(Buffer.byteLength(styles)).toBeLessThan(50000);
});

test('paper source action has a comfortable touch target', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#publications/grid-dissociation');
  const link = page.getByRole('link', { name: '出版社页面' });
  await expect(link).toBeVisible();
  await expect
    .poll(() => link.evaluate((el) => el.getBoundingClientRect().height))
    .toBeGreaterThanOrEqual(44);
});

test('factory particles wait for the entrance transform before starting their loop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => {
    const state = window as unknown as Window & { particleFrames: number };
    state.particleFrames = 0;
    const raf = window.requestAnimationFrame.bind(window);
    let inFrame = false;
    window.requestAnimationFrame = (callback) =>
      raf((time) => {
        inFrame = true;
        try {
          callback(time);
        } finally {
          inFrame = false;
        }
      });
    const fill = CanvasRenderingContext2D.prototype.fill;
    CanvasRenderingContext2D.prototype.fill = function (
      this: CanvasRenderingContext2D,
      ...args: unknown[]
    ) {
      if (
        inFrame &&
        this.canvas.matches('[data-particles]') &&
        document
          .querySelector('.detail')
          ?.getAnimations()
          .some((a) => a.playState === 'running')
      )
        state.particleFrames++;
      return Reflect.apply(fill, this, args);
    };
  });
  await page.locator('[data-section="factory"]').click();
  await expect(page.locator('[data-particles="divider"]')).toBeVisible();
  await page.locator('.detail').evaluate(async (el) => {
    await Promise.all(el.getAnimations().map((a) => a.finished.catch(() => {})));
  });
  expect(
    await page.evaluate(() => (window as Window & { particleFrames?: number }).particleFrames),
  ).toBe(0);
});

test('particle motion resumes after entry and pauses while the document is hidden', async ({
  page,
}) => {
  await page.goto('/#factory');
  await expect(page.locator('[data-particles="divider"]')).toBeVisible();
  await page.evaluate(() => {
    const state = window as Window & { draws?: number };
    state.draws = 0;
    const fill = CanvasRenderingContext2D.prototype.fill;
    CanvasRenderingContext2D.prototype.fill = function (
      this: CanvasRenderingContext2D,
      ...args: unknown[]
    ) {
      if (this.canvas.matches('[data-particles]')) state.draws = (state.draws ?? 0) + 1;
      return Reflect.apply(fill, this, args);
    };
  });
  const draws = () => page.evaluate(() => (window as Window & { draws?: number }).draws ?? 0);
  await expect.poll(draws).toBeGreaterThan(1000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const paused = await draws();
  await page.waitForTimeout(200);
  expect(await draws()).toBe(paused);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(draws).toBeGreaterThan(paused);
});
