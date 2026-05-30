/**
 * Approximate Lowe's retail unit prices (USD) for common building materials.
 * Not affiliated with Lowe's; prices vary by store/region and change over time.
 * Source: typical in-store / lowes.com listings, rounded for estimates.
 */
export const LOWES_PRICE_UPDATED = '2025-05'

/** Map nominal length (ft) → price per piece */
export type LengthPriceTable = Record<number, number>

/** 2×4 SPF stud — Lowe's common SKU band */
export const STUD_2X4: LengthPriceTable = {
  8: 4.98,
  10: 6.48,
  12: 7.98,
  16: 10.98,
}

/** 2×6 stud */
export const STUD_2X6: LengthPriceTable = {
  8: 7.48,
  10: 9.48,
  12: 11.48,
  14: 13.98,
  16: 15.98,
}

/** 2×8 floor joist / rafter (heavier span) */
export const STUD_2X8: LengthPriceTable = {
  8: 9.98,
  10: 12.48,
  12: 14.98,
  14: 17.98,
  16: 22.98,
}

/** 2×4 or 2×6 plate (same lumber as stud at Lowe's) */
export const PLATE_2X4 = STUD_2X4
export const PLATE_2X6 = STUD_2X6

/** 4×4 treated post */
export const POST_4X4: LengthPriceTable = {
  8: 14.98,
  10: 18.98,
  12: 22.98,
  16: 28.98,
}

/** 6×6 treated post */
export const POST_6X6: LengthPriceTable = {
  8: 26.98,
  10: 34.98,
  12: 42.98,
  16: 54.98,
}

/** 4×4 treated beam / joist (same lumber family as posts) */
export const BEAM_4X4 = POST_4X4
export const BEAM_6X6 = POST_6X6

/** 4×6 pressure-treated girder */
export const BEAM_4X6: LengthPriceTable = {
  8: 18.98,
  10: 23.98,
  12: 28.98,
  14: 33.98,
  16: 42.98,
}

/** OSB / plywood sheet by nominal area (sq ft) */
export const SHEATHING_SHEET: Record<number, number> = {
  32: 16.98, // 4×8 7/16 OSB
  40: 22.98, // 4×10
  48: 28.98, // 4×12
}

export const PIER_BLOCK_EACH = 11.98
/** Sonotube + concrete mix estimate per pier */
export const SONO_CONCRETE_EACH = 24.98
export const POST_ANCHOR_EACH = 12.98
export const JOIST_HANGER_EACH = 2.75
/** 3/4" PT tongue-and-groove subfloor, 4×8 sheet */
export const SUBFLOOR_TG_SHEET_4X8 = 42.98
export const SLAB_MATERIAL_PER_SQ_FT = 4.25 // bags/mix + mesh estimate

// ---- Rough add-ons to make estimates more realistic ----
export const DOOR_PREHUNG_36x80_EACH = 198
export const DOOR_DOUBLE_60x80_EACH = 399
export const DOOR_HARDWARE_SET_EACH = 28

export const WINDOW_VINYL_24x36_EACH = 89
export const WINDOW_VINYL_36x36_EACH = 129

// Panel siding priced per 4×8 sheet (32 sq ft). These are coarse averages.
export const SIDING_T111_SHEET_4X8 = 49
export const SIDING_LP_SMARTSIDE_SHEET_4X8 = 58

// Housewrap (9' x 150' roll ~ 1350 sq ft)
export const HOUSEWRAP_ROLL_SQ_FT = 1350
export const HOUSEWRAP_ROLL_PRICE = 169

// Interior finishes per 4×8 sheet (32 sq ft)
export const INTERIOR_OSB_SHEET_4X8 = 17.5
export const INTERIOR_DRYWALL_SHEET_4X8 = 14.5

// Insulation (R-13-ish batts), priced per sq ft (very rough)
export const INSULATION_PER_SQ_FT = 1.15

// Fasteners / connectors
export const NAILS_BOX_5LB_FRAMING = 22
export const NAILS_BOX_5LB_SHEATHING = 21
export const CONNECTOR_EACH_AVG = 2.25
export const HURRICANE_TIE_EACH = 2.25

// Roofing (metal panels system) + weatherproofing
export const ROOF_UNDERLAYMENT_PER_SQ_FT = 0.12
export const ROOF_DRIP_EDGE_PER_FT = 0.85
export const ROOF_METAL_PANEL_EACH = 38
export const ROOF_RIDGE_CAP_PER_FT = 3.25
export const ROOF_CLOSURE_STRIP_PER_FT = 0.65
export const ROOF_SCREW_EACH = 0.08
/** Architectural shingles, installed — per roof sq ft (very rough) */
export const ROOF_SHINGLES_PER_SQ_FT = 1.35
export const ROOF_SHINGLE_NAIL_BOX_EACH = 24

export const FLASHING_TAPE_ROLL_EACH = 22
export const HOUSEWRAP_TAPE_ROLL_EACH = 12
export const EXTERIOR_CAULK_TUBE_EACH = 5.5
export const SPRAY_FOAM_CAN_EACH = 6.5

// Adhesive + anchors
export const CONSTRUCTION_ADHESIVE_TUBE_EACH = 4.75
export const ANCHOR_BOLT_EACH = 2.75
export const ANCHOR_STRAP_EACH = 4.5

// Ventilation
export const GABLE_VENT_EACH = 18

// Trim + finish + site
export const TRIM_BOARD_PER_FT = 1.25
export const PAINT_GAL_EACH = 38
export const GRAVEL_PER_CU_FT = 0.22

// Electrical (very rough)
export const ROMEX_PER_FT = 0.85
export const OUTLET_EACH = 1.65
export const SWITCH_EACH = 1.75
export const LIGHT_FIXTURE_EACH = 18
export const ELECTRICAL_BOX_EACH = 1.15
export const BREAKER_EACH = 9.5
