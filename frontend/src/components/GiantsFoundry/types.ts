export interface ItemQuantities {
  scimitar: number;
  longsword: number;
  full_helm: number;
  square_shield: number;
  claws: number;
  warhammer: number;
  battleaxe: number;
  chainbody: number;
  kiteshield: number;
  two_handed_sword: number;
  platelegs: number;
  plateskirt: number;
  platebody: number;
  bars: number;
  ore: number;
}

// Matches app/calculators/giants_foundry.py's BARS_PER_ITEM order
export const ITEM_NAMES: (keyof ItemQuantities)[] = [
  'scimitar',
  'longsword',
  'full_helm',
  'square_shield',
  'claws',
  'warhammer',
  'battleaxe',
  'chainbody',
  'kiteshield',
  'two_handed_sword',
  'platelegs',
  'plateskirt',
  'platebody',
  'bars',
  'ore',
];

export interface GiantsFoundryRequest {
  current_xp: number;
  target_level: number;
  mithril_items: ItemQuantities;
  adamant_items: ItemQuantities;
  rune_items: ItemQuantities;
  mithril_adamant_avg_xp: number;
  adamant_mithril_avg_xp: number;
  adamant_rune_avg_xp: number;
}

export interface MithrilAdamantRow {
  level: number;
  xp_needed: number;
  swords_needed: number;
  mithril_bars_needed: number;
  mithril_bars_remaining: number;
  adamant_bars_needed: number;
  adamant_bars_remaining: number;
}

export interface AdamantRuneRow {
  level: number;
  xp_needed: number;
  swords_needed: number;
  adamant_bars_needed: number;
  adamant_bars_remaining: number;
  rune_bars_needed: number;
  rune_bars_remaining: number;
}

export interface GiantsFoundryResponse {
  mithril_heavy_ladder: MithrilAdamantRow[];
  adamant_heavy_ladder: MithrilAdamantRow[];
  adamant_rune_ladder: AdamantRuneRow[];
}
