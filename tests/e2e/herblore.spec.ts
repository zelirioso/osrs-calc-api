import { test, expect } from '@playwright/test';

// docs/calculators/herblore.md worked example
const WORKED_EXAMPLE = {
  current_xp: 468437,
  target_level: 70,
  herbs: {
    guam: 22,
    marrentill: 59,
    tarromin: 208,
    harralander: 150,
    ranarr: 63,
    irit: 266,
    avantoe: 290,
    kwuarm: 344,
    snapdragon: 29,
    cadantine: 306,
    lantadyme: 77,
    toadflax: 4,
    dwarf_weed: 51,
    torstol: 10,
  },
};

test('fills the Herblore form and shows the worked example result', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('current-xp-input').fill(String(WORKED_EXAMPLE.current_xp));
  await page.getByTestId('target-level-input').fill(String(WORKED_EXAMPLE.target_level));

  for (const [herb, quantity] of Object.entries(WORKED_EXAMPLE.herbs)) {
    await page.getByTestId(`herb-input-${herb}`).fill(String(quantity));
  }

  await page.getByTestId('submit-button').click();

  await expect(page.getByTestId('xp-banked')).toHaveText('206297.5');
  await expect(page.getByTestId('xp-needed')).toHaveText('269190');
  await expect(page.getByTestId('xp-remaining')).toHaveText('62892.5');
  await expect(page.getByTestId('xp-surplus')).toHaveText('0');
});

test('blocks an out-of-range current_xp client-side instead of submitting it', async ({
  page,
}) => {
  await page.goto('/');

  const currentXpInput = page.getByTestId('current-xp-input');
  await currentXpInput.fill('200000001'); // one above the backend's le=200_000_000

  await page.getByTestId('submit-button').click();

  // the browser's native constraint validation should stop the submit
  // event from firing at all, so no fetch is ever sent
  await expect(page.getByTestId('result')).not.toBeVisible();
  await expect(page.getByTestId('error-message')).not.toBeVisible();

  const isRangeOverflow = await currentXpInput.evaluate(
    (el: HTMLInputElement) => el.validity.rangeOverflow,
  );
  expect(isRangeOverflow).toBe(true);
});

test('typing after the default "0" replaces it instead of prepending', async ({ page }) => {
  await page.goto('/');

  const currentXpInput = page.getByTestId('current-xp-input');
  await currentXpInput.click();
  await currentXpInput.press('End');
  await currentXpInput.pressSequentially('7'); // field starts at "0" -- naive state would show "07"

  await expect(currentXpInput).toHaveValue('7');
});
