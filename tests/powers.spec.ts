import { expect, test, type Page } from '@playwright/test';

type Npc = {
  name: string;
  trip: 'home' | 'launch' | 'away' | 'return';
  x: number;
  y: number;
  z: number;
};
type PowerGame = {
  snapshot: () => {
    state: string;
    form: string;
    rescued: string[];
    player: { x: number; y: number; z: number };
    npcs: Npc[];
  };
  teleport: (x: number, z: number) => void;
  face: (x: number, z: number) => void;
  rescueAll: () => void;
};

const game = (page: Page) =>
  page.evaluate(() => (window as unknown as { __game: PowerGame }).__game.snapshot());

async function activate(page: Page, selector: string) {
  if (test.info().project.use.hasTouch) await page.locator(selector).tap();
  else await page.locator(selector).click();
}

async function start(page: Page) {
  await page.goto(process.env.CI ? '/?test=1&software=1' : '/?test=1');
  await activate(page, '#start-button');
  await expect(page.locator('#power-button')).toBeVisible();
}

/** Stands three steps from a wild animal, facing toward it or directly away from it. */
async function standBy(page: Page, index: number, facingAway = false) {
  const npc = (await game(page)).npcs[index];
  await page.evaluate(
    ([x, z, away]) => {
      const api = (window as unknown as { __game: PowerGame }).__game;
      api.teleport(x, z + 3);
      api.face(x, away ? z + 10 : z);
    },
    [npc.x, npc.z, facingAway ? 1 : 0] as const,
  );
  return npc;
}

test('shows separate Jump and Power controls, with each form’s own power', async ({ page }) => {
  await start(page);
  await expect(page.locator('#star-label')).toHaveText('JUMP');
  await expect(page.locator('#power-label')).toHaveText('BOOP');
  await expect(page.locator('#power-button')).toHaveAttribute(
    'aria-label',
    'Use power: Super boop',
  );
  await page.evaluate(() => (window as unknown as { __game: PowerGame }).__game.rescueAll());
  await activate(page, '[data-form="fox"]');
  await expect(page.locator('#power-label')).toHaveText('DASH');
  await expect(page.locator('#star-label')).toHaveText('JUMP');
  await activate(page, '[data-form="bat"]');
  await expect(page.locator('#power-label')).toHaveText('PING');
  await expect(page.locator('#star-label')).toHaveText('FLY');
  await expect(page.locator('#power-button')).toHaveAttribute('aria-label', 'Use power: Echo ping');
});

test('sends a wild animal the power points at to space, then it floats home', async ({ page }) => {
  test.setTimeout(process.env.CI ? 90_000 : 45_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await start(page);
  const before = await standBy(page, 0);
  await activate(page, '#power-button');
  await expect(page.locator('#toast')).toContainText('zoomed off to space');
  await expect.poll(async () => (await game(page)).npcs[0].trip, { timeout: 20_000 }).toBe('away');
  await expect.poll(async () => (await game(page)).npcs[0].trip, { timeout: 30_000 }).toBe('home');
  // It lands with a happy bounce, then settles on the ground.
  await expect
    .poll(async () => (await game(page)).npcs[0].y, { timeout: 5_000 })
    .toBeLessThan(0.05);
  const home = (await game(page)).npcs[0];
  expect(home.name).toBe(before.name);
  // It lands back in its own wandering spot, not somewhere new.
  expect(Math.hypot(home.x - before.x, home.z - before.z)).toBeLessThan(4.5);
  const after = await game(page);
  expect(after.state).toBe('playing');
  expect(after.rescued).toEqual([]);
  expect(errors).toEqual([]);
});

test('leaves an animal behind the player alone', async ({ page }) => {
  await start(page);
  await standBy(page, 0, true);
  await activate(page, '#power-button');
  await page.waitForTimeout(800);
  expect((await game(page)).npcs.map((npc) => npc.trip)).toEqual(['home', 'home', 'home']);
});

test('a dash power carries the player forward along the ground', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    const api = (window as unknown as { __game: PowerGame }).__game;
    api.rescueAll();
    // East along the open south lawn: no scenery and no wild animal inside the dash's aim.
    api.teleport(0, 8);
    api.face(10, 8);
  });
  await activate(page, '[data-form="fox"]');
  await expect.poll(async () => (await game(page)).form).toBe('fox');
  const before = (await game(page)).player;
  if (test.info().project.use.hasTouch) await page.locator('#power-button').tap();
  else await page.keyboard.press('KeyE');
  await expect
    .poll(async () => (await game(page)).player.x - before.x, { timeout: 10_000 })
    .toBeGreaterThan(4);
  const after = (await game(page)).player;
  expect(after.y).toBe(0);
  expect(Math.abs(after.z - before.z)).toBeLessThan(1);
});

test('repeating a pounce in mid-air never lifts the player higher than one pounce', async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => {
    const api = (window as unknown as { __game: PowerGame }).__game;
    api.rescueAll();
    api.teleport(0, 8);
    api.face(10, 8);
  });
  await activate(page, '[data-form="tiger"]');
  await expect.poll(async () => (await game(page)).form).toBe('tiger');
  let highest = 0;
  for (let i = 0; i < 8; i++) {
    await activate(page, '#power-button');
    for (let k = 0; k < 4; k++) {
      highest = Math.max(highest, (await game(page)).player.y);
      await page.waitForTimeout(60);
    }
  }
  // One pounce peaks near two units; chaining presses must not climb further.
  expect(highest).toBeGreaterThan(0.5);
  expect(highest).toBeLessThan(3);
});
