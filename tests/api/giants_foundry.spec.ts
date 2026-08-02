import { test, expect } from '@playwright/test';

const ZERO_ITEMS = {
  scimitar: 0,
  longsword: 0,
  full_helm: 0,
  square_shield: 0,
  claws: 0,
  warhammer: 0,
  battleaxe: 0,
  chainbody: 0,
  kiteshield: 0,
  two_handed_sword: 0,
  platelegs: 0,
  plateskirt: 0,
  platebody: 0,
  bars: 0,
  ore: 0,
};

// docs/calculators/giants_foundry.md worked example
const WORKED_EXAMPLE_REQUEST = {
  current_xp: 3599950,
  target_level: 99,
  mithril_items: { ...ZERO_ITEMS, full_helm: 63, battleaxe: 32, bars: 1499, ore: 991 },
  adamant_items: {
    ...ZERO_ITEMS,
    scimitar: 19,
    battleaxe: 256,
    chainbody: 2,
    kiteshield: 296,
    platelegs: 32,
    platebody: 45,
    bars: 1495,
    ore: 5328,
  },
  rune_items: { ...ZERO_ITEMS, bars: 215, ore: 736 },
};

test.describe('POST /api/calculators/giants-foundry', () => {
  test('returns the worked example ladder from the spec', async ({ request }) => {
    const response = await request.post('/api/calculators/giants-foundry', {
      data: WORKED_EXAMPLE_REQUEST,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.mithril_heavy_ladder).toHaveLength(14);
    expect(body.mithril_heavy_ladder[0]).toMatchObject({
      level: 86,
      xp_needed: 0,
      swords_needed: 0,
      mithril_bars_remaining: 2617,
      adamant_bars_remaining: 8194,
    });
    // level 91: mithril first goes negative -- the sheet's whole point
    expect(body.mithril_heavy_ladder[5]).toMatchObject({
      level: 91,
      swords_needed: 148,
      mithril_bars_remaining: -47,
    });

    const level87 = body.adamant_rune_ladder.find((row: { level: number }) => row.level === 87);
    expect(level87).toMatchObject({
      swords_needed: 18,
      adamant_bars_needed: 324,
      rune_bars_needed: 180,
      rune_bars_remaining: 771,
    });
  });
});

test.describe('POST /api/calculators/giants-foundry validation', () => {
  test('422s when a required field is missing', async ({ request }) => {
    const { rune_items: _rune_items, ...incomplete } = WORKED_EXAMPLE_REQUEST;

    const response = await request.post('/api/calculators/giants-foundry', {
      data: incomplete,
    });

    expect(response.status()).toBe(422);
  });

  test('422s on an unexpected top-level field', async ({ request }) => {
    const response = await request.post('/api/calculators/giants-foundry', {
      data: { ...WORKED_EXAMPLE_REQUEST, extra_field: 'unexpected' },
    });

    expect(response.status()).toBe(422);
  });

  test('422s on a negative item quantity', async ({ request }) => {
    const response = await request.post('/api/calculators/giants-foundry', {
      data: {
        ...WORKED_EXAMPLE_REQUEST,
        mithril_items: { ...WORKED_EXAMPLE_REQUEST.mithril_items, full_helm: -1 },
      },
    });

    expect(response.status()).toBe(422);
  });

  test('422s on a zero average XP per sword', async ({ request }) => {
    const response = await request.post('/api/calculators/giants-foundry', {
      data: { ...WORKED_EXAMPLE_REQUEST, mithril_adamant_avg_xp: 0 },
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
      const response = await request.post('/api/calculators/giants-foundry', {
        data: { ...WORKED_EXAMPLE_REQUEST, ...overrides },
      });

      expect(response.status()).toBe(422);
    });
  }

  test('accepts a request with all-zero item quantities', async ({ request }) => {
    const response = await request.post('/api/calculators/giants-foundry', {
      data: {
        current_xp: 0,
        target_level: 5,
        mithril_items: ZERO_ITEMS,
        adamant_items: ZERO_ITEMS,
        rune_items: ZERO_ITEMS,
      },
    });

    expect(response.status()).toBe(200);
  });
});
