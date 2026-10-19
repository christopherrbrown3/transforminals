import { expect, test, type Page } from '@playwright/test';

type CaveGame = {
  snapshot: () => {
    biome: string;
    form: string;
    rescued: string[];
    secrets: string[];
    player: { x: number; z: number };
    renderer: { obstacles: { x: number; z: number; radius: number }[] };
  };
  travel: (id: string) => void;
  rescueAll: () => void;
  setPlayer: (player: { x: number; y: number; z: number; vy: number }) => void;
};
const current = (page: Page) =>
  page.evaluate(() => (window as unknown as { __game: CaveGame }).__game.snapshot());
async function activate(page: Page, selector: string) {
  if (test.info().project.use.hasTouch) await page.locator(selector).tap();
  else await page.locator(selector).click();
}
async function start(page: Page) {
  await page.goto(process.env.CI ? '/?test=1&software=1' : '/?test=1');
  await activate(page, '#start-button');
  await expect(page.locator('#star-button')).toBeVisible();
}
async function walk(page: Page, x: number, z: number) {
  const deadline = Date.now() + 12_000;
  const held = new Set<string>();
  try {
    while (Date.now() < deadline) {
      const p = (await current(page)).player;
      if (Math.hypot(x - p.x, z - p.z) < 0.8) return;
      const next = new Set<string>();
      if (Math.abs(x - p.x) > 0.35) next.add(x > p.x ? 'ArrowRight' : 'ArrowLeft');
      if (Math.abs(z - p.z) > 0.35) next.add(z > p.z ? 'ArrowDown' : 'ArrowUp');
      for (const key of held)
        if (!next.has(key)) {
          await page.keyboard.up(key);
          held.delete(key);
        }
      for (const key of next)
        if (!held.has(key)) {
          await page.keyboard.down(key);
          held.add(key);
        }
      await page.waitForTimeout(70);
    }
    throw new Error(`Could not walk to ${x},${z}: ${JSON.stringify((await current(page)).player)}`);
  } finally {
    for (const key of held) await page.keyboard.up(key);
  }
}

test('walks the cave passages as human, rescues the bat, saves the secret and exits through a ring', async ({
  page,
}) => {
  test.setTimeout(process.env.CI ? 150_000 : 100_000);
  await start(page);
  await page.evaluate(() =>
    (window as unknown as { __game: CaveGame }).__game.travel('underground'),
  );
  await expect.poll(async () => (await current(page)).biome).toBe('underground');
  await walk(page, -4, -4);
  await walk(page, -7, -6.5);
  await activate(page, '#star-button');
  await expect
    .poll(async () => (await current(page)).rescued, { timeout: 15_000 })
    .toEqual(['bat']);
  for (const [x, z] of [
    [-20, -2],
    [-28, 6],
    [-28, 13],
    [-25, 17],
  ])
    await walk(page, x, z);
  await expect.poll(async () => (await current(page)).secrets).toEqual(['crystal-nook']);
  expect((await current(page)).rescued).toEqual(['bat']);
  await activate(page, '#pause-button');
  await page.reload();
  await activate(page, '#start-button');
  expect((await current(page)).secrets).toEqual(['crystal-nook']);
  expect((await current(page)).form).toBe('human');
  for (const [x, z] of [
    [-28, 13],
    [-28, 6],
    [-20, -2],
    [-7, -9],
    [-5, -16],
    [0, -22],
    [0, -34],
  ])
    await walk(page, x, z);
  await page.keyboard.down('ArrowUp');
  await expect
    .poll(async () => (await current(page)).biome, { timeout: 12_000 })
    .not.toBe('underground');
  await page.keyboard.up('ArrowUp');
  expect((await current(page)).rescued).toEqual(['bat']);
});

test('safely restores a v0.2 cave save that is inside newly solid rock', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'transforminals-save',
      JSON.stringify({
        version: 2,
        rescued: ['fox'],
        form: 'fox',
        discovered: ['meadow', 'underground'],
        location: { biome: 'underground', x: -10, z: 20 },
      }),
    ),
  );
  await start(page);
  const saved = await current(page);
  expect(saved.biome).toBe('underground');
  expect(saved.rescued).toEqual(['fox']);
  expect(Math.hypot(saved.player.x + 10, saved.player.z - 20)).toBeGreaterThan(1);
  expect(
    saved.renderer.obstacles.every(
      (o) => Math.hypot(saved.player.x - o.x, saved.player.z - o.z) >= o.radius + 0.39,
    ),
  ).toBe(true);
  const before = saved.player;
  await page.keyboard.down('ArrowUp');
  await expect
    .poll(async () =>
      Math.hypot(
        (await current(page)).player.x - before.x,
        (await current(page)).player.z - before.z,
      ),
    )
    .toBeGreaterThan(0.2);
  await page.keyboard.up('ArrowUp');
});

test('returns a flyer landing outside the cave walls to a safe path before human exploration', async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => {
    const game = (window as unknown as { __game: CaveGame }).__game;
    game.rescueAll();
    game.travel('underground');
  });
  await activate(page, '[data-form="bat"]');
  await expect.poll(async () => (await current(page)).form).toBe('bat');
  // Reproduce the final descent after a flight over the open-top walls.
  await page.evaluate(() =>
    (window as unknown as { __game: CaveGame }).__game.setPlayer({ x: 0, z: 20, y: 0.1, vy: -2 }),
  );
  await expect(page.locator('#toast')).toContainText('back to the cave path');
  const returned = await current(page);
  expect(Math.hypot(returned.player.x, returned.player.z - 5)).toBeLessThan(1);
  await activate(page, '[data-form="human"]');
  await expect.poll(async () => (await current(page)).form).toBe('human');
  await walk(page, 2, 3);
  expect((await current(page)).rescued).toHaveLength(22);
});
