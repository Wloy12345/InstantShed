import { describe, expect, it } from 'vitest'
import {
  computeMetrics,
  computeRafterCount,
  computeRafterLengthFt,
  estimateRoofAreaSqFt,
  estimateRoofSheathingAreaSqFt,
  slopeFactor,
} from './calculations'
import { createDefaultProject } from './projectIO'
import type { Project } from '../types/project'

function makeProject(overrides: Partial<Project> = {}): Project {
  return { ...createDefaultProject(), id: 'test', name: 'Test', ...overrides }
}

describe('slopeFactor', () => {
  it('returns 1 for flat pitch', () => {
    expect(slopeFactor(0)).toBe(1)
  })

  it('increases with pitch', () => {
    expect(slopeFactor(6)).toBeGreaterThan(slopeFactor(4))
  })
})

describe('computeMetrics', () => {
  it('computes 144 sq ft for 12x12', () => {
    const metrics = computeMetrics(makeProject())
    expect(metrics.floorAreaSqFt).toBe(144)
    expect(metrics.perimeterFt).toBe(48)
    expect(metrics.wallAreaSqFt).toBe(384)
  })

  it('computes 140 sq ft for 10x14', () => {
    const metrics = computeMetrics(
      makeProject({ footprint: { lengthFt: 10, widthFt: 14 } }),
    )
    expect(metrics.floorAreaSqFt).toBe(140)
    expect(metrics.perimeterFt).toBe(48)
  })
})

describe('estimateRoofAreaSqFt', () => {
  it('returns footprint for flat roof', () => {
    expect(estimateRoofAreaSqFt(144, 'flat')).toBe(144)
  })

  it('returns positive area for each sloped roof type', () => {
    for (const type of ['shed', 'gable', 'hip'] as const) {
      expect(estimateRoofAreaSqFt(144, type, 4)).toBeGreaterThan(144)
    }
  })

  it('hip roof is larger than gable at same pitch', () => {
    expect(estimateRoofAreaSqFt(144, 'hip', 4)).toBeGreaterThan(
      estimateRoofAreaSqFt(144, 'gable', 4),
    )
  })
})

describe('computeRafterCount', () => {
  it('returns 10 rafters for 12x12 shed at 16 inch OC', () => {
    expect(computeRafterCount(12, 12, 'shed', 16)).toBe(10)
  })

  it('doubles count for gable (both slopes)', () => {
    expect(computeRafterCount(12, 12, 'gable', 16)).toBe(20)
  })
})

describe('computeRafterLengthFt', () => {
  it('uses depth plus 2 ft for shed slant roof', () => {
    expect(computeRafterLengthFt(12, 12, 'shed', 4)).toBe(14)
  })

  it('uses half span plus single eave overhang for gable', () => {
    const len = computeRafterLengthFt(12, 12, 'gable', 4)
    expect(len).toBeGreaterThan(7)
    expect(len).toBeLessThan(8)
  })
})

describe('estimateRoofSheathingAreaSqFt', () => {
  it('adds waste so 12x12 shed needs at least 6 sheets at 4/12', () => {
    const area = estimateRoofSheathingAreaSqFt(144, 'shed', 4)
    const sheets = Math.ceil(area / 32)
    expect(sheets).toBeGreaterThanOrEqual(6)
  })
})
