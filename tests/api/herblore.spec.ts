import { test, expect } from '@playwright/test';

// docs/calculators/herblore.md worked example
const WORKED_EXAMPLE_REQUEST = {
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

test.describe('POST /api/calculators/herblore', () => {
  test('returns the worked example from the spec', async ({ request }) => {
    const response = await request.post('/api/calculators/herblore', {
      data: WORKED_EXAMPLE_REQUEST,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.xp_banked).toBe(205142.5);
    expect(body.xp_needed).toBe(269190);
    expect(body.xp_remaining).toBe(64047.5);
    expect(body.xp_surplus).toBe(0.0);
  });

  test('422s when a herb field is missing', async ({ request }) => {
    const { torstol: _torstol, ...incompleteHerbs } = WORKED_EXAMPLE_REQUEST.herbs;

    const response = await request.post('/api/calculators/herblore', {
      data: { ...WORKED_EXAMPLE_REQUEST, herbs: incompleteHerbs },
    });

    expect(response.status()).toBe(422);
  });

  test('422s when target_level is out of range', async ({ request }) => {
    const response = await request.post('/api/calculators/herblore', {
      data: { ...WORKED_EXAMPLE_REQUEST, target_level: 150 },
    });

    expect(response.status()).toBe(422);
  });
});
