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
    toadflax: 4,
    irit: 266,
    avantoe: 290,
    kwuarm: 344,
    snapdragon: 29,
    cadantine: 306,
    lantadyme: 77,
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

  await expect(page.getByTestId('xp-banked')).toHaveText('206,297.5');
  await expect(page.getByTestId('xp-needed')).toHaveText('269,190');
  await expect(page.getByTestId('xp-remaining')).toHaveText('62,892.5');
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

test('entering a current level fills current XP with that level\'s starting threshold', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByTestId('current-level-input').fill('65');

  // level 65's threshold, not the worked example's 468437 -- a level is a
  // range of XP, so this can only ever be an approximation, not the exact
  // XP a player at some arbitrary point in level 65 actually has.
  await expect(page.getByTestId('current-xp-input')).toHaveValue('449428');
});

test('entering current XP fills current level with the level it falls in', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('current-xp-input').fill(String(WORKED_EXAMPLE.current_xp));

  // 468437 sits in level 65 (level 66 starts at 496,254) -- this direction
  // is exact, unlike level -> XP above.
  await expect(page.getByTestId('current-level-input')).toHaveValue('65');
});

test('submitting after only setting current level uses the auto-filled XP, not a stale value', async ({
  page,
}) => {
  await page.goto('/');

  // deliberately never touch current-xp-input directly -- only its
  // auto-fill from current level should reach the request
  await page.getByTestId('current-level-input').fill('65');
  await page.getByTestId('target-level-input').fill('70');

  await page.getByTestId('submit-button').click();

  // level 65's threshold is 449428. If the untouched default (0) had
  // been sent instead, xp_needed would be 737627, not 288199.
  await expect(page.getByTestId('xp-needed')).toHaveText('288,199');
  await expect(page.getByTestId('xp-remaining')).toHaveText('288,199');
});
