import type { Project } from '../types/project'

/** A door opening on the front wall, centered at world X = `x`. */
export interface DoorPlacement {
  x: number
  widthFt: number
  heightFt: number
}

/** A window opening on a side wall (`x = ±halfL`), centered at world Z = `z`. */
export interface WindowPlacement {
  side: 'left' | 'right'
  z: number
  widthFt: number
  heightFt: number
  /** Height of the window sill above the floor. */
  sillFt: number
}

const DOOR_DIMS: Record<Exclude<Project['openings']['doorType'], 'none'>, { w: number; h: number }> = {
  prehung_36x80: { w: 3, h: 6.67 },
  double_60x80: { w: 5, h: 6.67 },
}

const WINDOW_DIMS: Record<Exclude<Project['openings']['windowType'], 'none'>, { w: number; h: number }> = {
  vinyl_24x36: { w: 2, h: 3 },
  vinyl_36x36: { w: 3, h: 3 },
}

/** Vertical center of windows as a fraction of wall height. */
const WINDOW_CENTER_FRACTION = 0.55

/**
 * Door positions along the front wall, evenly spaced and clamped so they never
 * exceed the available wall length. Shared by the solid model and framing view.
 */
export function computeDoorPlacements(project: Project, halfL: number): DoorPlacement[] {
  const { doorType, doorCount } = project.openings
  if (doorType === 'none' || doorCount <= 0) return []
  const dim = DOOR_DIMS[doorType]
  const usable = halfL * 2 - 1
  const maxFit = Math.max(1, Math.floor(usable / (dim.w + 0.5)))
  const count = Math.min(doorCount, maxFit)
  const placements: DoorPlacement[] = []
  for (let i = 0; i < count; i++) {
    const x = -((count - 1) / 2) * (dim.w + 1) + i * (dim.w + 1)
    placements.push({ x, widthFt: dim.w, heightFt: dim.h })
  }
  return placements
}

/**
 * Window positions distributed across the two side walls, clamped to the
 * available wall depth. Shared by the solid model and framing view.
 */
export function computeWindowPlacements(
  project: Project,
  halfW: number,
  wallHeightFt: number,
): WindowPlacement[] {
  const { windowType, windowCount } = project.openings
  if (windowType === 'none' || windowCount <= 0) return []
  const dim = WINDOW_DIMS[windowType]
  const sillFt = wallHeightFt * WINDOW_CENTER_FRACTION - dim.h / 2
  const usable = halfW * 2 - 1
  const perSide = Math.max(1, Math.floor(usable / (dim.w + 1)))
  const placements: WindowPlacement[] = []
  let placed = 0
  for (const side of ['right', 'left'] as const) {
    const remaining = windowCount - placed
    if (remaining <= 0) break
    const count = Math.min(remaining, perSide)
    for (let i = 0; i < count; i++) {
      const z = -((count - 1) / 2) * (dim.w + 1) + i * (dim.w + 1)
      placements.push({ side, z, widthFt: dim.w, heightFt: dim.h, sillFt })
    }
    placed += count
  }
  return placements
}
