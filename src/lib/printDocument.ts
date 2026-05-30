import { computeMetrics } from './calculations'
import { formatFootprintSummary } from './formatFootprint'
import { computeStructuralWarnings } from './structuralWarnings'
import { computePricedShopping, formatUsd } from './stockCalculator'
import {
  buildScopeLabel,
  roofTypeLabel,
} from '../components/wizard/projectFormOptions'
import type { PricedShoppingLine } from './pricing'
import type { Project } from '../types/project'

export interface PrintMaterialRow {
  category: string
  name: string
  displayNeed: string
  sizeCell: string
  buyCell: string
  unitPrice: string
  lineTotal: string
  notes: string
}

export interface PrintDocumentData {
  projectName: string
  dateLabel: string
  footprintSummary: string
  wallHeightFt: number
  roofSummary: string
  floorAreaSqFt: number
  perimeterFt: number
  wallAreaSqFt: number
  roofAreaSqFt: number
  foundationLabel: string
  framingLabel: string
  buildScopeLabel: string
  roofCoveringLabel: string
  wallSystemLabel: string
  sidingLabel: string
  openingsLabel: string
  interiorLabel: string
  warnings: string[]
  subtotalUsd: number
  subtotalFormatted: string
  priceSourceNote: string
  materialRows: PrintMaterialRow[]
}

function foundationLabel(project: Project): string {
  const f = project.foundation
  if (f.type === 'slab') return 'Concrete slab'
  if (f.type === 'timber_pier') return `${f.postSize ?? '6x6'} timber pier`
  return `${f.postSize ?? '6x6'} pier & beam`
}

function wallSystemLabel(project: Project): string {
  return project.siding.wallSystem === 'structural_panel'
    ? 'Structural panels (T1-11 / SmartSide)'
    : 'OSB sheathing + housewrap + finish'
}

function sidingLabel(project: Project): string {
  if (project.siding.type === 'none') return 'None'
  if (project.siding.type === 't111_4x8') return 'T1-11 panels (4×8)'
  return 'LP SmartSide panels (4×8)'
}

function interiorLabel(project: Project): string {
  const finish =
    project.interior.finish === 'none'
      ? 'None'
      : project.interior.finish === 'osb_7_16_4x8'
        ? 'OSB 7/16" (4×8)'
        : 'Drywall 1/2" (4×8)'
  return project.interior.insulated ? `${finish}, insulated` : finish
}

function openingsLabel(project: Project): string {
  const parts: string[] = []
  if (project.openings.doorCount > 0 && project.openings.doorType !== 'none') {
    parts.push(`${project.openings.doorCount} door(s)`)
  }
  if (project.openings.windowCount > 0 && project.openings.windowType !== 'none') {
    parts.push(`${project.openings.windowCount} window(s)`)
  }
  return parts.length > 0 ? parts.join(', ') : 'None'
}

function materialRowFromLine(line: PricedShoppingLine): PrintMaterialRow {
  const sizeCell =
    line.stockKey === 'foundation.slab'
      ? '—'
      : line.effectiveStockFt > 0
        ? line.stockIsSheetArea
          ? `${line.effectiveStockFt} sq ft/sheet`
          : `${line.effectiveStockFt} ft`
        : '—'
  const buyCell =
    line.stockKey === 'foundation.slab'
      ? '—'
      : line.piecesToBuy > 0
        ? String(line.piecesToBuy)
        : '—'
  const unitPrice = line.unitPriceUsd != null ? formatUsd(line.unitPriceUsd) : '—'
  const lineTotal =
    line.lineTotalUsd != null && line.lineTotalUsd > 0
      ? formatUsd(line.lineTotalUsd)
      : '—'

  return {
    category: line.category,
    name: line.name,
    displayNeed: line.displayNeed,
    sizeCell,
    buyCell,
    unitPrice,
    lineTotal,
    notes: line.notes ?? '',
  }
}

export function getPrintDocumentData(project: Project): PrintDocumentData {
  const metrics = computeMetrics(project)
  const estimate = computePricedShopping(project)
  const { lengthFt, widthFt } = project.footprint
  const pitch = project.roof.pitchRisePer12 ?? 4
  const roofSummary =
    project.roof.type === 'flat'
      ? roofTypeLabel('flat')
      : `${roofTypeLabel(project.roof.type)}, ${pitch}/12 pitch`

  const materialRows = estimate.lines
    .filter((line) => project.excludedStockKeys[line.stockKey] !== true)
    .map(materialRowFromLine)

  return {
    projectName: project.name,
    dateLabel: new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    footprintSummary: formatFootprintSummary(lengthFt, widthFt),
    wallHeightFt: project.wallHeightFt,
    roofSummary,
    floorAreaSqFt: metrics.floorAreaSqFt,
    perimeterFt: metrics.perimeterFt,
    wallAreaSqFt: metrics.wallAreaSqFt,
    roofAreaSqFt: metrics.roofAreaSqFt,
    foundationLabel: foundationLabel(project),
    framingLabel: `${project.framing.studSize} @ ${project.framing.studSpacingIn}" OC`,
    buildScopeLabel: buildScopeLabel(project.buildScope),
    roofCoveringLabel:
      project.roofing.type === 'metal' ? 'Metal panels' : 'Asphalt shingles',
    wallSystemLabel: wallSystemLabel(project),
    sidingLabel: sidingLabel(project),
    openingsLabel: openingsLabel(project),
    interiorLabel: interiorLabel(project),
    warnings: computeStructuralWarnings(project),
    subtotalUsd: estimate.subtotalUsd,
    subtotalFormatted: formatUsd(estimate.subtotalUsd),
    priceSourceNote: estimate.priceSourceNote,
    materialRows,
  }
}
