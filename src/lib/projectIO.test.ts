import { describe, expect, it } from 'vitest'
import { createDefaultProject, parseProjectJson, serializeProject } from './projectIO'

describe('projectIO', () => {
  it('round-trips export and import', () => {
    const project = createDefaultProject()
    project.materials.push({
      id: 'mat-1',
      category: 'Floor',
      name: 'OSB',
      quantity: 144,
      unit: 'sq ft',
    })
    const loaded = parseProjectJson(serializeProject(project))
    expect(loaded.name).toBe(project.name)
    expect(loaded.footprint).toEqual(project.footprint)
    expect(loaded.materials).toHaveLength(1)
  })

  it('rejects invalid JSON', () => {
    expect(() => parseProjectJson('not json')).toThrow(/Invalid JSON/)
  })

  it('applies defaults for v1 JSON without foundation/framing', () => {
    const v1 = {
      id: 'old',
      name: 'Legacy',
      footprint: { lengthFt: 10, widthFt: 10 },
      wallHeightFt: 8,
      roof: { type: 'gable', pitchRisePer12: 4 },
      materials: [],
    }
    const loaded = parseProjectJson(JSON.stringify(v1))
    expect(loaded.foundation.type).toBe('pier_beam')
    expect(loaded.framing.studSize).toBe('2x4')
    expect(loaded.storeStock.studLengthFt).toBe(8)
    expect(loaded.storeStock.sheathingSheetSqFt).toBe(32)
    expect(loaded.shoppingStockLengths).toEqual({})
  })
})
