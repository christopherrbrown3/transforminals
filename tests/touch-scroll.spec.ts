import { expect, test, type Locator, type Page } from '@playwright/test';

test.use({ hasTouch: true, viewport: { width: 844, height: 390 } });

type TestGame = {
  rescueAll: () => void;
  snapshot: () => { form: string; player: { y: number } };
};

async function activate(page: Page, control: Locator) {
  if (test.info().project.use.hasTouch) await control.tap();
  else await control.click();
}

async function swipeOrWheel(page: Page, target: Locator, distance = 190) {
  const bounds = await target.boundingBox();
  if (!bounds) throw new Error('Expected a visible scroll surface');
  const x = Math.round(bounds.x + Math.min(bounds.width / 2, 80));
  const y = Math.round(bounds.y + Math.min(bounds.height * 0.72, bounds.height - 20));
  const swipeDistance = Math.min(distance, y - 8);

  if (test.info().project.name === 'chromium') {
    const session = await page.context().newCDPSession(page);
    try {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y, id: 1 }],
      });
      for (let step = 1; step <= 12; step++) {
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x, y: y - (swipeDistance * step) / 12, id: 1 }],
        });
        await page.waitForTimeout(12);
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally {
      await session.detach();
    }
  } else {
    // Playwright's mobile WebKit profile has tap but no drag API. Keep this a
    // scripted scrolling check and reserve trusted finger-like swipes for Chromium.
    await target.evaluate((el, amount) => el.scrollBy({ top: amount, behavior: 'auto' }), distance);
  }
}

async function startWithCollection(page: Page) {
  await page.goto(process.env.CI ? '/?test=1&software=1' : '/?test=1');
  await expect(page.locator('#start-button')).toBeVisible();
  await activate(page, page.locator('#start-button'));
  await expect(page.locator('#star-button')).toBeVisible();
  await page.evaluate(() => {
    const game = (window as unknown as { __game?: TestGame }).__game;
    if (!game) throw new Error('Test API was not enabled by ?test=1');
    game.rescueAll();
  });
  await expect(page.locator('#forms [data-form]')).toHaveCount(23);
}

test('form list and collection/settings panels scroll without capturing taps or game controls', async ({
  page,
}) => {
  await startWithCollection(page);

  const forms = page.locator('#forms');
  const firstForm = page.locator('#forms [data-form="human"]');
  const formScroll = await forms.evaluate((el) => ({
    scroll: getComputedStyle(el).overflowY,
    touch: getComputedStyle(el).touchAction,
    height: el.clientHeight,
    content: el.scrollHeight,
  }));
  expect(formScroll.scroll).toBe('auto');
  expect(formScroll.touch).toBe('pan-y');
  expect(formScroll.content).toBeGreaterThan(formScroll.height);
  expect(await firstForm.evaluate((el) => getComputedStyle(el).touchAction)).toBe('pan-y');
  expect(
    await page.locator('#star-button').evaluate((el) => getComputedStyle(el).touchAction),
  ).toBe('none');
  expect(
    await page.locator('[data-move="forward"]').evaluate((el) => getComputedStyle(el).touchAction),
  ).toBe('none');

  await swipeOrWheel(page, forms);
  await expect.poll(() => forms.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { __game: TestGame }).__game.snapshot().form),
    )
    .toBe('human');

  await forms.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const beforeTransform = await forms.evaluate((el) => el.scrollTop);
  const lastForm = page.locator('#forms [data-form="giant-cow"]');
  await expect(lastForm).toBeInViewport();
  await activate(page, lastForm);
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { __game: TestGame }).__game.snapshot().form),
    )
    .toBe('giant-cow');
  expect(await forms.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  expect(Math.abs((await forms.evaluate((el) => el.scrollTop)) - beforeTransform)).toBeLessThan(2);

  const collectionButton = page.locator('#collection-button');
  await collectionButton.focus();
  await activate(page, collectionButton);
  const panel = page.locator('.panel');
  await expect(panel).toBeVisible();
  const panelScroll = await panel.evaluate((el) => ({
    overflow: getComputedStyle(el).overflowY,
    touch: getComputedStyle(el).touchAction,
    height: el.clientHeight,
    content: el.scrollHeight,
  }));
  expect(panelScroll.overflow).toBe('auto');
  expect(panelScroll.touch).toBe('pan-y');
  expect(panelScroll.content).toBeGreaterThan(panelScroll.height);
  expect(
    await page
      .locator('.collection-grid button')
      .first()
      .evaluate((el) => getComputedStyle(el).touchAction),
  ).toBe('pan-y');

  await swipeOrWheel(page, panel, 210);
  await expect.poll(() => panel.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  const scrolledPanel = await panel.evaluate((el) => el.scrollTop);
  await page.waitForTimeout(180);
  expect(await panel.evaluate((el) => el.scrollTop)).toBeGreaterThanOrEqual(scrolledPanel);
  await activate(page, page.locator('#close-panel'));
  await expect
    .poll(() => page.evaluate(() => (document.activeElement as HTMLElement | null)?.id))
    .toBe('collection-button');

  await activate(page, page.locator('#pause-button'));
  const settingsPanel = page.locator('.panel');
  await expect(settingsPanel).toBeVisible();
  await expect
    .poll(() => settingsPanel.evaluate((el) => el.scrollHeight > el.clientHeight))
    .toBe(true);
  await swipeOrWheel(page, settingsPanel, 150);
  await expect.poll(() => settingsPanel.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await activate(page, page.locator('#resume-button'));

  await activate(page, page.locator('#star-button'));
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { __game: TestGame }).__game.snapshot().player.y),
    )
    .toBeGreaterThan(0.5);
});
