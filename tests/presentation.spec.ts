import { expect, test, type Page } from '@playwright/test';

type Snapshot = {
  state: string;
  biome: string;
  player: { x: number; z: number };
  portalArrival: boolean;
  boss: { id: string; facingCamera: number } | null;
  renderer: { labels: string[] };
};

type TestGame = {
  snapshot: () => Snapshot;
  travel: (id: string) => void;
  teleport: (x: number, z: number) => void;
  rescueAll: () => void;
};

const bossVisits = [
  ['meadow', 'sproutzilla'],
  ['winter', 'frosty'],
  ['desert', 'sandwich'],
  ['beach', 'flushington'],
  ['volcano', 'lava-lump'],
  ['city', 'demon-lizard'],
] as const;

const biomeLabels = new Set([
  'Clover Meadow',
  'Snowcone Valley',
  'Sunbeam Savannah',
  'Wobble Dunes',
  'Bubble Bay',
  'Atlantis',
  'Popcorn Peaks',
  'Twinkle Caverns',
  'The Giggle Rift',
  'Big Little City',
]);

async function start(page: Page) {
  await page.goto(process.env.CI ? '/?test=1&software=1' : '/?test=1');
  await expect(page.locator('#start-button')).toBeVisible();
  if (test.info().project.use.hasTouch) await page.locator('#start-button').tap();
  else await page.locator('#start-button').click();
  await expect(page.locator('#star-button')).toBeVisible();
}

async function snapshot(page: Page) {
  return page.evaluate(() => {
    const game = (window as unknown as { __game?: TestGame }).__game;
    if (!game) throw new Error('Test API was not enabled by ?test=1');
    return game.snapshot();
  });
}

async function gameAction(page: Page, action: 'rescueAll' | 'travel' | 'teleport', value?: string) {
  await page.evaluate(
    ({ action: command, value: argument }) => {
      const game = (window as unknown as { __game?: TestGame }).__game;
      if (!game) throw new Error('Test API was not enabled by ?test=1');
      if (command === 'rescueAll') game.rescueAll();
      else if (command === 'travel') game.travel(argument!);
      else game.teleport(0, -11);
    },
    { action, value },
  );
}

test('bosses turn toward the camera when each arena encounter begins', async ({ page }) => {
  test.setTimeout(process.env.CI ? 90_000 : 60_000);
  await start(page);

  for (const [biome, bossId] of bossVisits) {
    await gameAction(page, 'travel', biome);
    await expect.poll(async () => (await snapshot(page)).biome).toBe(biome);
    if (biome === 'city') await gameAction(page, 'rescueAll');
    await gameAction(page, 'teleport');
    await expect.poll(async () => (await snapshot(page)).boss?.id, { timeout: 8_000 }).toBe(bossId);

    const intro = page.locator('#skip-button');
    await expect(intro).toBeVisible({ timeout: 5_000 });
    if (test.info().project.use.hasTouch) await intro.tap();
    else await intro.click();
    await expect.poll(async () => (await snapshot(page)).state, { timeout: 5_000 }).toBe('playing');
    await expect
      .poll(async () => (await snapshot(page)).boss?.facingCamera ?? -1, { timeout: 6_000 })
      .toBeGreaterThan(0.75);
  }
});

test('shows a side-portal label before entry, walks through, and keeps controls usable on arrival', async ({
  page,
}) => {
  test.setTimeout(process.env.CI ? 35_000 : 25_000);
  await start(page);
  await page.evaluate(() => {
    (window as unknown as { __game: TestGame }).__game.teleport(28, -9);
  });

  const before = await snapshot(page);
  expect(Math.hypot(before.player.x - 28, before.player.z + 30)).toBeGreaterThanOrEqual(18);
  expect(Math.hypot(before.player.x - 28, before.player.z + 30)).toBeLessThanOrEqual(24);
  await expect
    .poll(async () =>
      (await snapshot(page)).renderer.labels.some((label) => biomeLabels.has(label)),
    )
    .toBe(true);
  expect((await snapshot(page)).renderer.labels.length).toBeLessThanOrEqual(1);

  // Let the arrival cooldown finish, then use the real forward control to enter the ring.
  await page.waitForTimeout(2_200);
  await page.keyboard.down('ArrowUp');
  try {
    await expect
      .poll(async () => (await snapshot(page)).biome, { timeout: 12_000 })
      .not.toBe('meadow');
  } finally {
    await page.keyboard.up('ArrowUp');
  }

  await expect.poll(async () => (await snapshot(page)).portalArrival).toBe(true);
  const arrived = await snapshot(page);
  await page.keyboard.down('ArrowRight');
  try {
    await expect
      .poll(async () => (await snapshot(page)).player.x)
      .toBeGreaterThan(arrived.player.x + 0.15);
  } finally {
    await page.keyboard.up('ArrowRight');
  }
  await expect
    .poll(async () => (await snapshot(page)).portalArrival, { timeout: 5_000 })
    .toBe(false);
});
