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

  await expect(page.getByTestId('xp-banked')).toHaveText('205142.5');
  await expect(page.getByTestId('xp-needed')).toHaveText('269190');
  await expect(page.getByTestId('xp-remaining')).toHaveText('64047.5');
  await expect(page.getByTestId('xp-surplus')).toHaveText('0');
});
