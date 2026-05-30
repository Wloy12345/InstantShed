import { formatFeet } from './calculations'

export function formatFootprintSummary(lengthFt: number, depthFt: number): string {
  return `${formatFeet(lengthFt)} × ${formatFeet(depthFt)} (Length × Depth)`
}
