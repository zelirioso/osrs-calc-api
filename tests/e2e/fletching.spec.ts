import { test, expect } from '@playwright/test';

test('fills the Fletching form and shows worked example A', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('nav-fletching').click();

  await page.getByTestId('current-xp-input').fill('2239474');
  await page.getByTestId('target-level-input').fill('90');

  await page.getByTestId('submit-button').click();

  await expect(page.getByTestId('xp-needed')).toHaveText('3,106,858');
  await expect(page.getByTestId('logs-needed')).toHaveText('4,569');
  await expect(page.getByTestId('shafts-used-from-banked')).toHaveText('0');
  await expect(page.getByTestId('shafts-remaining-banked')).toHaveText('0');
  await expect(page.getByTestId('feathers-needed')).toHaveText('274,140');
  await expect(page.getByTestId('broad-arrowheads-needed')).toHaveText('274,140');
  await expect(page.getByTestId('total-cost')).toHaveText('16,039,903.986');
});

test('banked arrow shafts reduce logs needed', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('nav-fletching').click();

  await page.getByTestId('current-xp-input').fill('2239474');
  await page.getByTestId('target-level-input').fill('90');
  await page.getByTestId('banked-arrow-shafts-input').fill('50000');

  await page.getByTestId('submit-button').click();

  await expect(page.getByTestId('logs-needed')).toHaveText('3,761');
  await expect(page.getByTestId('shafts-used-from-banked')).toHaveText('50,000');
  await expect(page.getByTestId('feathers-needed')).toHaveText('275,660');
});

test('switching calculators preserves neither form (fresh state each time)', async ({ page }) => {
  await page.goto('/');

  // Herblore is the default view
  await expect(page.getByTestId('current-xp-input')).toHaveValue('0');

  await page.getByTestId('nav-fletching').click();
  await expect(page.getByTestId('current-xp-input')).toHaveValue('0');
  await expect(page.getByTestId('banked-arrow-shafts-input')).toHaveValue('0');

  await page.getByTestId('nav-herblore').click();
  await expect(page.getByTestId('herb-input-guam')).toBeVisible();
});
