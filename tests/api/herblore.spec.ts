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
});

test.describe('POST /api/calculators/herblore validation', () => {
  test('422s when a herb field is missing', async ({ request }) => {
    const { torstol: _torstol, ...incompleteHerbs } = WORKED_EXAMPLE_REQUEST.herbs;

    const response = await request.post('/api/calculators/herblore', {
      data: { ...WORKED_EXAMPLE_REQUEST, herbs: incompleteHerbs },
    });

    expect(response.status()).toBe(422);
  });

  test('422s on an unexpected top-level field', async ({ request }) => {
    const response = await request.post('/api/calculators/herblore', {
      data: { ...WORKED_EXAMPLE_REQUEST, extra_field: 'unexpected' },
    });

    expect(response.status()).toBe(422);
  });

  test('422s on an unexpected herb field (e.g. a typo)', async ({ request }) => {
    const response = await request.post('/api/calculators/herblore', {
      data: {
        ...WORKED_EXAMPLE_REQUEST,
        herbs: { ...WORKED_EXAMPLE_REQUEST.herbs, dwarfweed: 51 },
      },
    });

    expect(response.status()).toBe(422);
  });

  test('422s on a negative herb quantity', async ({ request }) => {
    const response = await request.post('/api/calculators/herblore', {
      data: {
        ...WORKED_EXAMPLE_REQUEST,
        herbs: { ...WORKED_EXAMPLE_REQUEST.herbs, guam: -1 },
      },
    });

    expect(response.status()).toBe(422);
  });

  const invalidBoundaryCases: Record<string, Record<string, unknown>> = {
    'current_xp below its minimum (ge=0)': { current_xp: -1 },
    'current_xp above its maximum (le=200_000_000)': { current_xp: 200_000_001 },
    'target_level below its minimum (ge=1)': { target_level: 0 },
    'target_level above its maximum (le=99)': { target_level: 100 },
  };

  for (const [description, overrides] of Object.entries(invalidBoundaryCases)) {
    test(`422s: ${description}`, async ({ request }) => {
      const response = await request.post('/api/calculators/herblore', {
        data: { ...WORKED_EXAMPLE_REQUEST, ...overrides },
      });

      expect(response.status()).toBe(422);
    });
  }

  test('accepts current_xp and target_level at their lower boundaries', async ({ request }) => {
    const response = await request.post('/api/calculators/herblore', {
      data: { ...WORKED_EXAMPLE_REQUEST, current_xp: 0, target_level: 1 },
    });

    expect(response.status()).toBe(200);
  });

  test('accepts current_xp and target_level at their upper boundaries', async ({ request }) => {
    const response = await request.post('/api/calculators/herblore', {
      data: { ...WORKED_EXAMPLE_REQUEST, current_xp: 200_000_000, target_level: 99 },
    });

    expect(response.status()).toBe(200);
  });
});
