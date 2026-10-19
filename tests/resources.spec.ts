import { expect, test, type Page } from '@playwright/test';

async function activate(page: Page, selector: string) {
  if (test.info().project.use.hasTouch) await page.locator(selector).tap();
  else await page.locator(selector).click();
}
async function start(page: Page) {
  await page.goto(process.env.CI ? '/?test=1&software=1' : '/?test=1');
  await activate(page, '#start-button');
  await expect(page.locator('#star-button')).toBeVisible();
}

test('releases region resources across three complete world circuits', async ({ page }) => {
  test.setTimeout(process.env.CI ? 120_000 : 90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await start(page);
  const samples: Array<Record<string, { geometries: number; textures: number }>> = [];
  for (let circuit = 0; circuit < 3; circuit++) {
    const results: Record<string, { geometries: number; textures: number }> = {};
    for (const biome of [
      'winter',
      'savannah',
      'desert',
      'beach',
      'ocean',
      'volcano',
      'underground',
      'rifts',
      'city',
      'meadow',
    ]) {
      results[biome] = await page.evaluate(async (id) => {
        if (!window.__game) throw new Error('Missing game API');
        window.__game.travel(id);
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        const { geometries, textures } = window.__game.snapshot().renderer;
        return { geometries, textures };
      }, biome);
    }
    samples.push(results);
  }
  for (const biome of Object.keys(samples[1])) {
    expect(samples[2][biome].geometries, biome).toBeLessThanOrEqual(
      samples[1][biome].geometries + 2,
    );
    expect(samples[2][biome].textures, biome).toBeLessThanOrEqual(samples[1][biome].textures + 1);
  }
  expect(errors).toEqual([]);
  await test.info().attach('renderer-circuit-counts', {
    body: JSON.stringify(samples, null, 2),
    contentType: 'application/json',
  });
});

test('keeps the rescued fox playable when the optional Blender model cannot load', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/models/fox.glb', (route) => route.abort());
  await start(page);
  await page.evaluate(() => window.__game?.teleport(-7, -9));
  await activate(page, '#star-button');
  await expect
    .poll(() => page.evaluate(() => window.__game?.snapshot().rescued), { timeout: 15_000 })
    .toEqual(['fox']);
  await activate(page, '[data-form="fox"]');
  await expect.poll(() => page.evaluate(() => window.__game?.snapshot().form)).toBe('fox');
  const before = await page.evaluate(() => window.__game!.snapshot().player.x);
  await page.keyboard.down('ArrowRight');
  await expect
    .poll(() => page.evaluate(() => window.__game!.snapshot().player.x))
    .toBeGreaterThan(before + 0.5);
  await page.keyboard.up('ArrowRight');
  expect(errors).toEqual([]);
});
