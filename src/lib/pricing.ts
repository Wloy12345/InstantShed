import {
  ANCHOR_BOLT_EACH,
  ANCHOR_STRAP_EACH,
  BEAM_4X4,
  BEAM_4X6,
  BEAM_6X6,
  BREAKER_EACH,
  CONNECTOR_EACH_AVG,
  HURRICANE_TIE_EACH,
  CONSTRUCTION_ADHESIVE_TUBE_EACH,
  DOOR_DOUBLE_60x80_EACH,
  DOOR_HARDWARE_SET_EACH,
  DOOR_PREHUNG_36x80_EACH,
  ELECTRICAL_BOX_EACH,
  EXTERIOR_CAULK_TUBE_EACH,
  FLASHING_TAPE_ROLL_EACH,
  GABLE_VENT_EACH,
  GRAVEL_PER_CU_FT,
  HOUSEWRAP_ROLL_PRICE,
  HOUSEWRAP_ROLL_SQ_FT,
  HOUSEWRAP_TAPE_ROLL_EACH,
  INSULATION_PER_SQ_FT,
  INTERIOR_DRYWALL_SHEET_4X8,
  INTERIOR_OSB_SHEET_4X8,
  LIGHT_FIXTURE_EACH,
  LOWES_PRICE_UPDATED,
  NAILS_BOX_5LB_FRAMING,
  NAILS_BOX_5LB_SHEATHING,
  OUTLET_EACH,
  PAINT_GAL_EACH,
  JOIST_HANGER_EACH,
  PIER_BLOCK_EACH,
  POST_ANCHOR_EACH,
  SONO_CONCRETE_EACH,
  SUBFLOOR_TG_SHEET_4X8,
  PLATE_2X4,
  PLATE_2X6,
  POST_4X4,
  POST_6X6,
  ROMEX_PER_FT,
  ROOF_CLOSURE_STRIP_PER_FT,
  ROOF_DRIP_EDGE_PER_FT,
  ROOF_METAL_PANEL_EACH,
  ROOF_RIDGE_CAP_PER_FT,
  ROOF_SCREW_EACH,
  ROOF_SHINGLES_PER_SQ_FT,
  ROOF_SHINGLE_NAIL_BOX_EACH,
  ROOF_UNDERLAYMENT_PER_SQ_FT,
  SHEATHING_SHEET,
  SIDING_LP_SMARTSIDE_SHEET_4X8,
  SIDING_T111_SHEET_4X8,
  SLAB_MATERIAL_PER_SQ_FT,
  SPRAY_FOAM_CAN_EACH,
  STUD_2X4,
  STUD_2X6,
  STUD_2X8,
  SWITCH_EACH,
  TRIM_BOARD_PER_FT,
  WINDOW_VINYL_24x36_EACH,
  WINDOW_VINYL_36x36_EACH,
  type LengthPriceTable,
} from '../data/lowesCatalog'
import type { PostSize, Project, ShoppingLine, StudSize } from '../types/project'

export interface PricedShoppingLine extends ShoppingLine {
  unitPriceUsd: number | null
  lineTotalUsd: number | null
  priceSkuNote: string | null
}

export interface BuildEstimate {
  lines: PricedShoppingLine[]
  subtotalUsd: number
  pricedLineCount: number
  unpricedLineCount: number
  priceSourceNote: string
}

const STANDARD_LENGTHS = [8, 10, 12, 16] as const

export function nearestStandardLengthFt(lengthFt: number): number {
  if (lengthFt <= 0) return 8
  let best: number = STANDARD_LENGTHS[0]
  for (const len of STANDARD_LENGTHS) {
    if (Math.abs(len - lengthFt) < Math.abs(best - lengthFt)) best = len
  }
  return best
}

function priceFromTable(table: LengthPriceTable, lengthFt: number): number {
  const nominal = nearestStandardLengthFt(lengthFt)
  return table[nominal] ?? table[8]
}

function ptJoistOrRafterTable(line: ShoppingLine): LengthPriceTable {
  return line.name.includes('2×8') ? STUD_2X8 : STUD_2X6
}

function sheathingSheetPrice(sheetSqFt: number): number {
  if (SHEATHING_SHEET[sheetSqFt] != null) return SHEATHING_SHEET[sheetSqFt]
  const nominal = nearestStandardLengthFt(sheetSqFt / 4) * 4 // rough 4' width sheets
  const area = nominal * 8
  return SHEATHING_SHEET[area] ?? SHEATHING_SHEET[32]
}

function postSize(project: Project): PostSize {
  return project.foundation.postSize ?? '6x6'
}

function postTable(size: PostSize): LengthPriceTable {
  return size === '4x4' ? POST_4X4 : POST_6X6
}

function beamTable(size: PostSize): LengthPriceTable {
  return size === '4x4' ? BEAM_4X4 : BEAM_6X6
}

function studTable(size: StudSize): LengthPriceTable {
  return size === '2x4' ? STUD_2X4 : STUD_2X6
}

function plateTable(size: StudSize): LengthPriceTable {
  return size === '2x4' ? PLATE_2X4 : PLATE_2X6
}

function panelSidingSheetPrice(project: Project): number {
  switch (project.siding.type) {
    case 'lp_smartside_4x8':
      return SIDING_LP_SMARTSIDE_SHEET_4X8
    case 't111_4x8':
      return SIDING_T111_SHEET_4X8
    default:
      return SIDING_T111_SHEET_4X8
  }
}

function interiorSheetPrice(project: Project): number {
  switch (project.interior.finish) {
    case 'drywall_1_2_4x8':
      return INTERIOR_DRYWALL_SHEET_4X8
    case 'osb_7_16_4x8':
      return INTERIOR_OSB_SHEET_4X8
    default:
      return INTERIOR_OSB_SHEET_4X8
  }
}

export function getLowesUnitPrice(
  line: ShoppingLine,
  project: Project,
): { unitPriceUsd: number; priceSkuNote: string } | null {
  const len = line.effectiveStockFt > 0 ? line.effectiveStockFt : (line.stockLengthFt ?? 8)
  const nominal = nearestStandardLengthFt(len)
  const ps = postSize(project)
  const stud = project.framing.studSize

  switch (line.stockKey) {
    case 'roofing.underlayment':
      return {
        unitPriceUsd: ROOF_UNDERLAYMENT_PER_SQ_FT,
        priceSkuNote: "Lowe's est. underlayment / sq ft",
      }
    case 'roofing.drip_edge':
      return {
        unitPriceUsd: ROOF_DRIP_EDGE_PER_FT,
        priceSkuNote: "Lowe's est. drip edge / ft",
      }
    case 'roofing.metal_panels':
      return {
        unitPriceUsd: ROOF_METAL_PANEL_EACH,
        priceSkuNote: "Lowe's est. metal panel (each)",
      }
    case 'roofing.ridge_cap':
      return {
        unitPriceUsd: ROOF_RIDGE_CAP_PER_FT,
        priceSkuNote: "Lowe's est. ridge cap / ft",
      }
    case 'roofing.closure_strips':
      return {
        unitPriceUsd: ROOF_CLOSURE_STRIP_PER_FT,
        priceSkuNote: "Lowe's est. closure strip / ft",
      }
    case 'roofing.screws':
      return {
        unitPriceUsd: ROOF_SCREW_EACH,
        priceSkuNote: "Lowe's est. roofing screw (each)",
      }
    case 'roofing.shingles':
      return {
        unitPriceUsd: ROOF_SHINGLES_PER_SQ_FT,
        priceSkuNote: "Lowe's est. asphalt shingles / sq ft",
      }
    case 'roofing.shingle_nails':
      return {
        unitPriceUsd: ROOF_SHINGLE_NAIL_BOX_EACH,
        priceSkuNote: "Lowe's est. roofing nail box (5 lb)",
      }
    case 'weather.flashing_tape':
      return {
        unitPriceUsd: FLASHING_TAPE_ROLL_EACH,
        priceSkuNote: "Lowe's est. flashing tape roll",
      }
    case 'weather.housewrap_tape':
      return {
        unitPriceUsd: HOUSEWRAP_TAPE_ROLL_EACH,
        priceSkuNote: "Lowe's est. housewrap tape roll",
      }
    case 'weather.caulk':
      return {
        unitPriceUsd: EXTERIOR_CAULK_TUBE_EACH,
        priceSkuNote: "Lowe's est. exterior caulk tube",
      }
    case 'weather.spray_foam':
      return {
        unitPriceUsd: SPRAY_FOAM_CAN_EACH,
        priceSkuNote: "Lowe's est. spray foam can",
      }
    case 'hardware.construction_adhesive':
      return {
        unitPriceUsd: CONSTRUCTION_ADHESIVE_TUBE_EACH,
        priceSkuNote: "Lowe's est. construction adhesive tube",
      }
    case 'hardware.anchor_bolts':
      return {
        unitPriceUsd: ANCHOR_BOLT_EACH,
        priceSkuNote: "Lowe's est. concrete anchor/bolt",
      }
    case 'hardware.anchor_straps':
      return {
        unitPriceUsd: ANCHOR_STRAP_EACH,
        priceSkuNote: "Lowe's est. anchor strap/tie-down",
      }
    case 'vent.gable_vent':
      return {
        unitPriceUsd: GABLE_VENT_EACH,
        priceSkuNote: "Lowe's est. gable vent",
      }
    case 'trim.corner_boards':
    case 'trim.fascia':
    case 'trim.rake':
      return {
        unitPriceUsd: TRIM_BOARD_PER_FT,
        priceSkuNote: "Lowe's est. trim board / ft",
      }
    case 'finish.paint':
      return {
        unitPriceUsd: PAINT_GAL_EACH,
        priceSkuNote: "Lowe's est. paint/stain (gal)",
      }
    case 'site.gravel':
      return {
        unitPriceUsd: GRAVEL_PER_CU_FT,
        priceSkuNote: "Lowe's est. gravel / cu ft",
      }
    case 'electrical.romex':
      return {
        unitPriceUsd: ROMEX_PER_FT,
        priceSkuNote: "Lowe's est. NM-B cable / ft",
      }
    case 'electrical.outlet':
      return {
        unitPriceUsd: OUTLET_EACH,
        priceSkuNote: "Lowe's est. duplex outlet",
      }
    case 'electrical.switch':
      return {
        unitPriceUsd: SWITCH_EACH,
        priceSkuNote: "Lowe's est. light switch",
      }
    case 'electrical.light':
      return {
        unitPriceUsd: LIGHT_FIXTURE_EACH,
        priceSkuNote: "Lowe's est. light fixture",
      }
    case 'electrical.box':
      return {
        unitPriceUsd: ELECTRICAL_BOX_EACH,
        priceSkuNote: "Lowe's est. electrical box",
      }
    case 'electrical.breaker':
      return {
        unitPriceUsd: BREAKER_EACH,
        priceSkuNote: "Lowe's est. breaker",
      }
    case 'openings.door':
      return {
        unitPriceUsd:
          project.openings.doorType === 'double_60x80'
            ? DOOR_DOUBLE_60x80_EACH
            : DOOR_PREHUNG_36x80_EACH,
        priceSkuNote:
          project.openings.doorType === 'double_60x80'
            ? "Lowe's est. 60×80 double door"
            : "Lowe's est. 36×80 prehung door",
      }
    case 'openings.door_hardware':
      return {
        unitPriceUsd: DOOR_HARDWARE_SET_EACH,
        priceSkuNote: "Lowe's est. lock/hinge set",
      }
    case 'openings.window':
      return {
        unitPriceUsd:
          project.openings.windowType === 'vinyl_36x36'
            ? WINDOW_VINYL_36x36_EACH
            : WINDOW_VINYL_24x36_EACH,
        priceSkuNote:
          project.openings.windowType === 'vinyl_36x36'
            ? "Lowe's est. vinyl 36×36 window"
            : "Lowe's est. vinyl 24×36 window",
      }
    case 'exterior.siding':
      return {
        unitPriceUsd: panelSidingSheetPrice(project),
        priceSkuNote:
          project.siding.type === 'lp_smartside_4x8'
            ? "Lowe's est. LP SmartSide 4×8"
            : "Lowe's est. T1-11 4×8",
      }
    case 'exterior.housewrap':
      return {
        unitPriceUsd: Math.round((HOUSEWRAP_ROLL_PRICE / HOUSEWRAP_ROLL_SQ_FT) * 100) / 100,
        priceSkuNote: "Lowe's est. housewrap (per sq ft)",
      }
    case 'interior.wall_finish':
      return {
        unitPriceUsd: interiorSheetPrice(project),
        priceSkuNote:
          project.interior.finish === 'drywall_1_2_4x8'
            ? "Lowe's est. drywall 4×8"
            : "Lowe's est. OSB 4×8",
      }
    case 'interior.insulation':
      return {
        unitPriceUsd: INSULATION_PER_SQ_FT,
        priceSkuNote: "Lowe's est. insulation per sq ft",
      }
    case 'hardware.framing_nails':
      return {
        unitPriceUsd: NAILS_BOX_5LB_FRAMING,
        priceSkuNote: "Lowe's est. 5lb framing nails",
      }
    case 'hardware.sheathing_nails':
      return {
        unitPriceUsd: NAILS_BOX_5LB_SHEATHING,
        priceSkuNote: "Lowe's est. 5lb sheathing nails",
      }
    case 'hardware.connectors':
      return {
        unitPriceUsd: CONNECTOR_EACH_AVG,
        priceSkuNote: "Lowe's est. connector/tie (avg)",
      }
    case 'foundation.post':
    case 'foundation.timber_pier':
    case 'foundation.pier_post':
      return {
        unitPriceUsd: priceFromTable(postTable(ps), len),
        priceSkuNote: `Lowe's est. ${ps}×${nominal}' treated`,
      }
    case 'foundation.sono_concrete':
      return {
        unitPriceUsd: SONO_CONCRETE_EACH,
        priceSkuNote: "Lowe's est. sonotube + concrete mix",
      }
    case 'foundation.post_anchor':
      return {
        unitPriceUsd: POST_ANCHOR_EACH,
        priceSkuNote: "Lowe's est. post anchor bracket",
      }
    case 'foundation.pier_block':
      return {
        unitPriceUsd: PIER_BLOCK_EACH,
        priceSkuNote: "Lowe's est. concrete deck block",
      }
    case 'foundation.girder_4x6':
      return {
        unitPriceUsd: priceFromTable(BEAM_4X6, len),
        priceSkuNote: `Lowe's est. 4×6×${nominal}' PT girder`,
      }
    case 'foundation.perimeter_beam':
    case 'foundation.interior_beam':
    case 'foundation.skids':
      return {
        unitPriceUsd: priceFromTable(beamTable(ps), len),
        priceSkuNote: `Lowe's est. ${ps}×${nominal}' treated`,
      }
    case 'floor.rim_joist':
    case 'floor.joists': {
      const table = ptJoistOrRafterTable(line)
      const dim = line.name.includes('2×8') ? '2×8' : '2×6'
      return {
        unitPriceUsd: priceFromTable(table, len),
        priceSkuNote: `Lowe's est. ${dim}×${nominal}' PT joist`,
      }
    }
    case 'hardware.joist_hanger':
      return {
        unitPriceUsd: JOIST_HANGER_EACH,
        priceSkuNote: "Lowe's est. joist hanger",
      }
    case 'hardware.hurricane_tie':
      return {
        unitPriceUsd: HURRICANE_TIE_EACH,
        priceSkuNote: "Lowe's est. hurricane tie / rafter connector",
      }
    case 'roofing.rafters': {
      const table = ptJoistOrRafterTable(line)
      const dim = line.name.includes('2×8') ? '2×8' : '2×6'
      return {
        unitPriceUsd: priceFromTable(table, len),
        priceSkuNote: `Lowe's est. ${dim}×${nominal}' rafter`,
      }
    }
    case 'roofing.ridge_board':
      return {
        unitPriceUsd: priceFromTable(STUD_2X6, len),
        priceSkuNote: `Lowe's est. 2×6×${nominal}' ridge board`,
      }
    case 'framing.studs':
      return {
        unitPriceUsd: priceFromTable(studTable(stud), len),
        priceSkuNote: `Lowe's est. ${stud}×${nominal}' stud`,
      }
    case 'framing.plates':
      return {
        unitPriceUsd: priceFromTable(plateTable(stud), len),
        priceSkuNote: `Lowe's est. ${stud}×${nominal}' plate`,
      }
    case 'floor.decking':
    case 'walls.sheathing':
    case 'roofing.sheathing':
      return {
        unitPriceUsd: sheathingSheetPrice(len),
        priceSkuNote: `Lowe's est. sheathing ~${len} sq ft/sheet`,
      }
    case 'floor.subfloor':
      return {
        unitPriceUsd: SUBFLOOR_TG_SHEET_4X8,
        priceSkuNote: "Lowe's est. 3/4\" T&G subfloor 4×8",
      }
    case 'foundation.slab':
      return {
        unitPriceUsd: SLAB_MATERIAL_PER_SQ_FT,
        priceSkuNote: "Lowe's est. concrete materials / sq ft",
      }
    default:
      return null
  }
}

function roundUsd(amount: number): number {
  return Math.round(amount * 100) / 100
}

/** Compute line total from unit price and how the line is measured (sq ft, lf, pcs, sheets). */
export function computeLineTotalUsd(line: ShoppingLine, unitPriceUsd: number): number | null {
  if (line.stockKey === 'foundation.slab') {
    return roundUsd(line.quantity * unitPriceUsd)
  }

  if (line.stockIsSheetArea && line.effectiveStockFt > 0 && line.piecesToBuy > 0) {
    return roundUsd(line.piecesToBuy * unitPriceUsd)
  }

  if (line.unit === 'sq ft' || line.unit === 'cu ft') {
    if (!line.stockIsSheetArea || line.piecesToBuy === 0) {
      return roundUsd(line.quantity * unitPriceUsd)
    }
  }

  // Lumber sold by the piece (plates, beams): unit price is per board, not per linear foot
  if (
    line.piecesToBuy > 0 &&
    (line.allowStoreSizeOverride === true || line.stockLengthFt != null)
  ) {
    return roundUsd(line.piecesToBuy * unitPriceUsd)
  }

  if (line.unit === 'lf') {
    const lf = line.linearFeetNeeded ?? line.quantity
    if (lf > 0) return roundUsd(lf * unitPriceUsd)
  }

  if (line.piecesToBuy > 0) {
    return roundUsd(line.piecesToBuy * unitPriceUsd)
  }

  const count = line.count ?? (line.unit === 'pcs' ? line.quantity : 0)
  if (count > 0) {
    return roundUsd(count * unitPriceUsd)
  }

  return null
}

export function priceShoppingLine(
  line: ShoppingLine,
  project: Project,
): PricedShoppingLine {
  const priceInfo = getLowesUnitPrice(line, project)

  if (!priceInfo) {
    return {
      ...line,
      unitPriceUsd: null,
      lineTotalUsd: null,
      priceSkuNote: null,
    }
  }

  const { unitPriceUsd, priceSkuNote } = priceInfo
  const lineTotalUsd = computeLineTotalUsd(line, unitPriceUsd)

  return {
    ...line,
    unitPriceUsd,
    lineTotalUsd,
    priceSkuNote,
  }
}

export function computeBuildEstimate(
  shopping: ShoppingLine[],
  project: Project,
): BuildEstimate {
  const lines = shopping.map((line) => priceShoppingLine(line, project))
  let subtotalUsd = 0
  let pricedLineCount = 0
  let unpricedLineCount = 0

  for (const line of lines) {
    if (project.excludedStockKeys?.[line.stockKey] === true) {
      continue
    }
    if (line.lineTotalUsd != null && line.lineTotalUsd > 0) {
      subtotalUsd += line.lineTotalUsd
      pricedLineCount++
    } else if (line.stockKey !== 'foundation.slab' || line.quantity > 0) {
      if (line.piecesToBuy === 0 && line.stockKey !== 'foundation.slab') {
        unpricedLineCount++
      } else if (line.lineTotalUsd == null) {
        unpricedLineCount++
      }
    }
  }

  subtotalUsd = Math.round(subtotalUsd * 100) / 100

  return {
    lines,
    subtotalUsd,
    pricedLineCount,
    unpricedLineCount,
    priceSourceNote: `Estimated Lowe's retail (${LOWES_PRICE_UPDATED}); not a quote. Prices vary by store.`,
  }
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
