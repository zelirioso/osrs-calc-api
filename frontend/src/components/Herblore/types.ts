export interface HerbQuantities {
  guam: number;
  marrentill: number;
  tarromin: number;
  harralander: number;
  ranarr: number;
  irit: number;
  avantoe: number;
  kwuarm: number;
  snapdragon: number;
  cadantine: number;
  lantadyme: number;
  toadflax: number;
  dwarf_weed: number;
  torstol: number;
}

// Matches app/calculators/herblore.py's XP_PER_POTION order
export const HERB_NAMES: (keyof HerbQuantities)[] = [
  'guam',
  'marrentill',
  'tarromin',
  'harralander',
  'ranarr',
  'irit',
  'avantoe',
  'kwuarm',
  'snapdragon',
  'cadantine',
  'lantadyme',
  'toadflax',
  'dwarf_weed',
  'torstol',
];

export interface HerbloreRequest {
  current_xp: number;
  target_level: number;
  herbs: HerbQuantities;
}

export interface HerbBreakdownItem {
  herb: string;
  quantity: number;
  xp_per_potion: number;
  xp: number;
}

export interface HerbloreResponse {
  xp_banked: number;
  xp_needed: number;
  xp_remaining: number;
  xp_surplus: number;
  breakdown: HerbBreakdownItem[];
}
