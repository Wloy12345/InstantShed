export type RoofType = 'flat' | 'shed' | 'gable' | 'hip'
export type FoundationType = 'pier_beam' | 'timber_pier' | 'slab'
export type PostSize = '4x4' | '6x6'
export type StudSize = '2x4' | '2x6'
export type StudSpacingIn = 16 | 24

export type DoorType = 'none' | 'prehung_36x80' | 'double_60x80'
export type WindowType = 'none' | 'vinyl_24x36' | 'vinyl_36x36'
export type SidingType = 'none' | 't111_4x8' | 'lp_smartside_4x8'
/** Structural panels on studs vs OSB + housewrap (+ optional finish panels). */
export type WallSystem = 'structural_panel' | 'sheathing_and_wrap'
export type InteriorFinish = 'none' | 'osb_7_16_4x8' | 'drywall_1_2_4x8'

export type BuildScope = 'structure_weatherproof' | 'full_finish' | 'include_electrical'
export type RoofingType = 'metal' | 'shingles'

export interface FoundationConfig {
  type: FoundationType
  postSize?: PostSize
  maxSpanFt?: number
  perimeterBeam?: boolean
}

export interface FramingConfig {
  studSize: StudSize
  studSpacingIn: StudSpacingIn
}

export interface StoreStock {
  postLengthFt: number
  beamLengthFt: number
  studLengthFt: number
  plateLengthFt: number
  /** Default 4×8 sheet = 32 sq ft for sheathing piece counts */
  sheathingSheetSqFt: number
}

/** Per shopping-list line overrides (piece length in ft, or sheet area in sq ft) */
export type ShoppingStockLengths = Record<string, number>

export interface MaterialLine {
  id: string
  category: string
  name: string
  quantity: number
  unit: string
  notes?: string
  piecesToBuy?: number
  stockLengthFt?: number
  linearFeetNeeded?: number
  displayNeed?: string
  unitPriceUsd?: number
  lineTotalUsd?: number
  source?: 'computed' | 'manual'
}

export interface Project {
  id: string
  name: string
  footprint: { lengthFt: number; widthFt: number }
  wallHeightFt: number
  roof: { type: RoofType; pitchRisePer12?: number }
  buildScope: BuildScope
  openings: {
    doorType: DoorType
    doorCount: number
    windowType: WindowType
    windowCount: number
  }
  siding: {
    type: SidingType
    wallSystem: WallSystem
    includeHousewrap: boolean
  }
  interior: {
    finish: InteriorFinish
    insulated: boolean
  }
  roofing: {
    type: RoofingType
    includeUnderlayment: boolean
    includeDripEdge: boolean
    includeRidgeCap: boolean
    panelCoverageWidthIn: number
    screwPerSqFt: number
  }
  trim: {
    includeCornerTrim: boolean
    includeFasciaRake: boolean
  }
  electrical: {
    outletCount: number
    lightCount: number
    includeBreaker: boolean
  }
  foundation: FoundationConfig
  framing: FramingConfig
  storeStock: StoreStock
  /** User-entered stock sizes keyed by takeoff `stockKey` */
  shoppingStockLengths: ShoppingStockLengths
  /** When true, excludes the line from estimated subtotal. */
  excludedStockKeys: Record<string, boolean>
  materials: MaterialLine[]
}

export interface ProjectMetrics {
  floorAreaSqFt: number
  perimeterFt: number
  wallAreaSqFt: number
  roofAreaSqFt: number
}

export interface PierPost {
  xFt: number
  yFt: number
}

export interface PierLayout {
  posts: PierPost[]
  rows: number
  cols: number
  spacingLengthFt: number
  spacingWidthFt: number
  postCount: number
  postSize: PostSize
  maxSpanFt: number
}

export interface TakeoffLine {
  stockKey: string
  category: string
  name: string
  quantity: number
  unit: string
  /**
   * When true, the user can enter the store's piece length (ft) or sheet area (sq ft)
   * and we will compute `piecesToBuy = ceil(need ÷ size)`.
   *
   * Keep this false for packaged/non-lumber items to avoid confusion.
   */
  allowStoreSizeOverride?: boolean
  linearFeetNeeded?: number
  stockLengthFt?: number
  count?: number
  notes?: string
  /** When true, `stockLengthFt` / override is interpreted as sheet area (sq ft) */
  stockIsSheetArea?: boolean
}

export interface ShoppingLine extends TakeoffLine {
  piecesToBuy: number
  displayNeed: string
  /** Resolved stock value used for the buy calculation */
  effectiveStockFt: number
}
