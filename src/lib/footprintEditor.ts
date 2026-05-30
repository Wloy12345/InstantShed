import {
  FOOTPRINT_MAX_FT,
  FOOTPRINT_MIN_FT,
  FOOTPRINT_STEP_FT,
  snapFootprintFt,
  snapWallHeightFt,
  type WallHeightOptionFt,
} from './dimensionConstraints'

export { FOOTPRINT_MAX_FT, FOOTPRINT_MIN_FT, FOOTPRINT_STEP_FT } from './dimensionConstraints'
export { footprintOptionsFt, WALL_HEIGHT_OPTIONS_FT } from './dimensionConstraints'

export function snapFeet(value: number, step = FOOTPRINT_STEP_FT): number {
  if (step <= 0) return value
  return Math.round(value / step) * step
}

export function clampFootprint(
  lengthFt: number,
  widthFt: number,
): { lengthFt: number; widthFt: number } {
  return {
    lengthFt: snapFootprintFt(lengthFt),
    widthFt: snapFootprintFt(widthFt),
  }
}

export function clampWallHeight(heightFt: number): WallHeightOptionFt {
  return snapWallHeightFt(heightFt)
}

export interface FootprintLayout {
  lengthFt: number
  widthFt: number
  scale: number
  offsetX: number
  offsetY: number
  rectW: number
  rectH: number
}

export function computeFootprintLayout(
  lengthFt: number,
  widthFt: number,
  viewSize: number,
  padding: number,
): FootprintLayout {
  const maxDim = Math.max(lengthFt, widthFt, 1)
  const scale = (viewSize - padding * 2) / maxDim
  const rectW = lengthFt * scale
  const rectH = widthFt * scale
  const offsetX = (viewSize - rectW) / 2
  const offsetY = (viewSize - rectH) / 2
  return { lengthFt, widthFt, scale, offsetX, offsetY, rectW, rectH }
}

/** Convert SVG pixel delta to feet along one axis */
export function svgDeltaToFeet(deltaPx: number, scale: number): number {
  if (scale <= 0) return 0
  return deltaPx / scale
}

export type CornerHandle = 'se'

export function footprintFromCornerDrag(
  startLengthFt: number,
  startWidthFt: number,
  deltaSvgX: number,
  deltaSvgY: number,
  scale: number,
): { lengthFt: number; widthFt: number } {
  const lengthFt = snapFeet(startLengthFt + svgDeltaToFeet(deltaSvgX, scale))
  const widthFt = snapFeet(startWidthFt + svgDeltaToFeet(deltaSvgY, scale))
  return clampFootprint(lengthFt, widthFt)
}

export type EdgeHandle = 'n' | 's' | 'e' | 'w'

export function footprintFromEdgeDrag(
  startLengthFt: number,
  startWidthFt: number,
  edge: EdgeHandle,
  deltaSvgX: number,
  deltaSvgY: number,
  scale: number,
): { lengthFt: number; widthFt: number } {
  let lengthFt = startLengthFt
  let widthFt = startWidthFt

  switch (edge) {
    case 'e':
      lengthFt = snapFeet(startLengthFt + svgDeltaToFeet(deltaSvgX, scale))
      break
    case 'w':
      lengthFt = snapFeet(startLengthFt - svgDeltaToFeet(deltaSvgX, scale))
      break
    case 's':
      widthFt = snapFeet(startWidthFt + svgDeltaToFeet(deltaSvgY, scale))
      break
    case 'n':
      widthFt = snapFeet(startWidthFt - svgDeltaToFeet(deltaSvgY, scale))
      break
  }

  return clampFootprint(lengthFt, widthFt)
}

export function wallHeightFromDragDelta(
  startHeightFt: number,
  deltaWorldY: number,
  worldUnitsPerFoot: number,
): number {
  const deltaFt = -deltaWorldY / worldUnitsPerFoot
  return clampWallHeight(snapFeet(startHeightFt + deltaFt))
}
