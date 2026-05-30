import type { Project, ProjectMetrics, RoofType } from '../types/project'

export function slopeFactor(pitchRisePer12: number): number {
  const rise = Math.max(0, pitchRisePer12)
  return Math.sqrt(1 + (rise / 12) ** 2)
}

export function estimateRoofAreaSqFt(
  floorAreaSqFt: number,
  roofType: RoofType,
  pitchRisePer12 = 4,
): number {
  if (floorAreaSqFt <= 0) return 0

  switch (roofType) {
    case 'flat':
      return floorAreaSqFt
    case 'shed':
      return floorAreaSqFt * slopeFactor(pitchRisePer12)
    case 'gable':
      return floorAreaSqFt * slopeFactor(pitchRisePer12)
    case 'hip':
      return floorAreaSqFt * slopeFactor(pitchRisePer12) * 1.1
  }
}

/** Roof decking area with waste/overhang (used for sheathing sheet count only). */
export function estimateRoofSheathingAreaSqFt(
  floorAreaSqFt: number,
  roofType: RoofType,
  pitchRisePer12 = 4,
): number {
  const base = estimateRoofAreaSqFt(floorAreaSqFt, roofType, pitchRisePer12)
  if (base <= 0) return 0
  // Shed: single plane — extra factor for slope length and typical overhang
  if (roofType === 'shed') return base * 1.1
  return base * 1.05
}

export function computeMetrics(project: Project): ProjectMetrics {
  const { lengthFt, widthFt } = project.footprint
  const length = Math.max(0, lengthFt)
  const width = Math.max(0, widthFt)
  const floorAreaSqFt = length * width
  const perimeterFt = 2 * (length + width)
  const wallHeight = Math.max(0, project.wallHeightFt)
  const wallAreaSqFt = perimeterFt * wallHeight

  const pitch =
    project.roof.type === 'flat' ? 0 : (project.roof.pitchRisePer12 ?? 4)

  const roofAreaSqFt = estimateRoofAreaSqFt(
    floorAreaSqFt,
    project.roof.type,
    pitch,
  )

  return {
    floorAreaSqFt,
    perimeterFt,
    wallAreaSqFt,
    roofAreaSqFt,
  }
}

export function formatFeet(value: number): string {
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10
  return `${rounded}'`
}

export function formatSqFt(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return `${rounded} sq ft`
}

const RAFTERS_ALONG_LENGTH: RoofType[] = ['shed', 'gable', 'hip', 'flat']
const SHED_RAFTER_OC_FT = 16 / 12

/** Shed/slant roof: rafters @ 16" OC along length (lengthFt). */
export function computeShedRafterCount(lengthFt: number): number {
  if (lengthFt <= 0) return 0
  return Math.ceil(lengthFt / SHED_RAFTER_OC_FT) + 1
}

/** Shed rafter member length before buy-size rounding: depth + 2 ft overhang. */
export function computeShedRafterNeedLengthFt(depthFt: number): number {
  return depthFt + 2
}

/** Rafters spaced along building length (shed uses fixed 16" OC formula). */
export function computeRafterCount(
  lengthFt: number,
  widthFt: number,
  roofType: RoofType,
  spacingIn: number,
): number {
  if (roofType === 'shed') return computeShedRafterCount(lengthFt)

  const spacingFt = spacingIn / 12
  if (spacingFt <= 0) return 0
  const alongLength = RAFTERS_ALONG_LENGTH.includes(roofType)
    ? lengthFt
    : widthFt
  const perRow = alongLength > 0 ? Math.ceil(alongLength / spacingFt) + 1 : 0
  if (roofType === 'gable' || roofType === 'hip') return perRow * 2
  return perRow
}

/** Required rafter length (ft) before standard buy-length rounding. */
export function computeRafterLengthFt(
  lengthFt: number,
  widthFt: number,
  roofType: RoofType,
  pitchRisePer12: number,
  overhangFt = 1,
): number {
  if (roofType === 'shed') return computeShedRafterNeedLengthFt(widthFt)

  const pitch = Math.max(0, pitchRisePer12)
  const slope = slopeFactor(pitch)
  let runFt = widthFt
  if (roofType === 'gable' || roofType === 'hip') {
    runFt = widthFt / 2
    return runFt * slope + overhangFt
  }
  if (roofType === 'flat') runFt = Math.min(lengthFt, widthFt)
  return runFt * slope + overhangFt * 2
}
