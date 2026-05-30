import { computeTakeoff } from './materialTakeoff'
import { computeBuildEstimate } from './pricing'
import type { Project, ShoppingLine, TakeoffLine } from '../types/project'

export type { PricedShoppingLine } from './pricing'
export { computeBuildEstimate, formatUsd } from './pricing'

export function piecesToBuyFromLinearFeet(
  linearFeetNeeded: number,
  stockLengthFt: number,
): number {
  if (linearFeetNeeded <= 0) return 0
  if (stockLengthFt <= 0) return 0
  return Math.ceil(linearFeetNeeded / stockLengthFt)
}

export function resolveStockForLine(line: TakeoffLine, project: Project): number {
  if (line.allowStoreSizeOverride === true) {
    const override = project.shoppingStockLengths[line.stockKey]
    if (override != null && override > 0) return override
  }
  if (line.stockLengthFt != null && line.stockLengthFt > 0) return line.stockLengthFt
  return 0
}

export function applyStockToTakeoff(
  lines: TakeoffLine[],
  project: Project,
): ShoppingLine[] {
  return lines.map((line) => {
    const effectiveStockFt = resolveStockForLine(line, project)
    let piecesToBuy = 0
    let displayNeed = `${line.quantity} ${line.unit}`

    if (line.stockIsSheetArea || line.unit === 'sq ft') {
      if (effectiveStockFt > 0) {
        piecesToBuy = Math.ceil(line.quantity / effectiveStockFt)
        displayNeed = `${line.quantity} sq ft`
      } else if (line.stockIsSheetArea) {
        piecesToBuy = 0
        displayNeed = `${line.quantity} sq ft`
      } else {
        piecesToBuy = Math.ceil(line.quantity)
        displayNeed = `${line.quantity} sq ft`
      }
    } else if (line.unit === 'pcs' && line.count != null) {
      if (line.category === 'Framing' && line.name.includes('stud') && line.linearFeetNeeded != null) {
        const wallHeight = project.wallHeightFt
        if (effectiveStockFt >= wallHeight) {
          piecesToBuy = line.count
        } else if (effectiveStockFt > 0) {
          piecesToBuy = piecesToBuyFromLinearFeet(
            line.linearFeetNeeded,
            effectiveStockFt,
          )
        }
        displayNeed = `${line.count} studs (${Math.round(line.linearFeetNeeded * 10) / 10} lf total)`
      } else if (line.stockLengthFt == null) {
        piecesToBuy = line.count
        displayNeed = `${line.count} pcs`
      } else {
        piecesToBuy = effectiveStockFt > 0 ? line.count : line.count
        displayNeed = `${line.count} pcs`
      }
    } else if (line.linearFeetNeeded != null || line.unit === 'lf') {
      const lf = line.linearFeetNeeded ?? line.quantity
      if (effectiveStockFt > 0) {
        piecesToBuy = piecesToBuyFromLinearFeet(lf, effectiveStockFt)
      } else {
        piecesToBuy = Math.ceil(lf)
      }
      displayNeed = `${Math.round(lf * 10) / 10} lf`
    } else {
      piecesToBuy = line.quantity
    }

    return {
      ...line,
      effectiveStockFt,
      piecesToBuy,
      displayNeed,
    }
  })
}

export function computeShoppingList(project: Project): ShoppingLine[] {
  return applyStockToTakeoff(computeTakeoff(project), project)
}

export function computePricedShopping(project: Project) {
  return computeBuildEstimate(computeShoppingList(project), project)
}

export function takeoffToMaterialLines(
  lines: import('./pricing').PricedShoppingLine[],
): import('../types/project').MaterialLine[] {
  return lines.map((line) => ({
    id: crypto.randomUUID(),
    category: line.category,
    name: line.name,
    quantity: line.piecesToBuy > 0 ? line.piecesToBuy : line.quantity,
    unit: line.unit === 'sq ft' ? 'sq ft' : 'pcs',
    notes: line.notes,
    piecesToBuy: line.piecesToBuy,
    stockLengthFt: line.effectiveStockFt,
    linearFeetNeeded: line.linearFeetNeeded,
    displayNeed: line.displayNeed,
    unitPriceUsd: line.unitPriceUsd ?? undefined,
    lineTotalUsd: line.lineTotalUsd ?? undefined,
    source: 'computed' as const,
  }))
}
