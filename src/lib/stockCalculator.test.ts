import { describe, expect, it } from 'vitest'
import { piecesToBuyFromLinearFeet, computeShoppingList } from './stockCalculator'
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

describe('piecesToBuyFromLinearFeet', () => {
  it('rounds up', () => {
    expect(piecesToBuyFromLinearFeet(48, 8)).toBe(6)
    expect(piecesToBuyFromLinearFeet(49, 8)).toBe(7)
  })
})

describe('computeShoppingList', () => {
  it('includes posts for pier and beam', () => {
    const list = computeShoppingList(baseProject())
    const posts = list.find((l) => l.name.includes('post'))
    expect(posts?.piecesToBuy).toBe(9)
  })

  it('uses shopping list override for piece count', () => {
    const list = computeShoppingList({
      ...baseProject(),
      shoppingStockLengths: { 'framing.plates': 16 },
    })
    const plates = list.find((l) => l.stockKey === 'framing.plates')
    expect(plates?.effectiveStockFt).toBe(16)
    expect(plates?.piecesToBuy).toBe(9)
  })

  it('computes sheet count from custom sheet size', () => {
    const list = computeShoppingList({
      ...baseProject(),
      shoppingStockLengths: { 'floor.decking': 40 },
    })
    const deck = list.find((l) => l.stockKey === 'floor.decking')
    expect(deck?.piecesToBuy).toBe(Math.ceil(144 / 40))
  })

  it('reduces plate pieces when stock length increases', () => {
    const short = computeShoppingList({
      ...baseProject(),
      shoppingStockLengths: { 'framing.plates': 12 },
    })
    const long = computeShoppingList({
      ...baseProject(),
      shoppingStockLengths: { 'framing.plates': 16 },
    })
    const platesShort = short.find((l) => l.name.includes('plate'))
    const platesLong = long.find((l) => l.name.includes('plate'))
    expect(platesLong!.piecesToBuy).toBeLessThan(platesShort!.piecesToBuy)
  })

  it('ignores override for non-overridable lines', () => {
    const list = computeShoppingList({
      ...baseProject(),
      shoppingStockLengths: { 'roofing.screws': 999 },
    })
    const screws = list.find((l) => l.stockKey === 'roofing.screws')
    expect(screws?.allowStoreSizeOverride).not.toBe(true)
    expect(screws?.effectiveStockFt).toBe(0)
  })
})
