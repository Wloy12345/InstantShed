import { needsRoofMidSpanSupport } from './lumberDefaults'
import { roofUsesRafterFraming } from './roofFraming'
import type { Project } from '../types/project'

export function computeStructuralWarnings(project: Project): string[] {
  const warnings: string[] = []
  const { widthFt } = project.footprint

  if (
    roofUsesRafterFraming(project) &&
    project.roof.type === 'shed' &&
    needsRoofMidSpanSupport(widthFt)
  ) {
    warnings.push(
      'A mid-span support beam or internal partition wall is structurally required for slant roof spans over 15 feet.',
    )
  }

  return warnings
}
