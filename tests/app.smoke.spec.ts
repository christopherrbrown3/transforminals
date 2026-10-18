import { expect, test } from '@playwright/test';

test('loads the Transforminals app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Transforminals/i);
  await expect(page.getByRole('heading', { name: /Transforminals/i })).toBeVisible();
});
