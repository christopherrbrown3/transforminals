import { expect, test, type Page } from '@playwright/test';

type Snapshot = {
  state: string;
  biome: string;
  form: string;
  rescued: string[];
  defeated: string[];
  player: { x: number; y: number; z: number; vy: number };
  boss: { id: string; hits: number; total: number; height: number } | null;
  audio: {
    state: string;
    muted: boolean;
    volume: number;
    biome: string;
    sirenPlays: number;
  };
  sirenTime: number;
  sirenBoat: { tilt: number; x: number; z: number } | null;
  motionReduced: boolean;
  updates: { pending: boolean; activations: number };
};

type TestGame = {
  snapshot: () => Snapshot;
  teleport: (x: number, z: number) => void;
  travel: (id: string) => void;
  rescueAll: () => void;
  queueUpdate: () => void;
};

const testTimeout = process.env.CI ? 15_000 : 8_000;

async function snapshot(page: Page) {
  return page.evaluate(() => {
    const game = (window as unknown as { __game?: TestGame }).__game;
    if (!game) throw new Error('Test API was not enabled by ?test=1');
    return game.snapshot();
  });
}

type HookAction =
  | { type: 'recoverySetup' }
  | { type: 'unlockAndTravel'; biome: string }
  | { type: 'travel'; biome: string }
  | { type: 'teleport'; x: number; z: number };

async function api(page: Page, action: HookAction) {
  await page.evaluate((command) => {
    const game = (window as unknown as { __game?: TestGame }).__game;
    if (!game) throw new Error('Test API was not enabled by ?test=1');
    if (command.type === 'recoverySetup') {
      game.rescueAll();
      game.travel('volcano');
      game.teleport(-16.5, -27);
    } else if (command.type === 'unlockAndTravel') {
      game.rescueAll();
      game.travel(command.biome);
    } else if (command.type === 'travel') game.travel(command.biome);
    else if (command.type === 'teleport') game.teleport(command.x, command.z);
  }, action);
}

async function start(page: Page) {
  await page.goto(process.env.CI ? '/?test=1&software=1' : '/?test=1');
  await expect(page.locator('#start-button')).toBeVisible();
  await activate(page, page.locator('#start-button'));
  await expect(page.locator('#star-button')).toBeVisible();
}

async function activate(page: Page, control: ReturnType<Page['locator']>) {
  if (test.info().project.use.hasTouch) await control.tap();
  else await control.click();
}

async function hold(page: Page, control: ReturnType<Page['locator']>) {
  await control.dispatchEvent('pointerdown', {
    pointerId: 7,
    pointerType: 'touch',
    isPrimary: true,
    button: 0,
  });
}

async function release(page: Page, control: ReturnType<Page['locator']>, type = 'pointerup') {
  await control.dispatchEvent(type, {
    pointerId: 7,
    pointerType: 'touch',
    isPrimary: true,
    button: 0,
  });
}

test('recovers safely from lava and the world edge without losing rescues', async ({ page }) => {
  test.setTimeout(testTimeout);
  await start(page);
  await api(page, { type: 'recoverySetup' });
  const before = await snapshot(page);
  expect(before.rescued).toHaveLength(22);

  await page.keyboard.down('ArrowLeft');
  await expect(page.locator('#toast')).toContainText('SPICY BOING!', { timeout: 5_000 });
  await page.keyboard.up('ArrowLeft');
  expect((await snapshot(page)).player.y).toBeGreaterThan(0);
  expect((await snapshot(page)).rescued).toEqual(before.rescued);

  await api(page, { type: 'teleport', x: 41, z: 0 });
  await page.keyboard.down('ArrowRight');
  await expect
    .poll(async () => (await snapshot(page)).player.y, { timeout: 5_000 })
    .toBeGreaterThan(0);
  await page.keyboard.up('ArrowRight');
  const after = await snapshot(page);
  await expect(page.locator('#toast')).toContainText('friendly boing back');
  expect(after.player.x).toBeGreaterThanOrEqual(40);
  expect(Math.hypot(after.player.x, after.player.z)).toBeLessThanOrEqual(42);
  expect(after.rescued).toEqual(before.rescued);
});

test('supports powered flight and underwater swimming with the visible star control', async ({
  page,
}) => {
  test.setTimeout(process.env.CI ? 60_000 : 45_000);
  await start(page);
  await api(page, { type: 'unlockAndTravel', biome: 'city' });
  await expect.poll(async () => (await snapshot(page)).biome).toBe('city');
  const falcon = page.locator('[data-form="falcon"]');
  await expect(falcon).toBeVisible();
  await activate(page, falcon);
  await expect.poll(async () => (await snapshot(page)).form).toBe('falcon');

  const star = page.locator('#star-button');
  await hold(page, star);
  await expect
    .poll(async () => (await snapshot(page)).player.y, { timeout: 5_000 })
    .toBeGreaterThan(2);
  await release(page, star);

  await api(page, { type: 'travel', biome: 'ocean' });
  await expect.poll(async () => (await snapshot(page)).biome).toBe('ocean');
  const shark = page.locator('[data-form="shark"]');
  await expect(shark).toBeVisible();
  await activate(page, shark);
  await expect.poll(async () => (await snapshot(page)).form).toBe('shark');
  await hold(page, star);
  await expect
    .poll(async () => (await snapshot(page)).player.y, { timeout: 5_000 })
    .toBeGreaterThan(1);
  const oceanRescues = (await snapshot(page)).rescued;
  await page.waitForTimeout(2_800);
  const oceanPeak = (await snapshot(page)).player.y;
  expect(oceanPeak).toBeLessThan(10);
  await release(page, star);
  await expect
    .poll(async () => (await snapshot(page)).player.y, { timeout: 7_000 })
    .toBeLessThan(oceanPeak);
  expect((await snapshot(page)).rescued).toEqual(oceanRescues);

  await api(page, { type: 'travel', biome: 'beach' });
  await expect.poll(async () => (await snapshot(page)).biome).toBe('beach');
  await api(page, { type: 'teleport', x: -22, z: 2 });
  await hold(page, star);
  await expect
    .poll(async () => (await snapshot(page)).player.y, { timeout: 5_000 })
    .toBeGreaterThan(1);
  await page.waitForTimeout(1_600);
  const beachPeak = (await snapshot(page)).player.y;
  expect(beachPeak).toBeLessThan(10);
  await release(page, star);
  await expect
    .poll(async () => (await snapshot(page)).player.y, { timeout: 7_000 })
    .toBeLessThan(beachPeak);
  expect((await snapshot(page)).rescued).toEqual(oceanRescues);
});

test('uses the same head-stomp win flow for the other four mini-bosses', async ({ page }) => {
  test.setTimeout(process.env.CI ? 120_000 : 90_000);
  await start(page);
  const bosses = [
    ['meadow', 'sproutzilla'],
    ['winter', 'frosty'],
    ['desert', 'sandwich'],
    ['volcano', 'lava-lump'],
  ] as const;

  for (const [biome, id] of bosses) {
    await api(page, { type: 'travel', biome });
    await expect.poll(async () => (await snapshot(page)).biome).toBe(biome);
    await api(page, { type: 'teleport', x: 0, z: -19 });
    await expect.poll(async () => (await snapshot(page)).boss?.id).toBe(id);
    if (await page.locator('#skip-button').isVisible())
      await activate(page, page.locator('#skip-button'));

    const star = page.locator('#star-button');
    await activate(page, star);
    await expect
      .poll(async () => (await snapshot(page)).boss?.hits ?? 0, { timeout: 6_000 })
      .toBeGreaterThan(0);
    // Stay on the head: each successful stomp provides the next forgiving bounce.
    await expect
      .poll(async () => (await snapshot(page)).defeated.includes(id), {
        timeout: process.env.CI ? 20_000 : 12_000,
      })
      .toBe(true);
    expect((await snapshot(page)).boss?.hits).toBe(3);
    await expect(page.locator('#skip-button')).toBeVisible();
    await activate(page, page.locator('#skip-button'));
    await expect.poll(async () => (await snapshot(page)).boss).toBeNull();
    expect((await snapshot(page)).defeated).toContain(id);
  }
});

test('persists sound, volume, and gentle-motion preferences across reloads', async ({ page }) => {
  await start(page);
  await activate(page, page.locator('#pause-button'));
  const sound = page.locator('#muted-setting');
  const motion = page.locator('#motion-setting');
  await expect(sound).toBeChecked();
  await sound.uncheck();
  await page.locator('#volume-setting').fill('0.75');
  await motion.check();
  await page.reload();
  await expect(page.locator('#start-button')).toBeVisible();
  await activate(page, page.locator('#start-button'));
  await activate(page, page.locator('#pause-button'));
  await expect(sound).not.toBeChecked();
  await expect(page.locator('#volume-setting')).toHaveValue('0.75');
  await expect(motion).toBeChecked();
  const current = await snapshot(page);
  expect(current.audio.muted).toBe(true);
  expect(current.audio.volume).toBeCloseTo(0.75);
  expect(current.motionReduced).toBe(true);
});

test('releases held controls on pointer cancel and blur, and adapts to orientation changes', async ({
  page,
}) => {
  await start(page);
  const forward = page.locator('[data-move="forward"]');
  const initialZ = (await snapshot(page)).player.z;
  await hold(page, forward);
  await expect.poll(async () => (await snapshot(page)).player.z).toBeLessThan(initialZ - 0.2);
  await release(page, forward, 'pointercancel');
  await page.waitForTimeout(180);
  const cancelledZ = (await snapshot(page)).player.z;
  await page.waitForTimeout(180);
  expect((await snapshot(page)).player.z).toBeCloseTo(cancelledZ, 0);

  await hold(page, forward);
  await expect.poll(async () => (await snapshot(page)).player.z).toBeLessThan(cancelledZ - 0.2);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForTimeout(180);
  const blurredZ = (await snapshot(page)).player.z;
  await page.waitForTimeout(180);
  expect((await snapshot(page)).player.z).toBeCloseTo(blurredZ, 0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#rotate-hint')).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#rotate-hint')).toBeHidden();
});

test('discovers a world through its ring, then returns from the map', async ({ page }) => {
  await start(page);
  await activate(page, page.locator('#map-button'));
  await expect(page.locator('[data-travel="winter"]')).toBeDisabled();
  await page.getByRole('button', { name: 'Close' }).click();

  await api(page, { type: 'teleport', x: 28, z: -27 });
  await page.keyboard.down('ArrowUp');
  await expect
    .poll(async () => (await snapshot(page)).biome, { timeout: 7_000 })
    .not.toBe('meadow');
  await page.keyboard.up('ArrowUp');
  const discovered = (await snapshot(page)).biome;
  await activate(page, page.locator('#map-button'));
  await expect(page.locator(`[data-travel="${discovered}"]`)).toBeEnabled();
  await activate(page, page.locator('#home-button'));
  await expect.poll(async () => (await snapshot(page)).biome).toBe('meadow');
  // Revisited regions must not retain the just-discovered region's arrival notice.
  expect(await page.locator('#toast').isVisible()).toBe(false);
});

test('defers a visible update through a boss introduction and saves before activation', async ({
  page,
}) => {
  await start(page);
  await api(page, { type: 'unlockAndTravel', biome: 'beach' });
  await expect.poll(async () => (await snapshot(page)).biome).toBe('beach');
  await api(page, { type: 'teleport', x: 0, z: -19 });
  await expect.poll(async () => (await snapshot(page)).boss?.id).toBe('flushington');
  await expect(page.locator('#skip-button')).toBeVisible();
  await page.evaluate(() => {
    const game = (window as unknown as { __game?: TestGame }).__game;
    if (!game) throw new Error('Test API was not enabled by ?test=1');
    game.queueUpdate();
  });
  const update = page.locator('#update-button');
  await expect(update).toBeVisible();
  await activate(page, update);
  let current = await snapshot(page);
  expect(current.state).toBe('cutscene');
  expect(current.updates.activations).toBe(0);
  expect(current.updates.pending).toBe(true);

  await activate(page, page.locator('#skip-button'));
  await activate(page, update);
  current = await snapshot(page);
  expect(current.state).toBe('paused');
  expect(current.updates.activations).toBe(1);
  expect(current.updates.pending).toBe(false);
  expect(current.rescued).toHaveLength(22);
});

test('plays the Jazzy Finn siren cue when the nearby Ocean NPC reacts', async ({ page }) => {
  await start(page);
  await api(page, { type: 'unlockAndTravel', biome: 'ocean' });
  await expect.poll(async () => (await snapshot(page)).biome).toBe('ocean');
  await api(page, { type: 'teleport', x: 5, z: 1 });
  await activate(page, page.locator('#star-button'));
  await expect.poll(async () => (await snapshot(page)).sirenTime).toBeGreaterThan(0);
  expect((await snapshot(page)).audio.sirenPlays).toBe(1);
  await expect
    .poll(async () => (await snapshot(page)).sirenBoat?.tilt, { timeout: 8_000 })
    .toBeGreaterThan(0.8);
  await expect.poll(async () => (await snapshot(page)).sirenTime, { timeout: 8_000 }).toBe(0);
  const boat = (await snapshot(page)).sirenBoat;
  expect(boat?.tilt).toBeCloseTo(0);
  expect(boat?.x).toBeCloseTo(12.5);
  expect(boat?.z).toBeCloseTo(0);
});
