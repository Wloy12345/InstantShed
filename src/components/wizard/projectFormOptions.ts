import type { BuildScope, InteriorFinish, RoofType, SidingType } from '../../types/project'

export const ROOF_OPTIONS: { value: RoofType; label: string }[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'shed', label: 'Shed (single slope)' },
  { value: 'gable', label: 'Gable' },
  { value: 'hip', label: 'Hip' },
]

export const SIDING_OPTIONS: { value: SidingType; label: string }[] = [
  { value: 'none', label: 'None (framing only)' },
  { value: 't111_4x8', label: 'T1-11 panels (4×8)' },
  { value: 'lp_smartside_4x8', label: 'LP SmartSide panels (4×8)' },
]

export const INTERIOR_OPTIONS: { value: InteriorFinish; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'osb_7_16_4x8', label: 'OSB 7/16" (4×8)' },
  { value: 'drywall_1_2_4x8', label: 'Drywall 1/2" (4×8)' },
]

export const SCOPE_OPTIONS: { value: BuildScope; label: string }[] = [
  { value: 'structure_weatherproof', label: 'Structure + weatherproofing' },
  { value: 'full_finish', label: 'Full finish + site prep' },
  { value: 'include_electrical', label: 'Full finish + electrical rough-in' },
]

export function roofTypeLabel(type: RoofType): string {
  return ROOF_OPTIONS.find((o) => o.value === type)?.label ?? type
}

export function buildScopeLabel(scope: BuildScope): string {
  return SCOPE_OPTIONS.find((o) => o.value === scope)?.label ?? scope
}
