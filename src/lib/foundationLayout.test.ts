import { describe, expect, it } from 'vitest'
import { computePierLayout, postCountForDimension } from './foundationLayout'
import type { Project } from '../types/project'

function pierProject(overrides: Partial<Project> = {}): Project {
  return {
    id: '1',
    name: 'Shed',
    footprint: { lengthFt: 12, widthFt: 12 },
    wallHeightFt: 8,
    roof: { type: 'gable', pitchRisePer12: 4 },
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
    materials: [],
    ...overrides,
  }
}

describe('postCountForDimension', () => {
  it('returns at least 2 posts per axis', () => {
    expect(postCountForDimension(4, 8)).toBe(2)
  })
})

describe('computePierLayout', () => {
  it('returns null for slab foundation', () => {
    const project = pierProject({
      foundation: { type: 'slab' },
    })
    expect(computePierLayout(project)).toBeNull()
  })

  it('lays out timber_pier as two runners (6 piers on 12x12)', () => {
    const project = pierProject({
      foundation: { type: 'timber_pier', postSize: '6x6', perimeterBeam: false },
    })
    const layout = computePierLayout(project)
    expect(layout?.cols).toBe(3)
    expect(layout?.rows).toBe(2)
    expect(layout?.postCount).toBe(6)
    expect(layout?.spacingLengthFt).toBe(6)
    expect(layout?.spacingWidthFt).toBe(12)
  })

  it('yields 3x3 grid with 6 ft spacing for 12x12 and 6x6', () => {
    const layout = computePierLayout(pierProject())
    expect(layout).not.toBeNull()
    expect(layout!.cols).toBe(3)
    expect(layout!.rows).toBe(3)
    expect(layout!.postCount).toBe(9)
    expect(layout!.spacingLengthFt).toBe(6)
    expect(layout!.spacingWidthFt).toBe(6)
  })

  it('yields tighter grid for 4x4 on larger footprint', () => {
    const layout6 = computePierLayout(
      pierProject({ footprint: { lengthFt: 20, widthFt: 12 } }),
    )
    const layout4 = computePierLayout(
      pierProject({
        footprint: { lengthFt: 20, widthFt: 12 },
        foundation: { type: 'pier_beam', postSize: '4x4', perimeterBeam: true },
      }),
    )
    expect(layout4!.postCount).toBeGreaterThan(layout6!.postCount)
  })
})
