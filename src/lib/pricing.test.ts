import { describe, expect, it } from 'vitest'
import {
  computeBuildEstimate,
  computeLineTotalUsd,
  formatUsd,
  nearestStandardLengthFt,
} from './pricing'
import { ROOF_UNDERLAYMENT_PER_SQ_FT } from '../data/lowesCatalog'
import type { ShoppingLine } from '../types/project'
import { computeShoppingList } from './stockCalculator'
import type { Project } from '../types/project'

function baseProject(): Project {
  return {
    id: '1',
    name: 'Shed',
    footprint: { lengthFt: 12, widthFt: 12 },
    wallHeightFt: 8,
    roof: { type: 'gable', pitchRisePer12: 4 },
    buildScope: 'structure_weatherproof',
    openings: { doorType: 'prehung_36x80', doorCount: 1, windowType: 'none', windowCount: 0 },
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
    foundation: { type: 'pier_beam', postSize: '6x6', perimeterBeam: true },
    framing: { studSize: '2x4', studSpacingIn: 16 },
    storeStock: {
      postLengthFt: 8,
      beamLengthFt: 8,
      studLengthFt: 8,
      plateLengthFt: 8,
      sheathingSheetSqFt: 32,
    },
    shoppingStockLengths: {},
    excludedStockKeys: {},
    materials: [],
  }
}

describe('nearestStandardLengthFt', () => {
  it('snaps to closest standard length', () => {
    expect(nearestStandardLengthFt(9)).toBe(8)
    expect(nearestStandardLengthFt(11)).toBe(10)
  })
})

describe('computeBuildEstimate', () => {
  it('returns a positive subtotal for a typical shed', () => {
    const shopping = computeShoppingList(baseProject())
    const estimate = computeBuildEstimate(shopping, baseProject())
    expect(estimate.subtotalUsd).toBeGreaterThan(100)
    expect(estimate.pricedLineCount).toBeGreaterThan(0)
  })

  it('prices plates per piece bought, not linear feet × piece price', () => {
    const line: ShoppingLine = {
      stockKey: 'framing.plates',
      category: 'Framing',
      name: '2x4 plate',
      quantity: 144,
      unit: 'lf',
      linearFeetNeeded: 144,
      stockLengthFt: 12,
      allowStoreSizeOverride: true,
      piecesToBuy: 12,
      displayNeed: '144 lf',
      effectiveStockFt: 12,
    }
    expect(computeLineTotalUsd(line, 7.98)).toBe(95.76)
  })

  it('prices posts per piece', () => {
    const shopping = computeShoppingList(baseProject())
    const estimate = computeBuildEstimate(shopping, baseProject())
    const posts = estimate.lines.find((l) => l.stockKey === 'foundation.post')
    expect(posts?.unitPriceUsd).toBeGreaterThan(0)
    expect(posts?.lineTotalUsd).toBe((posts?.piecesToBuy ?? 0) * (posts?.unitPriceUsd ?? 0))
  })

  it('formats USD', () => {
    expect(formatUsd(1234.5)).toMatch(/\$1,234\.50/)
  })

  it('prices sq-ft roofing underlayment without sheet size', () => {
    const line: ShoppingLine = {
      stockKey: 'roofing.underlayment',
      category: 'Roofing',
      name: 'Roof underlayment',
      quantity: 200,
      unit: 'sq ft',
      piecesToBuy: 200,
      displayNeed: '200 sq ft',
      effectiveStockFt: 0,
    }
    expect(computeLineTotalUsd(line, ROOF_UNDERLAYMENT_PER_SQ_FT)).toBe(24)
  })

  it('excludes a line from subtotal when toggled off', () => {
    const project = baseProject()
    const shopping = computeShoppingList(project)
    const estimateAll = computeBuildEstimate(shopping, project)
    const someKey = estimateAll.lines.find((l) => l.lineTotalUsd != null && l.lineTotalUsd > 0)?.stockKey
    expect(someKey).toBeTruthy()

    const excludedProject: Project = {
      ...project,
      excludedStockKeys: { ...(project.excludedStockKeys ?? {}), [someKey!]: true },
    }
    const estimateExcluded = computeBuildEstimate(shopping, excludedProject)
    expect(estimateExcluded.subtotalUsd).toBeLessThan(estimateAll.subtotalUsd)
  })
})
