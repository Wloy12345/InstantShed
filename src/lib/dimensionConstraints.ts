export const FOOTPRINT_STEP_FT = 2
export const FOOTPRINT_MIN_FT = 8
export const FOOTPRINT_MAX_FT = 48

export const WALL_HEIGHT_OPTIONS_FT = [7, 8, 10] as const
export type WallHeightOptionFt = (typeof WALL_HEIGHT_OPTIONS_FT)[number]

/** Even 2-ft footprint options from 8 through max. */
export function footprintOptionsFt(
  min = FOOTPRINT_MIN_FT,
  max = FOOTPRINT_MAX_FT,
): number[] {
  const options: number[] = []
  for (let ft = min; ft <= max; ft += FOOTPRINT_STEP_FT) {
    options.push(ft)
  }
  return options
}

export function snapFootprintFt(value: number): number {
  if (value <= 0) return FOOTPRINT_MIN_FT
  const snapped = Math.round(value / FOOTPRINT_STEP_FT) * FOOTPRINT_STEP_FT
  return Math.min(FOOTPRINT_MAX_FT, Math.max(FOOTPRINT_MIN_FT, snapped))
}

export function snapWallHeightFt(value: number): WallHeightOptionFt {
  let best: WallHeightOptionFt = 8
  let bestDist = Infinity
  for (const h of WALL_HEIGHT_OPTIONS_FT) {
    const d = Math.abs(h - value)
    if (d < bestDist) {
      bestDist = d
      best = h
    }
  }
  return best
}

export function clampFootprintDimensions(
  lengthFt: number,
  widthFt: number,
): { lengthFt: number; widthFt: number } {
  return {
    lengthFt: snapFootprintFt(lengthFt),
    widthFt: snapFootprintFt(widthFt),
  }
}
