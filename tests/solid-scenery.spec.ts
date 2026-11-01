import { expect, test, type Page } from '@playwright/test';

type Obstacle = {
  x: number;
  z: number;
  radius: number;
  height?: number;
  half?: [number, number];
  top?: { y: number; radius?: number; half?: [number, number] };
};
type GameSnapshot = {
  state: string;
  biome: string;
  form: string;
  defeated: string[];
  player: { x: number; y: number; z: number; vy: number };
  boss: { id: string; hits: number } | null;
  renderer: { obstacles: Obstacle[] };
};
type TestGame = {
  snapshot: () => GameSnapshot;
  teleport: (x: number, z: number) => void;
  travel: (id: string) => void;
  rescueAll: () => void;
  setPlayer: (player: Partial<GameSnapshot['player']>) => void;
};
type HookAction =
  | { type: 'travel'; biome: string }
  | { type: 'unlockAndTravel'; biome: string }
  | { type: 'teleport'; x: number; z: number }
  | { type: 'place'; x: number; y: number; z: number }
  | { type: 'slide'; x: number; z: number };

async function startGame(page: Page) {
  await page.goto(process.env.CI ? '/?test=1&software=1' : '/?test=1');
  await expect(page.locator('#start-button')).toBeVisible();
  await activate(page, page.locator('#start-button'));
  await expect(page.locator('#star-button')).toBeVisible();
}

async function activate(page: Page, control: ReturnType<Page['locator']>) {
  if (test.info().project.use.hasTouch) await control.tap();
  else await control.click();
}

async function snapshot(page: Page) {
  return page.evaluate(() => {
    const game = (window as unknown as { __game?: TestGame }).__game;
    if (!game) throw new Error('Test API was not enabled by ?test=1');
    return game.snapshot();
  });
}

async function api(page: Page, action: HookAction) {
  await page.evaluate((command) => {
    const game = (window as unknown as { __game?: TestGame }).__game;
    if (!game) throw new Error('Test API was not enabled by ?test=1');
    if (command.type === 'travel') game.travel(command.biome);
    else if (command.type === 'unlockAndTravel') {
      game.rescueAll();
      game.travel(command.biome);
    } else if (command.type === 'teleport') game.teleport(command.x, command.z);
    else if (command.type === 'slide') game.setPlayer({ x: command.x, z: command.z });
    else game.setPlayer({ x: command.x, y: command.y, z: command.z, vy: 0 });
  }, action);
}

/** Drops the player from above a spot and waits for them to come to rest below it. */
async function dropOnto(page: Page, x: number, z: number, from: number) {
  await api(page, { type: 'place', x, y: from, z });
  // The placement itself has no speed, so also wait for the fall to have started.
  await expect
    .poll(
      async () => {
        const { player } = await snapshot(page);
        return player.vy === 0 && player.y < from - 0.5;
      },
      { timeout: 10_000 },
    )
    .toBe(true);
  return (await snapshot(page)).player;
}

test('lands and stays on a City rooftop, then walks off the edge to the street', async ({
  page,
}) => {
  test.setTimeout(process.env.CI ? 90_000 : 60_000);
  await startGame(page);
  await api(page, { type: 'travel', biome: 'city' });
  await expect.poll(async () => (await snapshot(page)).biome).toBe('city');
  const roof = (await snapshot(page)).renderer.obstacles
    .filter((o) => o.half && (o.height ?? 0) > 4 && o.half[0] > 2)
    .sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))[0];
  expect(roof, 'a City building').toBeDefined();
  // Stand on the street beside it first, so the safe-spot memory is on the ground.
  const side = Math.sign(roof.x);
  await api(page, { type: 'teleport', x: roof.x - side * 5, z: roof.z });
  // Land on the open part of the roof, clear of the smaller rooftop block.
  const landed = await dropOnto(page, roof.x - side * 2.2, roof.z + 2.2, roof.height! + 6);
  expect(landed.y).toBeCloseTo(roof.height!, 5);
  await page.waitForTimeout(1200);
  expect((await snapshot(page)).player.y).toBeCloseTo(roof.height!, 5);

  // Walking toward the street steps off the roof and drops to the ground.
  const key = side > 0 ? 'ArrowLeft' : 'ArrowRight';
  await page.keyboard.down(key);
  await expect.poll(async () => (await snapshot(page)).player.y, { timeout: 8_000 }).toBe(0);
  await page.keyboard.up(key);
  const street = (await snapshot(page)).player;
  expect(Math.abs(street.x - roof.x)).toBeGreaterThan(roof.half![0]);
});

test('flies a falcon higher than the tallest City roof and lands on top of it', async ({
  page,
}) => {
  test.setTimeout(process.env.CI ? 90_000 : 60_000);
  await startGame(page);
  await api(page, { type: 'unlockAndTravel', biome: 'city' });
  await expect.poll(async () => (await snapshot(page)).biome).toBe('city');
  const tallest = (await snapshot(page)).renderer.obstacles
    .filter((o) => o.half && o.half[0] > 2)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))[0];
  expect(tallest.height).toBeGreaterThan(9);
  const side = Math.sign(tallest.x);
  await api(page, { type: 'teleport', x: tallest.x - side * 5, z: tallest.z });
  await activate(page, page.locator('[data-form="falcon"]'));
  await expect.poll(async () => (await snapshot(page)).form).toBe('falcon');
  // Holding Jump flies the falcon up past the roof line.
  await page.keyboard.down('Space');
  await expect
    .poll(async () => (await snapshot(page)).player.y, { timeout: 20_000 })
    .toBeGreaterThan(tallest.height! + 0.5);
  await api(page, { type: 'slide', x: tallest.x - side * 2.2, z: tallest.z + 2.2 });
  await page.keyboard.up('Space');
  await expect
    .poll(
      async () => {
        const { player } = await snapshot(page);
        return player.vy === 0 && player.y < tallest.height! + 0.2;
      },
      { timeout: 15_000 },
    )
    .toBe(true);
  expect((await snapshot(page)).player.y).toBeCloseTo(tallest.height!, 5);
});

test('lands and stays on a Meadow treetop instead of sliding off', async ({ page }) => {
  await startGame(page);
  const tree = (await snapshot(page)).renderer.obstacles
    .filter((o) => o.top?.radius && o.top.y > 3 && Math.hypot(o.x, o.z) < 34)
    .sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))[0];
  expect(tree, 'a Meadow tree with a canopy top').toBeDefined();
  // Off-center, so the landing is on the broad canopy rather than the higher leafy tuft.
  const x = tree.x + tree.top!.radius! * 0.85;
  const landed = await dropOnto(page, x, tree.z, tree.top!.y + 5);
  expect(landed.y).toBeCloseTo(tree.top!.y, 5);
  await page.waitForTimeout(1200);
  const after = (await snapshot(page)).player;
  expect(after.y).toBeCloseTo(tree.top!.y, 5);
  expect(after.x).toBeCloseTo(x, 5);
});

test('unlocks a beaten boss as a playable form that survives a reload', async ({ page }) => {
  test.setTimeout(process.env.CI ? 90_000 : 45_000);
  await startGame(page);
  await expect(page.locator('[data-form="sproutzilla"]')).toHaveCount(0);
  await api(page, { type: 'teleport', x: 0, z: -19 });
  await expect.poll(async () => (await snapshot(page)).boss?.id).toBe('sproutzilla');
  await expect.poll(async () => (await snapshot(page)).state, { timeout: 15_000 }).toBe('cutscene');
  await activate(page, page.locator('#skip-button'));
  await activate(page, page.locator('#star-button'));
  // Each successful stomp supplies the next forgiving bounce.
  await expect
    .poll(async () => (await snapshot(page)).defeated.includes('sproutzilla'), {
      timeout: process.env.CI ? 20_000 : 12_000,
    })
    .toBe(true);
  const form = page.locator('[data-form="sproutzilla"]');
  await expect(form).toHaveCount(1);
  await activate(page, page.locator('#skip-button'));
  await expect(page.locator('#toast')).toContainText('Sproutzilla joined your forms');

  await activate(page, form);
  await expect.poll(async () => (await snapshot(page)).form).toBe('sproutzilla');
  await expect(page.locator('#power-label')).toHaveText('RAWR');
  await expect(form).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(page.locator('#start-button')).toBeVisible();
  await activate(page, page.locator('#start-button'));
  await expect.poll(async () => (await snapshot(page)).form).toBe('sproutzilla');
  await expect(page.locator('[data-form="sproutzilla"]')).toHaveCount(1);
  expect((await snapshot(page)).boss).toBeNull();
});
