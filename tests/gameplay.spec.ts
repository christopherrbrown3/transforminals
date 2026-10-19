import { expect, test, type Page } from '@playwright/test';

// Software GPU shader initialization can stall wall time before the jump simulation advances.
const rescueTimeout = process.env.CI ? 15_000 : 6_000;

type GameSnapshot = {
  state: string;
  biome: string;
  form: string;
  rescued: string[];
  defeated: string[];
  player: { x: number; y: number; z: number; vy: number };
  boss: { id: string; hits: number; total: number; height: number } | null;
  renderer: {
    pixelRatio: number;
    visibleLabels: number;
    obstacles: Array<{ x: number; z: number; radius: number; height?: number }>;
    calls: number;
    triangles: number;
    geometries: number;
    textures: number;
  };
};

declare global {
  interface Window {
    __bossHeartHistory?: Array<{ hits: number; full: number; empty: number; slots: number }>;
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
  await page.goto(process.env.CI ? '/?test=1&software=1' : '/?test=1');
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
  await expect(page.locator('#dialogue')).toBeHidden();

  await activate(page, page.locator('#pause-button'));
  await expect(page.getByRole('button', { name: 'How to play' })).toBeVisible();
  await activate(page, page.getByRole('button', { name: 'How to play' }));
  await expect(page.getByRole('dialog', { name: 'Ready when you are' })).toContainText(
    'Land on a cage roof to free a friend.',
  );
  await activate(page, page.locator('#help-done'));
  await expect(page.locator('#dialogue')).toBeHidden();

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

test('keeps essential controls inside compact landscape and hides clutter', async ({ page }) => {
  await page.goto('/?test=1&software=1');
  await expect(page.locator('#start-button')).toBeVisible();
  await activate(page, page.locator('#start-button'));
  await expect(page.locator('#star-button')).toBeVisible();

  for (const viewport of [
    { width: 844, height: 390 },
    { width: 1194, height: 834 },
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(250);
    const result = await page.evaluate(() => {
      const selectors = [
        '#biome-name',
        '#rescue-count',
        '#map-button',
        '#pause-button',
        '#star-button',
        '[data-move="forward"]',
        '[data-move="left"]',
        '[data-move="right"]',
        '[data-move="backward"]',
      ];
      const bounds = Object.fromEntries(
        selectors.map((selector) => {
          const element = document.querySelector(selector);
          if (!element) throw new Error(`Missing UI control: ${selector}`);
          const rect = element.getBoundingClientRect();
          return [selector, { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom }];
        }),
      );
      const dpad = selectors.slice(5).map((selector) => bounds[selector]);
      const star = bounds['#star-button'];
      return {
        width: innerWidth,
        height: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        bounds,
        starDpadOverlap: dpad.some(
          (control) =>
            star.x < control.right &&
            star.right > control.x &&
            star.y < control.bottom &&
            star.bottom > control.y,
        ),
      };
    });

    expect(result.documentWidth).toBeLessThanOrEqual(result.width + 1);
    for (const [selector, rect] of Object.entries(result.bounds)) {
      expect(rect.x, `${selector} left edge at ${viewport.width}px`).toBeGreaterThanOrEqual(-1);
      expect(rect.y, `${selector} top edge at ${viewport.width}px`).toBeGreaterThanOrEqual(-1);
      expect(rect.right, `${selector} right edge at ${viewport.width}px`).toBeLessThanOrEqual(
        viewport.width + 1,
      );
      expect(rect.bottom, `${selector} bottom edge at ${viewport.width}px`).toBeLessThanOrEqual(
        viewport.height + 1,
      );
    }
    expect(result.starDpadOverlap).toBe(false);
    const renderer = await snapshot(page);
    expect(renderer.renderer.pixelRatio).toBeLessThanOrEqual(0.5);
    expect(renderer.renderer.visibleLabels).toBeLessThanOrEqual(1);
  }
});

test('stops at a solid obstacle instead of walking through it', async ({ page }) => {
  await page.goto('/?test=1&software=1');
  await activate(page, page.locator('#start-button'));
  const initial = await snapshot(page);
  const obstacles = initial.renderer.obstacles;
  const candidates = obstacles.filter(
    (obstacle) =>
      obstacle.z < -10 &&
      obstacle.z > -25 &&
      Math.abs(obstacle.x) > 14 &&
      Math.abs(obstacle.x) < 22,
  );
  const obstacle = candidates.find((candidate) => {
    const startX = candidate.x - Math.sign(candidate.x) * (candidate.radius + 1.5);
    return !obstacles.some((other) => {
      if (other === candidate) return false;
      const low = Math.min(startX, candidate.x);
      const high = Math.max(startX, candidate.x);
      return (
        Math.abs(other.z - candidate.z) < other.radius + 0.4 && other.x >= low && other.x <= high
      );
    });
  });
  expect(obstacle, 'a clear approach to a solid Meadow obstacle exists').toBeDefined();
  await page.evaluate(
    ({ x, z, radius }) => window.__game!.teleport(x - Math.sign(x) * (radius + 1.5), z),
    obstacle!,
  );
  await page.keyboard.down(obstacle!.x > 0 ? 'ArrowRight' : 'ArrowLeft');
  await expect
    .poll(async () => {
      const player = (await snapshot(page)).player;
      return Math.hypot(player.x - obstacle!.x, player.z - obstacle!.z);
    })
    .toBeLessThanOrEqual(obstacle!.radius + 0.8);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.up('ArrowRight');
  const player = (await snapshot(page)).player;
  const distance = Math.hypot(player.x - obstacle!.x, player.z - obstacle!.z);
  expect(distance).toBeGreaterThanOrEqual(obstacle!.radius + 0.3);
  expect(distance).toBeLessThanOrEqual(obstacle!.radius + 0.8);
});

test('rescues the first cage with the star button and keeps the fox after reload', async ({
  page,
}) => {
  await startGame(page);

  await page.evaluate(() => window.__game!.teleport(-7, -9));
  await activate(page, page.locator('#star-button'));
  await expect
    .poll(async () => (await snapshot(page)).rescued.includes('fox'), { timeout: rescueTimeout })
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
  test.setTimeout(process.env.CI ? 180_000 : 120_000);
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
      .poll(async () => (await snapshot(page)).rescued.includes(creature), {
        timeout: rescueTimeout,
      })
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
    .poll(async () => (await snapshot(page)).rescued.includes('giant-cow'), {
      timeout: rescueTimeout,
    })
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

test('reaches Desert by walking through Meadow’s east shortcut', async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => window.__game!.teleport(28, -27));
  await page.keyboard.down('ArrowUp');
  await expect.poll(async () => (await snapshot(page)).biome, { timeout: 6_000 }).toBe('desert');
  await page.keyboard.up('ArrowUp');
  await expect(page.locator('#biome-name')).toContainText('Wobble Dunes');
});

test('forward gates keep leading into new biomes', async ({ page }) => {
  test.setTimeout(45_000);
  await startGame(page);
  for (const destination of ['winter', 'savannah', 'desert']) {
    await page.evaluate(() => window.__game!.teleport(0, -35));
    await page.keyboard.down('ArrowUp');
    try {
      await expect
        .poll(async () => (await snapshot(page)).biome, { timeout: 10_000 })
        .toBe(destination);
    } finally {
      await page.keyboard.up('ArrowUp');
    }
  }
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
  await expect(page.locator('#boss-hearts > span')).toHaveCount(5);
  await expect(page.locator('#boss-hearts .full')).toHaveCount(5);
  await expect(page.locator('#boss-hearts > span').last()).toBeVisible();

  // Observe each DOM update in the same browser task as its hit. Automatic bounces
  // can advance before a separate cross-process assertion reads the previous count.
  await page.evaluate(() => {
    const hearts = document.querySelector('#boss-hearts')!;
    const history: NonNullable<Window['__bossHeartHistory']> = [];
    window.__bossHeartHistory = history;
    const record = () => {
      const boss = window.__game!.snapshot().boss;
      if (!boss || history.at(-1)?.hits === boss.hits) return;
      history.push({
        hits: boss.hits,
        full: hearts.querySelectorAll('.full').length,
        empty: hearts.querySelectorAll('.empty').length,
        slots: hearts.children.length,
      });
      if (boss.hits === 5) observer.disconnect();
    };
    const observer = new MutationObserver(record);
    record();
    observer.observe(hearts, { childList: true });
  });

  // One visible jump starts the five actual head hits and their forgiving auto-bounces.
  await activate(page, page.locator('#star-button'));
  await expect
    .poll(async () => (await snapshot(page)).defeated.includes('demon-lizard'), {
      timeout: process.env.CI ? 30_000 : 20_000,
    })
    .toBe(true);
  expect(await page.evaluate(() => window.__bossHeartHistory)).toEqual(
    Array.from({ length: 6 }, (_, hits) => ({ hits, full: 5 - hits, empty: hits, slots: 5 })),
  );

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
