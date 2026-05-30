import { describe, expect, it } from 'vitest'
import { snapFootprintFt, snapWallHeightFt } from './dimensionConstraints'
import {
  clampFootprint,
  clampWallHeight,
  footprintFromCornerDrag,
  footprintFromEdgeDrag,
  snapFeet,
  svgDeltaToFeet,
  wallHeightFromDragDelta,
} from './footprintEditor'

describe('snapFeet', () => {
  it('snaps to 2 ft increments', () => {
    expect(snapFeet(10.3)).toBe(10)
    expect(snapFeet(11.2)).toBe(12)
  })
})

describe('snapFootprintFt', () => {
  it('snaps to even 2 ft and clamps min 8', () => {
    expect(snapFootprintFt(10.7)).toBe(10)
    expect(snapFootprintFt(3)).toBe(8)
  })
})

describe('clampFootprint', () => {
  it('clamps to min 8 and max 48', () => {
    expect(clampFootprint(2, 2).lengthFt).toBe(8)
    expect(clampFootprint(100, 12).lengthFt).toBe(48)
  })
})

describe('svgDeltaToFeet', () => {
  it('converts pixels using scale', () => {
    expect(svgDeltaToFeet(24, 2)).toBe(12)
  })
})

describe('footprintFromCornerDrag', () => {
  it('grows length and width from SE corner', () => {
    const r = footprintFromCornerDrag(12, 12, 4, 4, 1)
    expect(r.lengthFt).toBe(16)
    expect(r.widthFt).toBe(16)
  })
})

describe('footprintFromEdgeDrag', () => {
  it('updates only length on east edge', () => {
    const r = footprintFromEdgeDrag(12, 10, 'e', 2, 0, 1)
    expect(r.lengthFt).toBe(14)
    expect(r.widthFt).toBe(10)
  })
})

describe('wallHeightFromDragDelta', () => {
  it('increases height when dragging up', () => {
    expect(wallHeightFromDragDelta(8, -2, 1)).toBeGreaterThan(8)
  })

  it('clamps wall height to allowed options', () => {
    expect(clampWallHeight(3)).toBe(7)
    expect(clampWallHeight(20)).toBe(10)
    expect(snapWallHeightFt(8)).toBe(8)
  })
})
