export interface FletchingRequest {
  current_xp: number;
  target_level: number;
  banked_arrow_shafts: number;
  feather_price: number;
  broad_arrowhead_price: number;
}

export interface FletchingResponse {
  xp_needed: number;
  logs_needed: number;
  shafts_used_from_banked: number;
  shafts_remaining_banked: number;
  feathers_needed: number;
  broad_arrowheads_needed: number;
  feather_cost: number;
  broad_arrowhead_cost: number;
  total_cost: number;
}
