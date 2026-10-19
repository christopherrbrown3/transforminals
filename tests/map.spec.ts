import { expect, test, type Page } from '@playwright/test';

type TestGame = {
  snapshot: () => { biome: string; rescued: string[] };
  travel: (id: string) => void;
  teleport: (x: number, z: number) => void;
  rescueAll: () => void;
};

const regions = [
  ['meadow', 1],
  ['winter', 1],
  ['savannah', 4],
  ['desert', 1],
  ['beach', 1],
  ['ocean', 6],
  ['volcano', 1],
  ['underground', 1],
  ['rifts', 1],
  ['city', 5],
] as const;

async function start(page: Page) {
  await page.goto(process.env.CI ? '/?test=1&software=1' : '/?test=1');
  const startButton = page.locator('#start-button');
  await expect(startButton).toBeVisible();
  if (test.info().project.use.hasTouch) await startButton.tap();
  else await startButton.click();
  await expect(page.locator('#map-button')).toBeVisible();
}

async function activate(page: Page, selector: string) {
  const control = page.locator(selector);
  if (test.info().project.use.hasTouch) await control.tap();
  else await control.click();
}

async function game(page: Page, action: 'travel' | 'rescueAll', value?: string) {
  await page.evaluate(
    ({ action: command, value: argument }) => {
      const api = (window as unknown as { __game?: TestGame }).__game;
      if (!api) throw new Error('Test API was not enabled by ?test=1');
      if (command === 'travel') api.travel(argument!);
      else api.rescueAll();
    },
    { action, value },
  );
}

async function openMap(page: Page) {
  await activate(page, '#map-button');
  return page.getByRole('dialog', { name: 'World map' });
}

async function currentBiome(page: Page) {
  return page.evaluate(() => {
    const api = (window as unknown as { __game?: TestGame }).__game;
    if (!api) throw new Error('Test API was not enabled by ?test=1');
    return api.snapshot().biome;
  });
}

test('shows required animal counts and one truthful current-location marker for every region', async ({
  page,
}) => {
  await start(page);
  let map = await openMap(page);
  await expect(map.locator('[data-travel]')).toHaveCount(regions.length);
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#home-button')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#close-panel')).toBeFocused();

  for (const [biome, remaining] of regions) {
    const card = map.locator(`[data-travel="${biome}"]`);
    const friends = remaining === 1 ? 'friend' : 'friends';
    await expect(card.locator('small')).toHaveText(`${remaining} ${friends} to rescue`);
    if (biome === 'meadow') await expect(card).toBeEnabled();
    else await expect(card).toBeDisabled();
  }

  const current = map.locator('[data-travel][data-current="true"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveAttribute('data-travel', 'meadow');
  await expect(current).toHaveAttribute('aria-current', 'location');
  await expect(current.getByText('You are here', { exact: true })).toBeVisible();
  await expect(map.locator('[aria-current="location"]')).toHaveCount(1);

  await activate(page, '#close-panel');
  await expect(page.locator('#map-button')).toBeFocused();

  // Rescue the Meadow fox through the normal star control; the map must reflect the save.
  await page.evaluate(() => {
    const api = (window as unknown as { __game?: TestGame }).__game;
    if (!api) throw new Error('Test API was not enabled by ?test=1');
    api.teleport(-7, -9);
  });
  const star = page.locator('#star-button');
  if (test.info().project.use.hasTouch) await star.tap();
  else await star.click();
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const api = (window as unknown as { __game?: TestGame }).__game;
          return api?.snapshot().rescued.includes('fox') ?? false;
        }),
      { timeout: process.env.CI ? 15_000 : 8_000 },
    )
    .toBe(true);

  map = await openMap(page);
  await expect(map.locator('[data-travel="meadow"] small')).toHaveText('All friends rescued');
  await expect(map.locator('[data-travel="winter"] small')).toHaveText('1 friend to rescue');
});

test('updates all remaining counts when the required set is complete', async ({ page }) => {
  await start(page);
  await game(page, 'rescueAll');
  const map = await openMap(page);
  for (const [biome] of regions)
    await expect(map.locator(`[data-travel="${biome}"] small`)).toHaveText('All friends rescued');
});

test('fast travel updates the marker, restores focus, and remains reachable in landscape', async ({
  page,
}) => {
  await start(page);
  // Make Desert visited, then return to Meadow so the map card is an enabled, real destination.
  await game(page, 'travel', 'desert');
  await game(page, 'travel', 'meadow');

  for (const [index, viewport] of [
    { width: 844, height: 390 },
    { width: 1194, height: 834 },
  ].entries()) {
    await page.setViewportSize(viewport);
    const map = await openMap(page);
    await expect(map.locator('[data-travel="desert"]')).toBeEnabled();
    await expect(map.locator('[data-travel="meadow"][data-current="true"]')).toHaveAttribute(
      'aria-current',
      'location',
    );

    const bounds = await page.locator('#close-panel').boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);

    const home = map.locator('#home-button');
    await home.scrollIntoViewIfNeeded();
    await expect(home).toBeVisible();
    const homeBounds = await home.boundingBox();
    expect(homeBounds).not.toBeNull();
    expect(homeBounds!.x).toBeGreaterThanOrEqual(0);
    expect(homeBounds!.y).toBeGreaterThanOrEqual(0);
    expect(homeBounds!.x + homeBounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(homeBounds!.y + homeBounds!.height).toBeLessThanOrEqual(viewport.height);

    const destination = map.locator('[data-travel="desert"]');
    await destination.scrollIntoViewIfNeeded();
    if (index === 0) {
      await destination.focus();
      await page.keyboard.press('Space');
    } else if (test.info().project.use.hasTouch) await destination.tap();
    else await destination.click();
    await expect.poll(() => currentBiome(page)).toBe('desert');
    await expect(page.locator('#map-button')).toBeFocused();

    const reopened = await openMap(page);
    await expect(reopened.locator('[data-travel="desert"][data-current="true"]')).toHaveAttribute(
      'aria-current',
      'location',
    );
    await expect(reopened.locator('[data-travel="meadow"][data-current="true"]')).toHaveCount(0);
    await activate(page, '#close-panel');
    await expect(page.locator('#map-button')).toBeFocused();

    const finalMap = await openMap(page);
    const returnHome = finalMap.locator('#home-button');
    await returnHome.scrollIntoViewIfNeeded();
    if (test.info().project.use.hasTouch) await returnHome.tap();
    else await returnHome.click();
    await expect.poll(() => currentBiome(page)).toBe('meadow');
    await expect(page.locator('#map-button')).toBeFocused();
  }
});
