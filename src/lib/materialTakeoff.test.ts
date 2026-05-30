import { describe, expect, it } from 'vitest'
import { computeStudCount, computeTakeoff } from './materialTakeoff'
import type { Project } from '../types/project'

function baseProject(overrides: Partial<Project> = {}): Project {
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
    ...overrides,
  }
}

describe('computeStudCount', () => {
  it('returns 46 studs for 12x12 at 16 OC with door', () => {
    expect(computeStudCount(baseProject())).toBe(46)
  })

  it('returns 44 studs for 12x12 at 16 OC without door', () => {
    expect(
      computeStudCount(
        baseProject({
          openings: { doorType: 'none', doorCount: 0, windowType: 'none', windowCount: 0 },
        }),
      ),
    ).toBe(44)
  })

  it('returns more studs at 16 OC than 24 OC', () => {
    const tight = computeStudCount(baseProject({ framing: { studSize: '2x4', studSpacingIn: 16 } }))
    const loose = computeStudCount(baseProject({ framing: { studSize: '2x4', studSpacingIn: 24 } }))
    expect(tight).toBeGreaterThan(loose)
  })
})

describe('computeTakeoff', () => {
  it('includes timber pier bundle without beam grid or skids', () => {
    const lines = computeTakeoff(
      baseProject({
        foundation: { type: 'timber_pier', postSize: '6x6', perimeterBeam: false },
      }),
    )
    expect(lines.some((l) => l.stockKey === 'foundation.sono_concrete')).toBe(true)
    expect(lines.some((l) => l.stockKey === 'foundation.post_anchor')).toBe(true)
    expect(lines.some((l) => l.stockKey === 'foundation.pier_post')).toBe(true)
    expect(lines.some((l) => l.stockKey === 'floor.rim_joist')).toBe(true)
    expect(lines.some((l) => l.stockKey === 'hardware.joist_hanger')).toBe(true)
    expect(lines.some((l) => l.stockKey === 'floor.subfloor')).toBe(true)
    expect(lines.some((l) => l.stockKey === 'foundation.skids')).toBe(false)
    expect(lines.some((l) => l.stockKey === 'foundation.perimeter_beam')).toBe(false)
    expect(lines.some((l) => l.stockKey === 'floor.decking')).toBe(false)
  })

  it('timber pier 12x12 quantities match typical takeoff', () => {
    const lines = computeTakeoff(
      baseProject({
        foundation: { type: 'timber_pier', postSize: '6x6', perimeterBeam: false },
        roof: { type: 'shed', pitchRisePer12: 4 },
      }),
    )
    const sono = lines.find((l) => l.stockKey === 'foundation.sono_concrete')
    const girders = lines.find((l) => l.stockKey === 'foundation.girder_4x6')
    const joists = lines.find((l) => l.stockKey === 'floor.joists')
    const hangers = lines.find((l) => l.stockKey === 'hardware.joist_hanger')
    const rim = lines.find((l) => l.stockKey === 'floor.rim_joist')
    const rafters = lines.find((l) => l.stockKey === 'roofing.rafters')
    const subfloor = lines.find((l) => l.stockKey === 'floor.subfloor')
    expect(sono?.quantity).toBe(6)
    expect(girders?.quantity).toBe(2)
    expect(girders?.stockLengthFt).toBe(12)
    expect(joists?.count).toBe(10)
    expect(joists?.stockLengthFt).toBe(12)
    expect(joists?.name).toContain('2×6')
    expect(hangers?.quantity).toBe(20)
    expect(rim?.quantity).toBe(2)
    expect(rafters?.count).toBe(10)
    expect(rafters?.stockLengthFt).toBe(14)
    expect(subfloor?.quantity).toBe(144)
    expect(subfloor?.name).toContain('3/4"')
  })

  it('framing studs count matches computeStudCount for default project', () => {
    const project = baseProject()
    const lines = computeTakeoff(project)
    const studs = lines.find((l) => l.stockKey === 'framing.studs')
    expect(studs?.count).toBe(computeStudCount(project))
    expect(studs?.count).toBe(46)
  })

  it('includes slab line for slab foundation without framed floor', () => {
    const lines = computeTakeoff(
      baseProject({ foundation: { type: 'slab' } }),
    )
    expect(lines.some((l) => l.name.includes('slab'))).toBe(true)
    expect(lines.some((l) => l.name.includes('post'))).toBe(false)
    expect(lines.some((l) => l.stockKey === 'floor.joists')).toBe(false)
    expect(lines.some((l) => l.stockKey === 'floor.decking')).toBe(false)
  })

  it('pier beam uses row girders and framed floor without 6x6 beams', () => {
    const lines = computeTakeoff(baseProject())
    const girders = lines.find((l) => l.stockKey === 'foundation.girder_4x6')
    expect(lines.some((l) => l.stockKey === 'foundation.perimeter_beam')).toBe(false)
    expect(lines.some((l) => l.stockKey === 'foundation.interior_beam')).toBe(false)
    expect(girders?.quantity).toBe(3)
    expect(girders?.stockLengthFt).toBe(12)
    expect(lines.some((l) => l.stockKey === 'floor.joists')).toBe(true)
    expect(lines.some((l) => l.stockKey === 'floor.decking')).toBe(true)
  })

  it('gable roof on 12x12 uses 8 ft rafters, ridge board, and 20 hurricane ties', () => {
    const lines = computeTakeoff(baseProject())
    const rafters = lines.find((l) => l.stockKey === 'roofing.rafters')
    const ridge = lines.find((l) => l.stockKey === 'roofing.ridge_board')
    const ties = lines.find((l) => l.stockKey === 'hardware.hurricane_tie')
    expect(rafters?.count).toBe(20)
    expect(rafters?.stockLengthFt).toBe(8)
    expect(ridge?.count).toBe(1)
    expect(ridge?.stockLengthFt).toBe(14)
    expect(ties?.quantity).toBe(20)
  })

  it('adds metal roofing system lines', () => {
    const lines = computeTakeoff(baseProject())
    expect(lines.some((l) => l.stockKey === 'roofing.metal_panels')).toBe(true)
    expect(lines.some((l) => l.stockKey === 'roofing.screws')).toBe(true)
  })

  it('always adds rafters and ties for sloped roofs', () => {
    const lines = computeTakeoff(
      baseProject({
        roof: { type: 'shed', pitchRisePer12: 4 },
      }),
    )
    const rafters = lines.find((l) => l.stockKey === 'roofing.rafters')
    const ties = lines.find((l) => l.stockKey === 'hardware.hurricane_tie')
    expect(rafters?.count).toBe(10)
    expect(ties?.quantity).toBe(20)
    expect(lines.some((l) => l.stockKey === 'roofing.sheathing')).toBe(true)
  })

  it('scales rafter count with footprint length', () => {
    const small = computeTakeoff(
      baseProject({ footprint: { lengthFt: 8, widthFt: 8 }, roof: { type: 'shed', pitchRisePer12: 4 } }),
    )
    const large = computeTakeoff(
      baseProject({ footprint: { lengthFt: 16, widthFt: 12 }, roof: { type: 'shed', pitchRisePer12: 4 } }),
    )
    const smallRafters = small.find((l) => l.stockKey === 'roofing.rafters')?.count ?? 0
    const largeRafters = large.find((l) => l.stockKey === 'roofing.rafters')?.count ?? 0
    expect(largeRafters).toBeGreaterThan(smallRafters)
  })

  it('adds shingle covering lines when roofing type is shingles', () => {
    const lines = computeTakeoff(
      baseProject({
        roofing: {
          type: 'shingles',
          includeUnderlayment: true,
          includeDripEdge: true,
          includeRidgeCap: true,
          panelCoverageWidthIn: 36,
          screwPerSqFt: 0.9,
        },
      }),
    )
    expect(lines.some((l) => l.stockKey === 'roofing.shingles')).toBe(true)
    expect(lines.some((l) => l.stockKey === 'roofing.metal_panels')).toBe(false)
    expect(lines.some((l) => l.stockKey === 'roofing.rafters')).toBe(true)
  })

  it('omits rafters for flat roofs', () => {
    const lines = computeTakeoff(baseProject({ roof: { type: 'flat' } }))
    expect(lines.some((l) => l.stockKey === 'roofing.rafters')).toBe(false)
  })

  it('adds electrical only for electrical scope', () => {
    const noElec = computeTakeoff(baseProject({ buildScope: 'structure_weatherproof' }))
    const yesElec = computeTakeoff(baseProject({ buildScope: 'include_electrical' }))
    expect(noElec.some((l) => l.stockKey.startsWith('electrical.'))).toBe(false)
    expect(yesElec.some((l) => l.stockKey.startsWith('electrical.'))).toBe(true)
  })

  it('defaults joist stock length to footprint span on 12x12', () => {
    const lines = computeTakeoff(
      baseProject({
        foundation: { type: 'timber_pier', postSize: '6x6', perimeterBeam: false },
      }),
    )
    const joists = lines.find((l) => l.stockKey === 'floor.joists')
    expect(joists?.stockLengthFt).toBe(12)
  })

  it('uses triple plate linear feet on 12x12', () => {
    const lines = computeTakeoff(baseProject())
    const plates = lines.find((l) => l.stockKey === 'framing.plates')
    expect(plates?.linearFeetNeeded).toBe(144)
    expect(plates?.stockLengthFt).toBe(12)
  })

  it('skips wall sheathing for structural panel wall system', () => {
    const lines = computeTakeoff(baseProject())
    expect(lines.some((l) => l.stockKey === 'walls.sheathing')).toBe(false)
  })

  it('includes wall sheathing for sheathing_and_wrap system', () => {
    const lines = computeTakeoff(
      baseProject({
        siding: {
          type: 't111_4x8',
          wallSystem: 'sheathing_and_wrap',
          includeHousewrap: true,
        },
      }),
    )
    expect(lines.some((l) => l.stockKey === 'walls.sheathing')).toBe(true)
  })

  it('limits sheathing nail boxes for small sheds', () => {
    const lines = computeTakeoff(
      baseProject({
        roof: { type: 'shed', pitchRisePer12: 4 },
        siding: {
          type: 't111_4x8',
          wallSystem: 'structural_panel',
          includeHousewrap: false,
        },
      }),
    )
    const nails = lines.find((l) => l.stockKey === 'hardware.sheathing_nails')
    expect(nails?.quantity).toBeLessThanOrEqual(2)
  })

  it('marks only lumber/sheet/trim as overridable', () => {
    const lines = computeTakeoff(baseProject({ buildScope: 'full_finish' }))
    const studs = lines.find((l) => l.stockKey === 'framing.studs')
    const underlayment = lines.find((l) => l.stockKey === 'roofing.underlayment')
    const trim = lines.find((l) => l.stockKey === 'trim.corner_boards')
    expect(studs?.allowStoreSizeOverride).toBe(true)
    expect(trim?.allowStoreSizeOverride).toBe(true)
    expect(underlayment?.allowStoreSizeOverride).not.toBe(true)
  })
})
