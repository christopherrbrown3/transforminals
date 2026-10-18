import { expect, test } from '@playwright/test';

test('serves the cached PWA shell and bundled fox model offline', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.locator('#start-button')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.ready.then(() => true)))
    .toBe(true);
  // The first navigation installs the worker; reload once so this page is controlled by it.
  await page.reload();
  await expect(page.locator('#start-button')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), {
      timeout: 10_000,
    })
    .toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#start-button')).toBeVisible();

  const modelAvailableOffline = await page.evaluate(async () => {
    const response = await fetch('/models/fox.glb');
    return response.ok && response.headers.get('content-type')?.includes('model/gltf-binary');
  });
  expect(modelAvailableOffline).toBe(true);
});
