export const EVEN_LUMBER_LENGTHS_FT = [8, 10, 12, 14, 16] as const

/** Smallest even standard lumber length (ft) that covers the required span. */
export function ceilEvenStandardLengthFt(needFt: number): number {
  if (needFt <= 0) return EVEN_LUMBER_LENGTHS_FT[0]
  for (const len of EVEN_LUMBER_LENGTHS_FT) {
    if (len >= needFt) return len
  }
  return EVEN_LUMBER_LENGTHS_FT[EVEN_LUMBER_LENGTHS_FT.length - 1]
}

export type LumberSize = '2x6' | '2x8'

const JOIST_SPAN_UPGRADE_FT = 12
const ROOF_DEPTH_WARNING_FT = 15

export function floorJoistLumberSize(spanFt: number): LumberSize {
  return spanFt > JOIST_SPAN_UPGRADE_FT ? '2x8' : '2x6'
}

export function rafterLumberSize(depthFt: number): LumberSize {
  return depthFt > JOIST_SPAN_UPGRADE_FT ? '2x8' : '2x6'
}

export function needsRoofMidSpanSupport(depthFt: number): boolean {
  return depthFt > ROOF_DEPTH_WARNING_FT
}

export function lumberSizeLabel(size: LumberSize): string {
  return size === '2x8' ? '2×8' : '2×6'
}

/** Joist/rim buy length from joist span (lengthFt). */
export function floorJoistBuyLengthFt(spanFt: number): number {
  return ceilEvenStandardLengthFt(spanFt)
}
