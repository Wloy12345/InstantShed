import { takeoffToMaterialLines, computePricedShopping } from './stockCalculator'
import type {
  BuildScope,
  DoorType,
  FoundationConfig,
  FramingConfig,
  InteriorFinish,
  MaterialLine,
  Project,
  RoofType,
  RoofingType,
  SidingType,
  StoreStock,
  StudSpacingIn,
  WindowType,
} from '../types/project'
import {
  clampFootprintDimensions,
  snapWallHeightFt,
} from './dimensionConstraints'
import { defaultMaxSpanFt } from './foundationLayout'

const ROOF_TYPES: RoofType[] = ['flat', 'shed', 'gable', 'hip']
const FOUNDATION_TYPES = ['pier_beam', 'timber_pier', 'slab'] as const

export const DEFAULT_STORE_STOCK: StoreStock = {
  postLengthFt: 8,
  beamLengthFt: 8,
  studLengthFt: 8,
  plateLengthFt: 8,
  sheathingSheetSqFt: 32,
}

export function defaultFoundation(): FoundationConfig {
  return {
    type: 'pier_beam',
    postSize: '6x6',
    maxSpanFt: defaultMaxSpanFt('6x6'),
    perimeterBeam: true,
  }
}

export function defaultFraming(): FramingConfig {
  return {
    studSize: '2x4',
    studSpacingIn: 16,
  }
}

export function createDefaultProject(): Project {
  return {
    id: crypto.randomUUID(),
    name: 'New shed',
    footprint: { lengthFt: 12, widthFt: 12 },
    wallHeightFt: 8,
    roof: { type: 'gable', pitchRisePer12: 4 },
    buildScope: 'structure_weatherproof',
    openings: {
      doorType: 'prehung_36x80',
      doorCount: 1,
      windowType: 'none',
      windowCount: 0,
    },
    siding: {
      type: 't111_4x8',
      wallSystem: 'structural_panel',
      includeHousewrap: false,
    },
    interior: { finish: 'none', insulated: false },
    roofing: {
      type: 'metal',
      includeUnderlayment: true,
      includeDripEdge: true,
      includeRidgeCap: true,
      panelCoverageWidthIn: 36,
      screwPerSqFt: 0.9,
    },
    trim: { includeCornerTrim: true, includeFasciaRake: true },
    electrical: { outletCount: 2, lightCount: 1, includeBreaker: true },
    foundation: defaultFoundation(),
    framing: defaultFraming(),
    storeStock: { ...DEFAULT_STORE_STOCK },
    shoppingStockLengths: {},
    excludedStockKeys: {},
    materials: [],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseMaterialLine(value: unknown): MaterialLine | null {
  if (!isRecord(value)) return null
  if (
    typeof value.id !== 'string' ||
    typeof value.category !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.quantity !== 'number' ||
    typeof value.unit !== 'string'
  ) {
    return null
  }
  return {
    id: value.id,
    category: value.category,
    name: value.name,
    quantity: value.quantity,
    unit: value.unit,
    notes: typeof value.notes === 'string' ? value.notes : undefined,
    piecesToBuy: typeof value.piecesToBuy === 'number' ? value.piecesToBuy : undefined,
    stockLengthFt: typeof value.stockLengthFt === 'number' ? value.stockLengthFt : undefined,
    linearFeetNeeded:
      typeof value.linearFeetNeeded === 'number' ? value.linearFeetNeeded : undefined,
    source:
      value.source === 'computed' || value.source === 'manual'
        ? value.source
        : undefined,
  }
}

function parseFoundation(value: unknown): FoundationConfig {
  if (!isRecord(value)) return defaultFoundation()
  const type =
    value.type === 'slab' || value.type === 'pier_beam' || value.type === 'timber_pier'
      ? value.type
      : 'pier_beam'
  const postSize =
    value.postSize === '4x4' || value.postSize === '6x6' ? value.postSize : '6x6'
  const maxSpanFt =
    typeof value.maxSpanFt === 'number' ? value.maxSpanFt : defaultMaxSpanFt(postSize)
  const perimeterBeam =
    typeof value.perimeterBeam === 'boolean' ? value.perimeterBeam : true
  const usesPosts = type === 'pier_beam' || type === 'timber_pier'
  return {
    type,
    postSize: usesPosts ? postSize : undefined,
    maxSpanFt: usesPosts ? maxSpanFt : undefined,
    perimeterBeam: type === 'pier_beam' ? perimeterBeam : false,
  }
}

function parseFraming(value: unknown): FramingConfig {
  if (!isRecord(value)) return defaultFraming()
  const studSize =
    value.studSize === '2x4' || value.studSize === '2x6' ? value.studSize : '2x4'
  const studSpacingIn: StudSpacingIn =
    value.studSpacingIn === 24 ? 24 : 16
  return { studSize, studSpacingIn }
}

function parseStoreStock(value: unknown): StoreStock {
  if (!isRecord(value)) return { ...DEFAULT_STORE_STOCK }
  return {
    postLengthFt:
      typeof value.postLengthFt === 'number' ? value.postLengthFt : DEFAULT_STORE_STOCK.postLengthFt,
    beamLengthFt:
      typeof value.beamLengthFt === 'number' ? value.beamLengthFt : DEFAULT_STORE_STOCK.beamLengthFt,
    studLengthFt:
      typeof value.studLengthFt === 'number' ? value.studLengthFt : DEFAULT_STORE_STOCK.studLengthFt,
    plateLengthFt:
      typeof value.plateLengthFt === 'number'
        ? value.plateLengthFt
        : DEFAULT_STORE_STOCK.plateLengthFt,
    sheathingSheetSqFt:
      typeof value.sheathingSheetSqFt === 'number'
        ? value.sheathingSheetSqFt
        : DEFAULT_STORE_STOCK.sheathingSheetSqFt,
  }
}

function parseShoppingStockLengths(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {}
  const result: Record<string, number> = {}
  for (const [key, v] of Object.entries(value)) {
    if (typeof v === 'number' && v > 0) result[key] = v
  }
  return result
}

function parseExcludedStockKeys(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) return {}
  const result: Record<string, boolean> = {}
  for (const [key, v] of Object.entries(value)) {
    if (typeof v === 'boolean') result[key] = v
  }
  return result
}

function parseOpenings(value: unknown): Project['openings'] {
  if (!isRecord(value)) {
    return {
      doorType: 'prehung_36x80',
      doorCount: 1,
      windowType: 'none',
      windowCount: 0,
    }
  }

  const doorType: DoorType =
    value.doorType === 'none' || value.doorType === 'prehung_36x80' || value.doorType === 'double_60x80'
      ? value.doorType
      : 'prehung_36x80'
  const windowType: WindowType =
    value.windowType === 'none' ||
    value.windowType === 'vinyl_24x36' ||
    value.windowType === 'vinyl_36x36'
      ? value.windowType
      : 'none'

  const doorCount = typeof value.doorCount === 'number' ? Math.max(0, Math.floor(value.doorCount)) : 1
  const windowCount =
    typeof value.windowCount === 'number' ? Math.max(0, Math.floor(value.windowCount)) : 0

  return { doorType, doorCount, windowType, windowCount }
}

function parseSiding(value: unknown): Project['siding'] {
  if (!isRecord(value)) {
    return {
      type: 't111_4x8',
      wallSystem: 'structural_panel',
      includeHousewrap: false,
    }
  }
  const type: SidingType =
    value.type === 'none' || value.type === 't111_4x8' || value.type === 'lp_smartside_4x8'
      ? value.type
      : 't111_4x8'
  const wallSystem: Project['siding']['wallSystem'] =
    value.wallSystem === 'sheathing_and_wrap' || value.wallSystem === 'structural_panel'
      ? value.wallSystem
      : type === 't111_4x8' || type === 'lp_smartside_4x8'
        ? 'structural_panel'
        : 'sheathing_and_wrap'
  const includeHousewrap =
    typeof value.includeHousewrap === 'boolean'
      ? value.includeHousewrap
      : wallSystem === 'sheathing_and_wrap'
  return { type, wallSystem, includeHousewrap }
}

function parseInterior(value: unknown): Project['interior'] {
  if (!isRecord(value)) return { finish: 'none', insulated: false }
  const finish: InteriorFinish =
    value.finish === 'none' ||
    value.finish === 'osb_7_16_4x8' ||
    value.finish === 'drywall_1_2_4x8'
      ? value.finish
      : 'none'
  const insulated = typeof value.insulated === 'boolean' ? value.insulated : false
  return { finish, insulated }
}

function parseBuildScope(value: unknown): BuildScope {
  return value === 'full_finish' || value === 'include_electrical'
    ? value
    : 'structure_weatherproof'
}

function parseRoofing(value: unknown): Project['roofing'] {
  if (!isRecord(value)) {
    return {
      type: 'metal',
      includeUnderlayment: true,
      includeDripEdge: true,
      includeRidgeCap: true,
      panelCoverageWidthIn: 36,
      screwPerSqFt: 0.9,
    }
  }
  let type: RoofingType = 'metal'
  if (value.type === 'metal' || value.type === 'shingles') {
    type = value.type
  } else if (value.type === 'metal_panels' || value.type === 'wood_rafters') {
    type = value.type === 'wood_rafters' ? 'shingles' : 'metal'
  }
  const includeUnderlayment =
    typeof value.includeUnderlayment === 'boolean' ? value.includeUnderlayment : true
  const includeDripEdge =
    typeof value.includeDripEdge === 'boolean' ? value.includeDripEdge : true
  const includeRidgeCap =
    typeof value.includeRidgeCap === 'boolean' ? value.includeRidgeCap : true
  const panelCoverageWidthIn =
    typeof value.panelCoverageWidthIn === 'number' && value.panelCoverageWidthIn > 0
      ? value.panelCoverageWidthIn
      : 36
  const screwPerSqFt =
    typeof value.screwPerSqFt === 'number' && value.screwPerSqFt > 0 ? value.screwPerSqFt : 0.9
  return {
    type,
    includeUnderlayment,
    includeDripEdge,
    includeRidgeCap,
    panelCoverageWidthIn,
    screwPerSqFt,
  }
}

function parseTrim(value: unknown): Project['trim'] {
  if (!isRecord(value)) return { includeCornerTrim: true, includeFasciaRake: true }
  const includeCornerTrim =
    typeof value.includeCornerTrim === 'boolean' ? value.includeCornerTrim : true
  const includeFasciaRake =
    typeof value.includeFasciaRake === 'boolean' ? value.includeFasciaRake : true
  return { includeCornerTrim, includeFasciaRake }
}

function parseElectrical(value: unknown): Project['electrical'] {
  if (!isRecord(value)) return { outletCount: 2, lightCount: 1, includeBreaker: true }
  const outletCount =
    typeof value.outletCount === 'number' ? Math.max(0, Math.floor(value.outletCount)) : 2
  const lightCount =
    typeof value.lightCount === 'number' ? Math.max(0, Math.floor(value.lightCount)) : 1
  const includeBreaker =
    typeof value.includeBreaker === 'boolean' ? value.includeBreaker : true
  return { outletCount, lightCount, includeBreaker }
}

export function parseProjectJson(json: string): Project {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Invalid JSON file.')
  }

  if (!isRecord(parsed)) {
    throw new Error('Project file must be a JSON object.')
  }

  if (typeof parsed.id !== 'string' || typeof parsed.name !== 'string') {
    throw new Error('Project must include id and name.')
  }

  if (!isRecord(parsed.footprint)) {
    throw new Error('Project must include footprint with lengthFt and widthFt.')
  }

  const rawLength = parsed.footprint.lengthFt
  const rawWidth = parsed.footprint.widthFt
  if (typeof rawLength !== 'number' || typeof rawWidth !== 'number') {
    throw new Error('footprint.lengthFt and footprint.widthFt must be numbers.')
  }
  const { lengthFt, widthFt } = clampFootprintDimensions(rawLength, rawWidth)

  if (typeof parsed.wallHeightFt !== 'number') {
    throw new Error('wallHeightFt must be a number.')
  }
  const wallHeightFt = snapWallHeightFt(parsed.wallHeightFt)

  if (!isRecord(parsed.roof) || typeof parsed.roof.type !== 'string') {
    throw new Error('roof must include a type.')
  }

  if (!ROOF_TYPES.includes(parsed.roof.type as RoofType)) {
    throw new Error(`roof.type must be one of: ${ROOF_TYPES.join(', ')}`)
  }

  const pitch = parsed.roof.pitchRisePer12
  if (pitch !== undefined && typeof pitch !== 'number') {
    throw new Error('roof.pitchRisePer12 must be a number when provided.')
  }

  if (!Array.isArray(parsed.materials)) {
    throw new Error('materials must be an array.')
  }

  const materials: MaterialLine[] = []
  for (const line of parsed.materials) {
    const material = parseMaterialLine(line)
    if (!material) {
      throw new Error('Each material line must include id, category, name, quantity, and unit.')
    }
    materials.push(material)
  }

  const foundation = parseFoundation(parsed.foundation)
  const framing = parseFraming(parsed.framing)
  const storeStock = parseStoreStock(parsed.storeStock)
  const shoppingStockLengths = parseShoppingStockLengths(parsed.shoppingStockLengths)
  const excludedStockKeys = parseExcludedStockKeys((parsed as Record<string, unknown>).excludedStockKeys)
  const openings = parseOpenings(parsed.openings)
  const siding = parseSiding(parsed.siding)
  const interior = parseInterior(parsed.interior)
  const buildScope = parseBuildScope((parsed as Record<string, unknown>).buildScope)
  const roofing = parseRoofing((parsed as Record<string, unknown>).roofing)
  const trim = parseTrim((parsed as Record<string, unknown>).trim)
  const electrical = parseElectrical((parsed as Record<string, unknown>).electrical)

  if (isRecord(parsed.foundation) && parsed.foundation.type != null) {
    if (!FOUNDATION_TYPES.includes(parsed.foundation.type as (typeof FOUNDATION_TYPES)[number])) {
      throw new Error(`foundation.type must be one of: ${FOUNDATION_TYPES.join(', ')}`)
    }
  }

  return {
    id: parsed.id,
    name: parsed.name,
    footprint: { lengthFt, widthFt },
    wallHeightFt,
    roof: {
      type: parsed.roof.type as RoofType,
      pitchRisePer12: pitch,
    },
    buildScope,
    openings,
    siding,
    interior,
    roofing,
    trim,
    electrical,
    foundation,
    framing,
    storeStock,
    shoppingStockLengths,
    excludedStockKeys,
    materials,
  }
}

export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2)
}

export function downloadProject(project: Project): void {
  const blob = new Blob([serializeProject(project)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const safeName = project.name.trim().replace(/[^\w\-]+/g, '-').toLowerCase() || 'project'
  anchor.href = url
  anchor.download = `shunder-project-${safeName}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function suggestMaterials(project: Project): MaterialLine[] {
  return takeoffToMaterialLines(computePricedShopping(project).lines)
}

