import { test, expect } from '@playwright/test';

test('fills the Giants\' Foundry form and shows the worked example ladders', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('nav-giants-foundry').click();

  await page.getByTestId('current-xp-input').fill('3599950');
  await page.getByTestId('target-level-input').fill('87');

  await page.getByTestId('item-input-mithril-full_helm').fill('63');
  await page.getByTestId('item-input-mithril-battleaxe').fill('32');
  await page.getByTestId('item-input-mithril-bars').fill('1499');
  await page.getByTestId('item-input-mithril-ore').fill('991');

  await page.getByTestId('item-input-adamant-scimitar').fill('19');
  await page.getByTestId('item-input-adamant-battleaxe').fill('256');
  await page.getByTestId('item-input-adamant-chainbody').fill('2');
  await page.getByTestId('item-input-adamant-kiteshield').fill('296');
  await page.getByTestId('item-input-adamant-platelegs').fill('32');
  await page.getByTestId('item-input-adamant-platebody').fill('45');
  await page.getByTestId('item-input-adamant-bars').fill('1495');
  await page.getByTestId('item-input-adamant-ore').fill('5328');

  await page.getByTestId('item-input-rune-bars').fill('215');
  await page.getByTestId('item-input-rune-ore').fill('736');

  await page.getByTestId('submit-button').click();

  const mithrilHeavyTable = page.getByTestId('mithril-heavy-ladder');
  await expect(mithrilHeavyTable).toBeVisible();

  const rows = mithrilHeavyTable.locator('tbody tr');
  await expect(rows).toHaveCount(2); // levels 86 (current) and 87 (target)

  const level87Row = rows.nth(1);
  await expect(level87Row.locator('td').nth(0)).toHaveText('87');
  await expect(level87Row.locator('td').nth(2)).toHaveText('24'); // swords needed

  const adamantRuneTable = page.getByTestId('adamant-rune-ladder');
  const adamantRuneLevel87 = adamantRuneTable.locator('tbody tr').nth(1);
  await expect(adamantRuneLevel87.locator('td').nth(2)).toHaveText('18'); // swords needed
});
