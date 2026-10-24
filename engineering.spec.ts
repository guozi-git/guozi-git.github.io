import { test, expect } from '@playwright/test';

test('paper metadata and copy link follow the current paper and reset on return', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          document.documentElement.dataset.copied = text;
        },
      },
    });
  });
  for (const [hash, heading, back] of [
    ['#publications/grid-dissociation', '.paper-detail h3', '返回论文列表'],
    ['#factory/P062', 'article > h3', '返回论文汇总'],
    ['#factory/atelier/P089', 'article header h2', '返回收藏目录'],
  ]) {
    await page.goto('/');
    const defaultDescription = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    await page.goto('/' + hash);
    const title = await page.locator(heading).first().textContent();
    await expect(page).toHaveTitle(title!.trim() + ' · 果子');
    await expect(page.locator('meta[name="citation_title"]')).toHaveAttribute(
      'content',
      title!.trim(),
    );
    await expect(page.locator('meta[name="description"]')).not.toHaveAttribute(
      'content',
      defaultDescription!,
    );
    await page.getByRole('button', { name: '复制论文链接', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: '论文链接已复制' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-copied', page.url());
    await page.getByRole('button', { name: back, exact: false }).first().click();
    await expect(page.locator('meta[name="citation_title"]')).toHaveCount(0);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      defaultDescription!,
    );
  }
});

test('copy failure provides a selectable link', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new Error('denied');
        },
      },
    }),
  );
  await page.goto('/#publications/grid-dissociation');
  await page.getByRole('button', { name: '复制论文链接', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '论文链接', exact: true })).toHaveValue(
    page.url(),
  );
});

test('long mobile pages keep an operable return action at the bottom', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [hash, label, destination] of [
    ['#interests/swimming', '返回兴趣列表', '#interests'],
    ['#factory/P062', '返回论文汇总', '#factory/workshop'],
  ]) {
    await page.goto(`/${hash}`);
    await expect(page.getByRole('button', { name: label, exact: false }).first()).toBeVisible();
    await page.locator('.detail').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    const bar = page.getByRole('navigation', { name: '阅读导航' });
    await expect(bar).toBeVisible();
    await bar.getByRole('button', { name: label, exact: false }).click();
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
  }
});

test('mobile chart labels remain readable and heading leaves room for content', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#interests/swimming');
  await expect(page.locator('.swim-chart')).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('.swim-chart text')
        .first()
        .evaluate((el) => el.getBoundingClientRect().height),
    )
    .toBeGreaterThanOrEqual(12);
  expect(
    await page.locator('.detail-hero').evaluate((el) => el.getBoundingClientRect().height),
  ).toBeLessThanOrEqual(135);
});

test('nested swimming and CS text retain readable contrast on dark surfaces', async ({ page }) => {
  const luminance = (color: string) => {
    const channels = color
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((value) => {
        const c = value / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  for (const section of ['swimming', 'gaming']) {
    await page.goto(`/#interests/${section}`);
    if (section === 'gaming') await page.locator('.game-cs > summary').click();
    const targets =
      section === 'swimming'
        ? ['.swim-heading h3', '.swim-record-heading h4', '.swim-record summary']
        : ['.cs-favorite h6'];
    const surface = section === 'swimming' ? '.swim-chart-card' : '.cs-favorite';
    const background = await page
      .locator(surface)
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    for (const selector of targets) {
      const text = await page
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).color);
      expect(
        (Math.max(luminance(text), luminance(background)) + 0.05) /
          (Math.min(luminance(text), luminance(background)) + 0.05),
        selector,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test('three interior pages keep readable titles and fit narrow screens', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const section of ['interests', 'publications', 'projects']) {
      await page.goto(`/#${section}`);
      const panel = page.getByRole('dialog');
      await expect(
        panel.locator('.hobby-row, .publication-card, .project-card').first(),
      ).toBeVisible();
      expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      if (section === 'publications') {
        if (width >= 768) {
          const positions = await panel.locator('.publication-card').evaluateAll((cards) =>
            cards.map((card) => ({
              x: card.getBoundingClientRect().x,
              y: card.getBoundingClientRect().y,
            })),
          );
          expect(Math.abs(positions[0].y - positions[2].y)).toBeLessThan(1);
          expect(positions[0].x).toBeLessThan(positions[1].x);
          expect(positions[1].x).toBeLessThan(positions[2].x);
        }
        await expect(
          panel.getByRole('heading', {
            name: '棋盘上，有多少种选法？',
            exact: true,
          }),
        ).toBeVisible();
        const title = panel.locator('.publication-card h3').last();
        expect(await title.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        expect(
          await title.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
        ).toBeGreaterThanOrEqual(18);
        await expect(panel.getByText('预印本 · 已投稿', { exact: true })).toBeVisible();
      }
    }
  }
});

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

for (const [id, area, journal] of [
  ['P062', '非扩张算子迭代与变分分析', 'Set-Valued and Variational Analysis'],
  ['P066', '博弈学习与势博弈均衡选择', 'International Journal of Game Theory'],
  ['P061', '随机数值动力学与Langevin采样', 'Journal of Theoretical Probability'],
  ['P092', '齐次Hamilton力学与有限形变刚性', 'Nonlinearity'],
]) {
  test(`subject-specific journal fit ${id}`, async ({ page }) => {
    await page.goto(`/#factory/${id}`);
    const journals = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: '期刊定位', exact: true }) })
      .last();
    await expect(journals).not.toContainText(area);
    await expect(journals.locator('dd').first()).toHaveText(journal);
    await expect(journals.locator('dd')).not.toContainText(['（', '（', '（']);
    await expect(journals.locator('dt')).toHaveText(['首选', '备选', '挑战目标']);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
