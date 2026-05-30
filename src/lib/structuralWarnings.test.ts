import { describe, expect, it } from 'vitest'
import { computeStructuralWarnings } from './structuralWarnings'
import type { Project } from '../types/project'

function shedProject(depthFt: number): Project {
  return {
    id: '1',
    name: 'Shed',
    footprint: { lengthFt: 12, widthFt: depthFt },
    wallHeightFt: 8,
    roof: { type: 'shed', pitchRisePer12: 4 },
    buildScope: 'structure_weatherproof',
    openings: { doorType: 'none', doorCount: 0, windowType: 'none', windowCount: 0 },
    siding: { type: 't111_4x8', wallSystem: 'structural_panel', includeHousewrap: false },
    interior: { finish: 'none', insulated: false },
    roofing: {
      type: 'metal',
      includeUnderlayment: true,
      includeDripEdge: true,
      includeRidgeCap: false,
      panelCoverageWidthIn: 36,
      screwPerSqFt: 0.9,
    },
    trim: { includeCornerTrim: true, includeFasciaRake: true },
    electrical: { outletCount: 0, lightCount: 0, includeBreaker: false },
    foundation: { type: 'timber_pier', postSize: '6x6', perimeterBeam: false },
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

describe('computeStructuralWarnings', () => {
  it('warns when shed depth exceeds 15 ft', () => {
    const warnings = computeStructuralWarnings(shedProject(16))
    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings[0]).toContain('15 feet')
  })

  it('no warning for 12 ft depth', () => {
    expect(computeStructuralWarnings(shedProject(12))).toHaveLength(0)
  })
})
