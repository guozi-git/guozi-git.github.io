import { test, expect } from '@playwright/test';

for (const section of ['interests', 'publications', 'projects', 'factory']) {
  test(`entrance stays stable while ${section} finishes loading`, async ({ page }) => {
    await page.goto('/');
    let release!: () => void;
    const download = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/_next/static/chunks/*.js', async (route) => {
      await download;
      await route.continue();
    });
    try {
      await page.locator(`[data-section="${section}"]`).press('Enter');
      const panel = page.getByRole('dialog');
      await expect(page.getByRole('status')).toBeVisible();
      const before = await panel.evaluate((el) => ({
        height: (el as HTMLElement).offsetHeight,
        top: (el as HTMLElement).offsetTop,
        background: getComputedStyle(el.parentElement!).backgroundColor,
      }));
      release();
      await expect(page.getByRole('status')).toHaveCount(0);
      const after = await panel.evaluate((el) => ({
        height: (el as HTMLElement).offsetHeight,
        top: (el as HTMLElement).offsetTop,
        background: getComputedStyle(el.parentElement!).backgroundColor,
      }));
      expect(after).toEqual(before);
      expect(after.background).toBe('rgb(7, 18, 33)');
    } finally {
      release();
    }
  });
}

test('earth is preloaded once using the exact displayed image', async ({ page }) => {
  await page.goto('/');
  const preload = page.locator('link[rel="preload"][as="image"][href*="nasa-earth"]');
  await expect(preload).toHaveCount(1);
  const href = await preload.getAttribute('href');
  expect(
    await page.locator('.orbit-earth').evaluate((el) => getComputedStyle(el).backgroundImage),
  ).toContain(href);
  expect(
    await page.evaluate(
      () =>
        performance
          .getEntriesByType('resource')
          .filter((entry) => entry.name.includes('nasa-earth')).length,
    ),
  ).toBe(1);
});

test('factory entrance does not download manuscript data before choosing a room', async ({
  page,
}) => {
  const scripts: Promise<string>[] = [];
  page.on('response', (response) => {
    if (response.url().endsWith('.js')) scripts.push(response.text());
  });
  await page.goto('/');
  await page.getByRole('button', { name: '打开论文工厂', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-door="workshop"]')).toBeVisible();
  expect((await Promise.all(scripts)).join('\n').includes('/papers/P088.pdf')).toBe(false);
  await page.locator('[data-door="workshop"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-paper="P046"]')).toBeVisible();
});

for (const [network, shouldWarm] of [
  [{ effectiveType: '4g', saveData: false, downlink: 10, rtt: 50 }, true],
  [{ effectiveType: '4g', saveData: true, downlink: 10, rtt: 50 }, false],
  [{ effectiveType: '3g', saveData: false, downlink: 0.8, rtt: 300 }, false],
  [{ effectiveType: '4g', saveData: false, downlink: 0.8, rtt: 50 }, false],
  [{ effectiveType: '', saveData: false, downlink: 10, rtt: 50 }, false],
] as const) {
  test(`idle preload respects network ${JSON.stringify(network)}`, async ({ page }) => {
    await page.addInitScript((connection) => {
      Object.defineProperty(navigator, 'connection', { value: connection, configurable: true });
    }, network);
    const scripts: Promise<string>[] = [];
    page.on('response', (response) => {
      if (response.url().endsWith('.js')) scripts.push(response.text());
    });
    await page.goto('/');
    if (shouldWarm) {
      await expect
        .poll(async () => (await Promise.all(scripts)).join('\n').includes('data-factory-view'))
        .toBe(true);
    } else {
      await page.waitForTimeout(2500);
      expect((await Promise.all(scripts)).join('\n')).not.toContain('data-factory-view');
    }
    expect((await Promise.all(scripts)).join('\n').includes('/papers/P088.pdf')).toBe(false);
  });
}

test('slow section download has readable loading feedback', async ({ page }) => {
  await page.goto('/');
  let release!: () => void;
  const download = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/_next/static/chunks/*.js', async (route) => {
    await download;
    await route.continue();
  });
  try {
    await page.getByRole('button', { name: '打开论文发表', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('正在载入论文发表…');
  } finally {
    release();
  }
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('Escape remains available while the atelier is downloading', async ({ page }) => {
  await page.goto('/#factory');
  await expect(page.locator('[data-door="atelier"]')).toBeVisible();
  let release!: () => void;
  const download = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/_next/static/chunks/*.js', async (route) => {
    await download;
    await route.continue();
  });
  try {
    await page.locator('[data-door="atelier"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toHaveText('正在载入匠心造…');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-door="atelier"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toHaveText('正在载入匠心造…');
    for (const key of ['Tab', 'Shift+Tab']) {
      await page.keyboard.press(key);
      expect(
        await page.getByRole('dialog').evaluate((el) => el.contains(document.activeElement)),
      ).toBe(true);
    }
  } finally {
    release();
  }
});

test('leaving the homepage cancels speculative factory loading', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      value: { effectiveType: '4g', saveData: false, downlink: 10, rtt: 50 },
    });
  });
  const scripts: Promise<string>[] = [];
  page.on('response', (response) => {
    if (response.url().endsWith('.js')) scripts.push(response.text());
  });
  await page.goto('/');
  await page.getByRole('button', { name: '打开论文发表', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  expect((await Promise.all(scripts)).join('\n').includes('data-factory-view')).toBe(false);
});

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

test('both grade guides are fixed open and ordered from high to low', async ({ page }) => {
  for (const hash of ['#factory/scoring', '#factory/atelier/scoring']) {
    await page.goto(`/${hash}`);
    await expect(page.getByRole('table')).toHaveCount(5);
    await expect(page.locator('details, summary')).toHaveCount(0);
    const tables = page.getByRole('table');
    for (const [index, expected] of [
      [0, ['S6', 'S5', 'S4', 'S3', 'S2', 'S1', 'S0']],
      [1, ['C4', 'C3', 'C2', '待核验']],
      [2, ['O4', 'O3', 'O2', 'O1', '待定']],
    ] as const) {
      const labels = await tables.nth(index).getByRole('rowheader').allTextContents();
      expect(labels.map((label) => label.split(' · ')[0])).toEqual(expected);
    }
  }
});

test('failed section keeps navigation and offers explicit recovery', async ({ page }) => {
  await page.goto('/');
  await page.route('**/_next/static/chunks/*.js', (route) => route.abort('failed'));
  await page.locator('[data-section="projects"]').press('Enter');
  await expect(page.getByRole('alert', { name: '内容加载失败' })).toContainText(
    '兴趣造物暂时无法载入',
  );
  await expect(page.getByRole('button', { name: '重新加载此页' })).toBeFocused();
  await page.getByRole('button', { name: '返回上一级', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('[data-section="projects"]').press('Enter');
  await expect(page.getByRole('alert', { name: '内容加载失败' })).toBeVisible();
  await page.unroute('**/_next/static/chunks/*.js');
  await page.getByRole('button', { name: '重新加载此页' }).click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(page.getByRole('alert', { name: '内容加载失败' })).toHaveCount(0);
  await expect(page.locator('[role=status]')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toBeVisible();
});

for (const [room, name] of [
  ['atelier', '匠心造'],
  ['workshop', '小作坊'],
]) {
  test(`failed ${room} keeps factory navigation`, async ({ page }) => {
    await page.goto('/#factory');
    await expect(page.locator(`[data-door="${room}"]`)).toBeVisible();
    await page.route('**/_next/static/chunks/*.js', (route) => route.abort('failed'));
    await page.locator(`[data-door="${room}"]`).press('Enter');
    await expect(page.getByRole('alert', { name: '内容加载失败' })).toContainText(
      `${name}暂时无法载入`,
    );
    await page.keyboard.press('Escape');
    await expect(page.locator(`[data-door="${room}"]`)).toBeFocused();
  });
}

test('portrait uses a smaller responsive source and retains the original detail photo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const photo = page.locator('.portrait-photo');
  await expect(photo).toHaveAttribute('srcset', /320w/);
  await expect
    .poll(() => photo.evaluate((e) => (e as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  expect(await photo.evaluate((e) => (e as HTMLImageElement).currentSrc)).toContain('portrait-320');
  await page.locator('[data-section="about"]').press('Enter');
  await expect(page.locator('.about-hero-photo')).toHaveAttribute('src', /guozi.jpg/);
});

test('large high density portrait retains enough source pixels', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  try {
    await page.goto('/');
    await expect
      .poll(() =>
        page.locator('.portrait-photo').evaluate((e) => (e as HTMLImageElement).currentSrc),
      )
      .toContain('guozi.jpg');
  } finally {
    await context.close();
  }
});

test('factory download error clears the Home control on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.route('**/_next/static/chunks/*.js', (route) => route.abort('failed'));
  await page.locator('[data-section="factory"]').press('Enter');
  const error = page.getByRole('alert', { name: '内容加载失败' });
  await expect(error).toContainText('论文工厂暂时无法载入');
  await expect
    .poll(async () => {
      const heading = await error.getByRole('heading').boundingBox();
      const home = await page.getByRole('button', { name: 'Home', exact: true }).boundingBox();
      return heading!.y - home!.y - home!.height;
    })
    .toBeGreaterThanOrEqual(8);
});

test('new mechanics manuscripts use English originals and a separate filter', async ({ page }) => {
  await page.goto('/#factory/workshop');
  await page.getByRole('combobox', { name: '研究方向' }).selectOption('数学力学与非线性动力学');
  await expect(page.locator('[data-paper]')).toHaveCount(2);
  await expect(page.locator('[data-paper="P092"]')).toContainText('核心贡献 C-S3');
  await expect(page.locator('[data-paper="P093"]')).toContainText('核心贡献 C-S3');
  await expect(page.locator('[data-paper="P092"]')).toContainText(
    'Rigidity of homogeneous mechanical families',
  );
  await expect(page.locator('[data-paper="P093"]')).toContainText('Invariant-average kernels');
});

for (const [id, score, title, hash] of [
  [
    'P092',
    '83.80',
    'Rigidity of homogeneous mechanical families with common invariant force means',
    '1ef429480f684832',
  ],
  [
    'P093',
    '78.10',
    'Invariant-average kernels and deformation obstructions for a quartic Hamiltonian',
    '70b7fb9c0f2aaa14',
  ],
]) {
  test(`mechanics detail ${id} preserves review and PDF`, async ({ page }) => {
    await page.goto(`/#factory/${id}`);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    const assessment = page.getByRole('region', { name: '研究评价' });
    await expect(assessment).toContainText(score);
    const core = assessment
      .locator('section')
      .filter({ has: page.getByText('最重要的已核结果', { exact: true }) });
    await expect(core).toContainText('C-S3');
    await expect(core).not.toContainText('/ 100');
    await expect(page.getByRole('region', { name: '评分依据' }).locator('dt')).toHaveCount(5);
    await expect(page.getByRole('link', { name: '阅读原文' })).toHaveAttribute(
      'href',
      new RegExp(`/papers/${id}\\.pdf\\?v=${hash}`),
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
