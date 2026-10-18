import { expect, test, type Page } from '@playwright/test';

type GameSnapshot = {
  state: string;
  biome: string;
  form: string;
  rescued: string[];
  defeated: string[];
  player: { x: number; y: number; z: number; vy: number };
  boss: { id: string; hits: number; total: number; height: number } | null;
  renderer: { calls: number; triangles: number; geometries: number; textures: number };
};

declare global {
  interface Window {
    __game?: {
      snapshot: () => GameSnapshot;
      teleport: (x: number, z: number) => void;
      travel: (id: string) => void;
      rescueAll: () => void;
      setBossHits: (hits: number) => void;
      setPlayer: (player: { x: number; y: number; z: number; vy: number }) => void;
      save: () => void;
    };
  }
}

async function startGame(page: Page) {
  await page.goto('/?test=1');
  await expect(page.locator('#start-button')).toBeVisible();
  await activate(page, page.locator('#start-button'));
  await expect(page.locator('#star-button')).toBeVisible();
  await expect(page.locator('#rescue-count')).toBeVisible();
}

async function activate(page: Page, control: ReturnType<Page['locator']>) {
  if (test.info().project.use.hasTouch) await control.tap();
  else await control.click();
}

async function snapshot(page: Page) {
  return page.evaluate(() => {
    if (!window.__game) throw new Error('Test game API was not enabled by ?test=1');
    return window.__game.snapshot();
  });
}

test('starts in Meadow and moves through the visible touch controls', async ({ page }) => {
  await startGame(page);

  const initial = await snapshot(page);
  expect(initial.biome).toBe('meadow');
  expect(initial.form).toBe('human');

  await page.locator('#collection-button').click();
  await expect(page.locator('[data-choose="fox"]')).toBeDisabled();
  await page.getByRole('button', { name: 'Close' }).click();

  const right = page.locator('[data-move="right"]');
  await expect(right).toBeVisible();
  await right.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    button: 0,
  });
  await page.waitForTimeout(350);
  await right.dispatchEvent('pointerup', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    button: 0,
  });

  await expect.poll(async () => (await snapshot(page)).player.x).not.toBe(initial.player.x);
});

test('rescues the first cage with the star button and keeps the fox after reload', async ({
  page,
}) => {
  await startGame(page);

  await page.evaluate(() => window.__game!.teleport(-7, -9));
  await activate(page, page.locator('#star-button'));
  await expect
    .poll(async () => (await snapshot(page)).rescued.includes('fox'), { timeout: 6_000 })
    .toBe(true);
  await expect(page.locator('#rescue-count')).toHaveText('1 / 22');

  await page.evaluate(() => window.__game!.teleport(-7, -9));
  await activate(page, page.locator('#star-button'));
  await page.waitForTimeout(900);
  await expect(page.locator('#rescue-count')).toHaveText('1 / 22');

  const foxButton = page.locator('[data-form="fox"]');
  await expect(foxButton).toBeVisible();
  await activate(page, foxButton);
  await expect.poll(async () => (await snapshot(page)).form).toBe('fox');

  await page.evaluate(() => window.__game!.save());
  await page.reload();
  await expect(page.locator('#start-button')).toBeVisible();
  await activate(page, page.locator('#start-button'));
  await expect.poll(async () => (await snapshot(page)).rescued).toContain('fox');
  await expect.poll(async () => (await snapshot(page)).form).toBe('fox');
});

test('rescues all 22 required creatures through cage jumps, including the city cage behind the gate', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startGame(page);

  const cages: Array<[string, string, number, number]> = [
    ['meadow', 'fox', -7, -9],
    ['winter', 'arctic-fox', -7, -9],
    ['savannah', 'tiger', -7, -9],
    ['savannah', 'lion', 9, -17],
    ['savannah', 'giraffe', -15, -24],
    ['savannah', 'hippo', 18, -29],
    ['desert', 'camel', -7, -9],
    ['beach', 'turtle', -7, -9],
    ['ocean', 'shark', -7, -9],
    ['ocean', 'piranha', 9, -17],
    ['ocean', 'barracuda', -15, -24],
    ['ocean', 'whale-shark', 18, -29],
    ['ocean', 'kraken', 0, -32],
    ['ocean', 'leviathan', 22, -8],
    ['volcano', 'salamander', -7, -9],
    ['underground', 'bat', -7, -9],
    ['rifts', 'glow-moth', -7, -9],
    ['city', 'giant-reptile', -7, -9],
    ['city', 'mecha-reptile', 9, -17],
    ['city', 'rat', -15, -24],
    ['city', 'falcon', 18, -29],
    ['city', 'giant-cow', 0, -32],
  ];
  let biome = 'meadow';

  for (const [destination, creature, x, z] of cages) {
    if (destination !== biome) {
      await page.evaluate((id) => window.__game!.travel(id), destination);
      await expect.poll(async () => (await snapshot(page)).biome).toBe(destination);
      if (destination === 'ocean' || destination === 'city') await page.waitForTimeout(2_100);
      biome = destination;
    }
    await page.evaluate(([cageX, cageZ]) => window.__game!.teleport(cageX, cageZ), [x, z]);
    await activate(page, page.locator('#star-button'));
    await expect
      .poll(async () => (await snapshot(page)).rescued.includes(creature), { timeout: 6_000 })
      .toBe(true);
  }

  await expect(page.locator('#rescue-count')).toHaveText('22 / 22');
  expect((await snapshot(page)).boss?.id).toBe('demon-lizard');
  expect((await snapshot(page)).state).toBe('playing');
});

test('rescues the City’s giant cow while the final arena remains locked', async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => window.__game!.travel('city'));
  await expect.poll(async () => (await snapshot(page)).biome).toBe('city');
  await page.evaluate(() => window.__game!.teleport(0, -29));

  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(350);
  await page.keyboard.up('ArrowUp');
  await activate(page, page.locator('#star-button'));

  await expect
    .poll(async () => (await snapshot(page)).rescued.includes('giant-cow'), { timeout: 6_000 })
    .toBe(true);
  expect((await snapshot(page)).boss).toBeNull();
});

test('shows a nearby wildlife reaction when the player jumps beside it', async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => window.__game!.teleport(5, 1));
  await activate(page, page.locator('#star-button'));

  await expect(page.locator('#dialogue')).toContainText('Boing! Ten out of ten for silliness.');
});

test('defeats Flushington with reusable head stomps and keeps beach exploration safe', async ({
  page,
}) => {
  await startGame(page);
  await page.evaluate(() => window.__game!.travel('beach'));
  await expect.poll(async () => (await snapshot(page)).biome).toBe('beach');
  await page.evaluate(() => window.__game!.teleport(0, -19));
  await expect
    .poll(async () => (await snapshot(page)).boss?.id, { timeout: 6_000 })
    .toBe('flushington');
  await expect.poll(async () => (await snapshot(page)).state).toBe('cutscene');
  await activate(page, page.locator('#skip-button'));

  await activate(page, page.locator('#star-button'));
  await expect
    .poll(
      async () => {
        const current = await snapshot(page);
        return (current.boss?.hits ?? 0) > 0 || current.defeated.includes('flushington');
      },
      { timeout: 6_000 },
    )
    .toBe(true);
  for (let hits = (await snapshot(page)).boss?.hits ?? 3; hits < 3; hits += 1) {
    await page.waitForTimeout(650);
    await page.evaluate(() => window.__game!.setPlayer({ x: 0, y: 4, z: -19, vy: -2 }));
    await expect
      .poll(async () => (await snapshot(page)).boss?.hits, { timeout: 4_000 })
      .toBe(hits + 1);
  }

  await expect.poll(async () => (await snapshot(page)).state).toBe('cutscene');
  await expect(page.locator('#cutscene-text')).toContainText('FLUUUSH!');
  await activate(page, page.locator('#skip-button'));
  await expect.poll(async () => (await snapshot(page)).defeated.includes('flushington')).toBe(true);
  await expect.poll(async () => (await snapshot(page)).boss).toBeNull();
  await page.evaluate(() => window.__game!.travel('meadow'));
  await expect.poll(async () => (await snapshot(page)).biome).toBe('meadow');
  expect((await snapshot(page)).state).toBe('playing');
});

test('clears an Ocean save and starts a fresh adventure in Meadow', async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => window.__game!.travel('ocean'));
  await expect.poll(async () => (await snapshot(page)).biome).toBe('ocean');
  await page.locator('#pause-button').click();
  await page.locator('#reset-button').click();
  await page.locator('#confirm-reset').click();
  await page.reload();
  await expect(page.locator('#start-button')).toBeVisible();
  await activate(page, page.locator('#start-button'));
  await expect.poll(async () => (await snapshot(page)).biome).toBe('meadow');
  await expect(page.locator('#rescue-count')).toHaveText('0 / 22');
});

test('loads each planned biome and its HUD without a fatal page error', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await startGame(page);

  const biomes = [
    'meadow',
    'winter',
    'savannah',
    'desert',
    'beach',
    'ocean',
    'volcano',
    'underground',
    'rifts',
    'city',
  ];
  for (const biome of biomes) {
    await page.evaluate((id) => window.__game!.travel(id), biome);
    await expect.poll(async () => (await snapshot(page)).biome).toBe(biome);
    await expect(page.locator('#biome-name')).not.toBeEmpty();
    expect((await snapshot(page)).renderer.calls).toBeGreaterThan(0);
  }
  expect(pageErrors).toEqual([]);
});

test('reaches Winter by walking through Meadow’s actual east portal', async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => window.__game!.teleport(28, -27));
  await page.keyboard.down('ArrowUp');
  await expect.poll(async () => (await snapshot(page)).biome, { timeout: 6_000 }).toBe('winter');
  await page.keyboard.up('ArrowUp');
  await expect(page.locator('#biome-name')).toContainText('Snowcone Valley');
});

test('keeps the finale gated, then defeats the unlocked boss with five head stomps', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await startGame(page);

  await page.evaluate(() => window.__game!.travel('city'));
  await expect.poll(async () => (await snapshot(page)).biome).toBe('city');
  await page.evaluate(() => window.__game!.teleport(0, -19));
  expect((await snapshot(page)).boss).toBeNull();

  await page.evaluate(() => {
    window.__game!.rescueAll();
    window.__game!.save();
  });
  await page.evaluate(() => window.__game!.travel('city'));
  await page.evaluate(() => window.__game!.teleport(0, -19));
  await expect
    .poll(async () => (await snapshot(page)).boss?.id, { timeout: 6_000 })
    .toBe('demon-lizard');
  expect((await snapshot(page)).boss?.height).toBeGreaterThan(5);

  await expect.poll(async () => (await snapshot(page)).state).toBe('cutscene');
  const skip = page.locator('#skip-button');
  await expect(skip).toBeVisible();
  await activate(page, skip);
  await expect(page.locator('#boss-hearts .full')).toHaveCount(3);

  // The first head hit must come from the visible jump button, not test positioning.
  await activate(page, page.locator('#star-button'));
  await expect.poll(async () => (await snapshot(page)).boss?.hits, { timeout: 6_000 }).toBe(1);
  await expect(page.locator('#boss-hearts .full')).toHaveCount(3);

  for (let hits = 2; hits <= 5; hits += 1) {
    await page.waitForTimeout(650);
    await page.evaluate(() => window.__game!.setPlayer({ x: 0, y: 8, z: -19, vy: -2 }));
    await expect.poll(async () => (await snapshot(page)).boss?.hits, { timeout: 4_000 }).toBe(hits);
    await expect(page.locator('#boss-hearts .full')).toHaveCount([3, 3, 2, 2, 1, 0][hits]);
  }

  await expect.poll(async () => (await snapshot(page)).state).toBe('cutscene');
  await expect(page.locator('#skip-button')).toBeVisible();
  await expect(page.locator('#cutscene-text')).toContainText('You did it, Calvin!');
  await activate(page, page.locator('#skip-button'));
  await expect
    .poll(async () => (await snapshot(page)).defeated.includes('demon-lizard'))
    .toBe(true);
  await expect.poll(async () => (await snapshot(page)).biome).toBe('city');
  await expect.poll(async () => (await snapshot(page)).boss).toBeNull();

  await page.reload();
  await expect(page.locator('#start-button')).toBeVisible();
  await activate(page, page.locator('#start-button'));
  await expect
    .poll(async () => (await snapshot(page)).defeated.includes('demon-lizard'))
    .toBe(true);
  await expect.poll(async () => (await snapshot(page)).boss).toBeNull();
  await page.evaluate(() => window.__game!.travel('meadow'));
  await expect.poll(async () => (await snapshot(page)).biome).toBe('meadow');
  await page.evaluate(() => window.__game!.travel('beach'));
  await expect.poll(async () => (await snapshot(page)).biome).toBe('beach');
  await page.evaluate(() => window.__game!.teleport(0, -19));
  await expect
    .poll(async () => (await snapshot(page)).boss?.id, { timeout: 6_000 })
    .toBe('flushington');
  // Finish the encounter introduction before requesting a separate memory cutscene.
  await expect.poll(async () => (await snapshot(page)).state).toBe('cutscene');
  await activate(page, page.locator('#skip-button'));
  await activate(page, page.locator('#pause-button'));
  await activate(page, page.locator('#memory-button'));
  await expect(page.locator('#cutscene-text')).toContainText('THANK YOU!');
  await activate(page, page.locator('#skip-button'));
  await expect.poll(async () => (await snapshot(page)).boss?.id).toBe('flushington');
  expect((await snapshot(page)).state).toBe('playing');
});
