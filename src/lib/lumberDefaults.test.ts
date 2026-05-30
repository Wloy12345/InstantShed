import { describe, expect, it } from 'vitest'
import { ceilEvenStandardLengthFt, floorJoistBuyLengthFt } from './lumberDefaults'

describe('ceilEvenStandardLengthFt', () => {
  it('rounds up to next even standard length', () => {
    expect(ceilEvenStandardLengthFt(12)).toBe(12)
    expect(ceilEvenStandardLengthFt(13)).toBe(14)
    expect(ceilEvenStandardLengthFt(14.5)).toBe(16)
  })
})

describe('floorJoistBuyLengthFt', () => {
  it('covers joist span on 12x12', () => {
    expect(floorJoistBuyLengthFt(12)).toBe(12)
  })
})
