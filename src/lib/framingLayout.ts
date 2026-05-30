import type { Project } from '../types/project'
import { computePierLayout } from './foundationLayout'
import { computeDoorPlacements, computeWindowPlacements } from './openingsLayout'

/** Structural member kinds, used to color/group framing geometry in the 3D view. */
export type MemberKind = 'stud' | 'plate' | 'joist' | 'rafter' | 'ridge' | 'post'

/**
 * A single piece of framing lumber expressed as an axis-aligned (optionally
 * rotated) box in world space. The building is centered on the origin with
 * +X along length, +Z along width (depth), and +Y up. The floor top sits at
 * y = 0 and walls rise to y = wallHeightFt.
 */
export interface FramingMember {
  key: string
  kind: MemberKind
  position: [number, number, number]
  size: [number, number, number]
  rotation?: [number, number, number]
}

const inToFt = (inches: number) => inches / 12

/** Nominal lumber is 1.5" thick; depth depends on the stud size. */
const NOMINAL_THICK_FT = inToFt(1.5)

function studDepthFt(size: Project['framing']['studSize']): number {
  return inToFt(size === '2x6' ? 5.5 : 3.5)
}

const PLATE_THICK_FT = NOMINAL_THICK_FT
const JOIST_DEPTH_FT = inToFt(5.5)
const RAFTER_DEPTH_FT = inToFt(5.5)
const HEADER_DEPTH_FT = inToFt(7.25)
const SILL_THICK_FT = inToFt(3)

function postWidthFt(project: Project): number {
  return inToFt(project.foundation.postSize === '4x4' ? 3.5 : 5.5)
}

/** Evenly spaced positions across `span` (centered on 0) no farther apart than `spacingFt`. */
function spreadPositions(span: number, spacingFt: number): number[] {
  if (span <= 0) return [0]
  const segments = Math.max(1, Math.ceil(span / spacingFt))
  const positions: number[] = []
  for (let i = 0; i <= segments; i++) {
    positions.push(-span / 2 + (span * i) / segments)
  }
  return positions
}

/** A wall expressed along its run direction `u` (the other horizontal axis is `fixed`). */
interface WallSpec {
  id: string
  /** Axis the wall runs along: 'x' = front/back, 'z' = side walls. */
  axis: 'x' | 'z'
  /** Coordinate of the wall on the perpendicular horizontal axis. */
  fixed: number
  /** Wall length along the run axis. */
  span: number
  /** Stud depth (the perpendicular horizontal dimension). */
  depth: number
}

/** A framed opening described in the wall's local run coordinate `u`. */
interface WallOpening {
  center: number
  width: number
  bottom: number
  top: number
}

/**
 * Build studs for one wall plus full rough-opening framing (king studs,
 * jack/trimmer studs, header, sill, and cripple studs) for each opening.
 * Regular studs that fall inside an opening are omitted.
 */
function buildWallFraming(
  wall: WallSpec,
  openings: WallOpening[],
  h: number,
  spacingFt: number,
): FramingMember[] {
  const { id, axis, fixed, span, depth } = wall
  const thick = NOMINAL_THICK_FT
  const members: FramingMember[] = []

  // Convert a member described along the run axis into world position/size.
  const place = (
    u: number,
    y: number,
    runLen: number,
    height: number,
  ): Pick<FramingMember, 'position' | 'size'> =>
    axis === 'x'
      ? { position: [u, y, fixed], size: [runLen, height, depth] }
      : { position: [fixed, y, u], size: [depth, height, runLen] }

  // Regular studs, skipping any that land inside an opening.
  spreadPositions(span, spacingFt).forEach((u, i) => {
    const inside = openings.some((o) => Math.abs(u - o.center) < o.width / 2 + thick)
    if (inside) return
    members.push({ key: `stud-${id}-${i}`, kind: 'stud', ...place(u, h / 2, thick, h) })
  })

  openings.forEach((o, oi) => {
    const half = o.width / 2
    const top = Math.min(o.top, h - HEADER_DEPTH_FT - PLATE_THICK_FT)

    for (const s of [-1, 1] as const) {
      // Jack/trimmer stud: bottom plate up to the header.
      const jackU = o.center + s * (half + thick / 2)
      members.push({
        key: `jack-${id}-${oi}-${s}`,
        kind: 'stud',
        ...place(jackU, top / 2, thick, top),
      })
      // King stud: full height, just outside the jack.
      const kingU = o.center + s * (half + thick * 1.5)
      members.push({
        key: `king-${id}-${oi}-${s}`,
        kind: 'stud',
        ...place(kingU, h / 2, thick, h),
      })
    }

    // Header across the opening (bears on the jacks).
    members.push({
      key: `header-${id}-${oi}`,
      kind: 'plate',
      ...place(o.center, top + HEADER_DEPTH_FT / 2, o.width + thick * 2, HEADER_DEPTH_FT),
    })

    // Cripple studs above the header up to the top plate.
    const aboveBottom = top + HEADER_DEPTH_FT
    const aboveHeight = h - PLATE_THICK_FT - aboveBottom
    if (aboveHeight > 0.25) {
      spreadPositions(o.width, spacingFt)
        .filter((du) => Math.abs(du) < half - thick)
        .forEach((du, ci) => {
          members.push({
            key: `cripple-top-${id}-${oi}-${ci}`,
            kind: 'stud',
            ...place(o.center + du, aboveBottom + aboveHeight / 2, thick, aboveHeight),
          })
        })
    }

    // Windows have a sill plate and cripple studs beneath it.
    if (o.bottom > 0.01) {
      members.push({
        key: `sill-${id}-${oi}`,
        kind: 'plate',
        ...place(o.center, o.bottom - SILL_THICK_FT / 2, o.width + thick * 2, SILL_THICK_FT),
      })
      const belowHeight = o.bottom - SILL_THICK_FT - PLATE_THICK_FT
      if (belowHeight > 0.25) {
        spreadPositions(o.width, spacingFt)
          .filter((du) => Math.abs(du) < half - thick)
          .forEach((du, ci) => {
            members.push({
              key: `cripple-bot-${id}-${oi}-${ci}`,
              kind: 'stud',
              ...place(o.center + du, PLATE_THICK_FT + belowHeight / 2, thick, belowHeight),
            })
          })
      }
    }
  })

  return members
}

/**
 * Build every framing member for the current project so the 3D view can render
 * a stick-frame model. Pure function (no Three.js) so it can be unit tested.
 */
export function computeFramingMembers(project: Project): FramingMember[] {
  const { lengthFt, widthFt } = project.footprint
  const h = project.wallHeightFt
  const halfL = lengthFt / 2
  const halfW = widthFt / 2
  const spacingFt = project.framing.studSpacingIn / 12
  const depth = studDepthFt(project.framing.studSize)
  const members: FramingMember[] = []

  // ——— Wall studs + framed rough openings ———
  const doors = computeDoorPlacements(project, halfL)
  const windows = computeWindowPlacements(project, halfW, h)

  // Front/back walls run along X at z = ±halfW. Doors are on the front wall.
  const frontBackStudSpan = lengthFt - 2 * depth
  members.push(
    ...buildWallFraming(
      { id: 'front', axis: 'x', fixed: halfW - depth / 2, span: frontBackStudSpan, depth },
      doors.map((d) => ({ center: d.x, width: d.widthFt, bottom: 0, top: d.heightFt })),
      h,
      spacingFt,
    ),
  )
  members.push(
    ...buildWallFraming(
      { id: 'back', axis: 'x', fixed: -(halfW - depth / 2), span: frontBackStudSpan, depth },
      [],
      h,
      spacingFt,
    ),
  )

  // Left/right walls run along Z at x = ±halfL. Windows are split across both.
  const sideStudSpan = widthFt - 2 * depth
  for (const side of ['right', 'left'] as const) {
    const xSign = side === 'right' ? 1 : -1
    const sideWindows = windows
      .filter((w) => w.side === side)
      .map((w) => ({
        center: w.z,
        width: w.widthFt,
        bottom: w.sillFt,
        top: w.sillFt + w.heightFt,
      }))
    members.push(
      ...buildWallFraming(
        { id: side, axis: 'z', fixed: xSign * (halfL - depth / 2), span: sideStudSpan, depth },
        sideWindows,
        h,
        spacingFt,
      ),
    )
  }

  // ——— Plates (bottom + double top) per wall ———
  const plateYs: Array<{ y: number; tag: string }> = [
    { y: PLATE_THICK_FT / 2, tag: 'bottom' },
    { y: h - PLATE_THICK_FT / 2, tag: 'top1' },
    { y: h - (3 * PLATE_THICK_FT) / 2, tag: 'top2' },
  ]
  for (const { y, tag } of plateYs) {
    for (const zSign of [1, -1] as const) {
      members.push({
        key: `plate-${tag}-${zSign > 0 ? 'front' : 'back'}`,
        kind: 'plate',
        position: [0, y, zSign * (halfW - depth / 2)],
        size: [lengthFt, PLATE_THICK_FT, depth],
      })
    }
    for (const xSign of [1, -1] as const) {
      members.push({
        key: `plate-${tag}-${xSign > 0 ? 'right' : 'left'}`,
        kind: 'plate',
        position: [xSign * (halfL - depth / 2), y, 0],
        size: [depth, PLATE_THICK_FT, widthFt - 2 * depth],
      })
    }
  }

  // ——— Floor joists across the shorter span ———
  const joistY = -JOIST_DEPTH_FT / 2
  if (widthFt <= lengthFt) {
    // Joists run along Z, spaced along X.
    spreadPositions(lengthFt, spacingFt).forEach((x, i) => {
      members.push({
        key: `joist-${i}`,
        kind: 'joist',
        position: [x, joistY, 0],
        size: [NOMINAL_THICK_FT, JOIST_DEPTH_FT, widthFt],
      })
    })
  } else {
    // Joists run along X, spaced along Z.
    spreadPositions(widthFt, spacingFt).forEach((z, i) => {
      members.push({
        key: `joist-${i}`,
        kind: 'joist',
        position: [0, joistY, z],
        size: [lengthFt, JOIST_DEPTH_FT, NOMINAL_THICK_FT],
      })
    })
  }

  // ——— Roof framing ———
  members.push(...computeRoofFramingMembers(project, halfW))

  // ——— Foundation posts (reused pier layout) ———
  const pierLayout = computePierLayout(project)
  if (pierLayout) {
    const pw = postWidthFt(project)
    pierLayout.posts.forEach((post, i) => {
      members.push({
        key: `post-${i}`,
        kind: 'post',
        position: [post.xFt - halfL, -0.4, post.yFt - halfW],
        size: [pw, 0.8, pw],
      })
    })
  }

  return members
}

function computeRoofFramingMembers(
  project: Project,
  halfW: number,
): FramingMember[] {
  const { lengthFt, widthFt } = project.footprint
  const h = project.wallHeightFt
  const spacingFt = project.framing.studSpacingIn / 12
  const pitch =
    project.roof.type === 'flat' ? 0 : (project.roof.pitchRisePer12 ?? 4)
  const pitchRad = Math.atan(pitch / 12)
  const members: FramingMember[] = []

  if (project.roof.type === 'flat') {
    // Ceiling joists at the top of the walls.
    spreadPositions(lengthFt, spacingFt).forEach((x, i) => {
      members.push({
        key: `rafter-${i}`,
        kind: 'rafter',
        position: [x, h - JOIST_DEPTH_FT / 2, 0],
        size: [NOMINAL_THICK_FT, JOIST_DEPTH_FT, widthFt],
      })
    })
    return members
  }

  if (project.roof.type === 'shed') {
    const shedRise = Math.tan(pitchRad) * widthFt
    const slopeLen = widthFt / Math.cos(pitchRad)
    const halfL = lengthFt / 2
    const depth = studDepthFt(project.framing.studSize)

    // Sloped rafters running across the depth, spaced along the length.
    spreadPositions(lengthFt, spacingFt).forEach((x, i) => {
      members.push({
        key: `rafter-${i}`,
        kind: 'rafter',
        position: [x, h + shedRise / 2, 0],
        size: [NOMINAL_THICK_FT, RAFTER_DEPTH_FT, slopeLen],
        rotation: [pitchRad, 0, 0],
      })
    })

    // High (back) wall: gable studs filling from the wall top up to the roof,
    // capped by a top plate. (z = -halfW is the tall side for the shed slope.)
    const zBack = -(halfW - depth / 2)
    spreadPositions(lengthFt - 2 * depth, spacingFt).forEach((x, i) => {
      members.push({
        key: `shed-gable-${i}`,
        kind: 'stud',
        position: [x, h + shedRise / 2, zBack],
        size: [NOMINAL_THICK_FT, shedRise, depth],
      })
    })
    members.push({
      key: 'shed-gable-plate',
      kind: 'plate',
      position: [0, h + shedRise - PLATE_THICK_FT / 2, zBack],
      size: [lengthFt, PLATE_THICK_FT, depth],
    })

    // Side (rake) walls: triangular fill studs stepping from the low side up to
    // the high side, plus a sloped rake top plate following the roof line.
    for (const xSign of [1, -1] as const) {
      const xSide = xSign * (halfL - depth / 2)
      spreadPositions(widthFt - 2 * depth, spacingFt).forEach((z, i) => {
        const topY = h + (shedRise * (halfW - z)) / widthFt
        const fillH = topY - h
        if (fillH < 0.1) return
        members.push({
          key: `shed-rake-${xSign > 0 ? 'right' : 'left'}-${i}`,
          kind: 'stud',
          position: [xSide, h + fillH / 2, z],
          size: [depth, fillH, NOMINAL_THICK_FT],
        })
      })
      members.push({
        key: `shed-rake-plate-${xSign > 0 ? 'right' : 'left'}`,
        kind: 'plate',
        position: [xSide, h + shedRise / 2, 0],
        size: [depth, PLATE_THICK_FT, slopeLen],
        rotation: [pitchRad, 0, 0],
      })
    }

    return members
  }

  // Gable / hip: paired rafters meeting at a ridge.
  const rise = Math.tan(pitchRad) * halfW
  const slopeLen = halfW / Math.cos(pitchRad)
  spreadPositions(lengthFt, spacingFt).forEach((x, i) => {
    members.push({
      key: `rafter-front-${i}`,
      kind: 'rafter',
      position: [x, h + rise / 2, halfW / 2],
      size: [NOMINAL_THICK_FT, RAFTER_DEPTH_FT, slopeLen],
      rotation: [pitchRad, 0, 0],
    })
    members.push({
      key: `rafter-back-${i}`,
      kind: 'rafter',
      position: [x, h + rise / 2, -halfW / 2],
      size: [NOMINAL_THICK_FT, RAFTER_DEPTH_FT, slopeLen],
      rotation: [-pitchRad, 0, 0],
    })
  })
  members.push({
    key: 'ridge',
    kind: 'ridge',
    position: [0, h + rise, 0],
    size: [lengthFt, RAFTER_DEPTH_FT, NOMINAL_THICK_FT],
  })

  return members
}
