import { describe, expect, it } from 'vitest'
import { buildPrintableMaterialsHtml, hasComputedMaterials } from './exportPrintList'
import { createDefaultProject } from './projectIO'
import { suggestMaterials } from './projectIO'

describe('exportPrintList', () => {
  it('hasComputedMaterials is false until regenerate', () => {
    expect(hasComputedMaterials(createDefaultProject())).toBe(false)
  })

  it('hasComputedMaterials is true after suggest', () => {
    const project = createDefaultProject()
    project.materials = suggestMaterials(project)
    expect(hasComputedMaterials(project)).toBe(true)
  })

  it('buildPrintableMaterialsHtml includes project name and total', () => {
    const project = createDefaultProject()
    project.materials = suggestMaterials(project)
    const html = buildPrintableMaterialsHtml(project)
    expect(html).toContain('New shed')
    expect(html).toContain('Materials subtotal')
    expect(html).toContain('Lowe')
  })
})
