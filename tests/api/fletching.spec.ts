import { test, expect } from '@playwright/test';

// docs/calculators/fletching.md worked example A
const WORKED_EXAMPLE_REQUEST = {
  current_xp: 2239474,
  target_level: 90,
};

test.describe('POST /api/calculators/fletching', () => {
  test('returns worked example A from the spec', async ({ request }) => {
    const response = await request.post('/api/calculators/fletching', {
      data: WORKED_EXAMPLE_REQUEST,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.xp_needed).toBe(3106858);
    expect(body.logs_needed).toBe(4569);
    expect(body.shafts_used_from_banked).toBe(0);
    expect(body.shafts_remaining_banked).toBe(0);
    expect(body.feathers_needed).toBe(274140);
    expect(body.broad_arrowheads_needed).toBe(274140);
    expect(body.feather_cost).toBe(962203.986);
    expect(body.broad_arrowhead_cost).toBe(15077700.0);
    expect(body.total_cost).toBe(16039903.986);
  });

  test('returns worked example B with banked arrow shafts', async ({ request }) => {
    const response = await request.post('/api/calculators/fletching', {
      data: { ...WORKED_EXAMPLE_REQUEST, banked_arrow_shafts: 50000 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.logs_needed).toBe(3761);
    expect(body.shafts_used_from_banked).toBe(50000);
    expect(body.feathers_needed).toBe(275660);
    expect(body.total_cost).toBe(16128839.034);
  });
});

test.describe('POST /api/calculators/fletching validation', () => {
  test('422s when target_level is missing', async ({ request }) => {
    const response = await request.post('/api/calculators/fletching', {
      data: { current_xp: 2239474 },
    });

    expect(response.status()).toBe(422);
  });

  test('422s on an unexpected top-level field', async ({ request }) => {
    const response = await request.post('/api/calculators/fletching', {
      data: { ...WORKED_EXAMPLE_REQUEST, extra_field: 'unexpected' },
    });

    expect(response.status()).toBe(422);
  });

  const invalidBoundaryCases: Record<string, Record<string, unknown>> = {
    'current_xp below its minimum (ge=0)': { current_xp: -1 },
    'current_xp above its maximum (le=200_000_000)': { current_xp: 200_000_001 },
    'target_level below its minimum (ge=1)': { target_level: 0 },
    'target_level above its maximum (le=99)': { target_level: 100 },
    'negative banked_arrow_shafts': { banked_arrow_shafts: -1 },
    'negative feather_price': { feather_price: -1 },
    'negative broad_arrowhead_price': { broad_arrowhead_price: -1 },
  };

  for (const [description, overrides] of Object.entries(invalidBoundaryCases)) {
    test(`422s: ${description}`, async ({ request }) => {
      const response = await request.post('/api/calculators/fletching', {
        data: { ...WORKED_EXAMPLE_REQUEST, ...overrides },
      });

      expect(response.status()).toBe(422);
    });
  }

  test('accepts current_xp and target_level at their lower boundaries', async ({ request }) => {
    const response = await request.post('/api/calculators/fletching', {
      data: { current_xp: 0, target_level: 1 },
    });

    expect(response.status()).toBe(200);
  });

  test('accepts current_xp and target_level at their upper boundaries', async ({ request }) => {
    const response = await request.post('/api/calculators/fletching', {
      data: { current_xp: 200_000_000, target_level: 99 },
    });

    expect(response.status()).toBe(200);
  });
});
