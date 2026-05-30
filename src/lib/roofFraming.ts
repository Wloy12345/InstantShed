import { computeRafterCount, computeRafterLengthFt } from './calculations'
import {
  ceilEvenStandardLengthFt,
  lumberSizeLabel,
  rafterLumberSize,
} from './lumberDefaults'
import type { Project, TakeoffLine } from '../types/project'

export function roofUsesRafterFraming(project: Project): boolean {
  return project.roof.type !== 'flat'
}

export function addRoofFraming(project: Project, lines: TakeoffLine[]): void {
  if (!roofUsesRafterFraming(project)) return

  const { lengthFt, widthFt } = project.footprint
  const pitch =
    project.roof.type === 'flat' ? 0 : (project.roof.pitchRisePer12 ?? 4)
  const isGableOrHip = project.roof.type === 'gable' || project.roof.type === 'hip'

  const rafterCount = computeRafterCount(
    lengthFt,
    widthFt,
    project.roof.type,
    project.framing.studSpacingIn,
  )
  const rafterNeedLengthFt = computeRafterLengthFt(
    lengthFt,
    widthFt,
    project.roof.type,
    pitch,
  )
  const lumber = rafterLumberSize(widthFt)
  const rafterStockFt = ceilEvenStandardLengthFt(rafterNeedLengthFt)
  const ocNote =
    project.roof.type === 'shed'
      ? '16" OC along length'
      : `${project.framing.studSpacingIn}" OC`
  const rafterLengthNote = isGableOrHip
    ? `half span ${widthFt / 2}' + eave overhang`
    : `depth ${widthFt}' + overhang`

  lines.push({
    stockKey: 'roofing.rafters',
    category: 'Roofing',
    name: `${lumberSizeLabel(lumber)} rafters`,
    quantity: rafterCount,
    unit: 'pcs',
    allowStoreSizeOverride: true,
    count: rafterCount,
    linearFeetNeeded: rafterCount * rafterNeedLengthFt,
    stockLengthFt: rafterStockFt,
    notes: `${rafterCount} rafters @ ${ocNote}; ~${Math.round(rafterNeedLengthFt * 10) / 10}' each (${rafterLengthNote})`,
  })

  if (isGableOrHip) {
    const ridgeBuyFt = ceilEvenStandardLengthFt(lengthFt + 2)
    lines.push({
      stockKey: 'roofing.ridge_board',
      category: 'Roofing',
      name: '2×6 ridge board',
      quantity: 1,
      unit: 'pcs',
      allowStoreSizeOverride: true,
      count: 1,
      linearFeetNeeded: lengthFt,
      stockLengthFt: ridgeBuyFt,
      notes: `Ridge along ${lengthFt}' peak`,
    })
  }

  const tiesPerRafter = isGableOrHip ? 1 : 2
  lines.push({
    stockKey: 'hardware.hurricane_tie',
    category: 'Hardware',
    name: 'Hurricane ties (rafter to plate)',
    quantity: rafterCount * tiesPerRafter,
    unit: 'pcs',
    count: rafterCount * tiesPerRafter,
    notes: isGableOrHip
      ? '1 tie per rafter at wall plate'
      : '2 ties per rafter at top plates (estimate)',
  })
}

export function addRoofUnderlaymentAndDrip(
  project: Project,
  lines: TakeoffLine[],
  metrics: { perimeterFt: number; roofAreaSqFt: number },
): void {
  const roofAreaWithWaste = Math.round(metrics.roofAreaSqFt * 1.1)

  if (project.roofing.includeUnderlayment) {
    lines.push({
      stockKey: 'roofing.underlayment',
      category: 'Roofing',
      name: 'Roof underlayment (synthetic/felt)',
      quantity: roofAreaWithWaste,
      unit: 'sq ft',
      notes: 'Roof area + 10% waste (estimate)',
    })
  }

  if (project.roofing.includeDripEdge) {
    const dripEdgeLf = Math.round(metrics.perimeterFt * 1.05)
    lines.push({
      stockKey: 'roofing.drip_edge',
      category: 'Roofing',
      name: 'Drip edge',
      quantity: dripEdgeLf,
      unit: 'lf',
      linearFeetNeeded: dripEdgeLf,
      notes: 'Approx. eaves/rakes + waste (estimate)',
    })
  }
}
