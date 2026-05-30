import {
  computeMetrics,
  computeRafterCount,
  estimateRoofSheathingAreaSqFt,
} from './calculations'
import {
  addRoofFraming,
  addRoofUnderlaymentAndDrip,
  roofUsesRafterFraming,
} from './roofFraming'
import type { ProjectMetrics } from '../types/project'
import { computePierLayout } from './foundationLayout'
import {
  ceilEvenStandardLengthFt,
  floorJoistBuyLengthFt,
  floorJoistLumberSize,
  lumberSizeLabel,
} from './lumberDefaults'
import type { PierLayout, Project, TakeoffLine } from '../types/project'

export const SUBFLOOR_TG_NAME = '3/4" tongue & groove subfloor'

function addFoundationGirders(
  project: Project,
  layout: PierLayout | null,
  lines: TakeoffLine[],
): void {
  const { lengthFt } = project.footprint
  const girderBuyFt = ceilEvenStandardLengthFt(lengthFt)
  const isPierBeamGrid =
    project.foundation.type === 'pier_beam' && layout != null
  const count = isPierBeamGrid ? layout.rows : 2
  const notes = isPierBeamGrid
    ? `${count} girders spanning ${lengthFt}' (one per pier row)`
    : `2 lengthwise girders along ${lengthFt}'`

  lines.push({
    stockKey: 'foundation.girder_4x6',
    category: 'Foundation',
    name: 'PT 4×6 girder (on posts)',
    quantity: count,
    unit: 'pcs',
    allowStoreSizeOverride: true,
    count,
    linearFeetNeeded: count * lengthFt,
    stockLengthFt: girderBuyFt,
    notes,
  })
}

function addFloorJoistAndRimLines(project: Project, lines: TakeoffLine[]): void {
  const { lengthFt } = project.footprint
  const spacingIn = project.framing.studSpacingIn
  const joistCount = computeFloorJoistCount(project)
  const spanFt = lengthFt
  const size = floorJoistLumberSize(spanFt)
  const buyFt = floorJoistBuyLengthFt(spanFt)
  const dim = lumberSizeLabel(size)

  lines.push({
    stockKey: 'floor.rim_joist',
    category: 'Floor',
    name: `PT ${dim} rim joists`,
    quantity: 2,
    unit: 'pcs',
    allowStoreSizeOverride: true,
    count: 2,
    linearFeetNeeded: 2 * lengthFt,
    stockLengthFt: buyFt,
    notes: `2 rims along ${lengthFt}' sides`,
  })

  lines.push({
    stockKey: 'floor.joists',
    category: 'Floor',
    name: `PT ${dim} floor joists @ ${spacingIn}" OC`,
    quantity: joistCount,
    unit: 'pcs',
    allowStoreSizeOverride: true,
    count: joistCount,
    linearFeetNeeded: joistCount * lengthFt,
    stockLengthFt: buyFt,
    notes: `${joistCount} joists @ ${spacingIn}" OC spanning ${lengthFt}'`,
  })

  lines.push({
    stockKey: 'hardware.joist_hanger',
    category: 'Hardware',
    name: 'Joist hangers (galvanized)',
    quantity: joistCount * 2,
    unit: 'pcs',
    count: joistCount * 2,
    notes: '2 hangers per joist (both ends)',
  })
}

function usesStructuralWallPanels(project: Project): boolean {
  return project.siding.wallSystem === 'structural_panel'
}

function joistSpacingFt(project: Project): number {
  return project.framing.studSpacingIn / 12
}

export function computeFloorJoistCount(project: Project): number {
  const { widthFt } = project.footprint
  const spacingFt = joistSpacingFt(project)
  if (widthFt <= 0 || spacingFt <= 0) return 0
  return Math.ceil(widthFt / spacingFt) + 1
}

function studsOnWall(wallLengthFt: number, spacingIn: number): number {
  if (wallLengthFt <= 0 || spacingIn <= 0) return 0
  return Math.ceil((wallLengthFt * 12) / spacingIn) + 1
}

export function computeStudCount(project: Project): number {
  const { lengthFt, widthFt } = project.footprint
  const spacingIn = project.framing.studSpacingIn
  const lengthWallStuds = studsOnWall(lengthFt, spacingIn)
  const depthWallStuds = studsOnWall(widthFt, spacingIn)
  const base = lengthWallStuds * 2 + depthWallStuds * 2
  const cornerBlocks = 4
  const doorStuds =
    project.openings.doorType !== 'none' && (project.openings.doorCount ?? 0) > 0
      ? 2
      : 0
  return base + cornerBlocks + doorStuds
}

function addTimberPierFoundationAndFloor(
  project: Project,
  layout: PierLayout,
  metrics: ProjectMetrics,
  lines: TakeoffLine[],
): void {
  const { lengthFt } = project.footprint
  const stock = project.storeStock
  const pierNote = `Spacing ${Math.round(layout.spacingLengthFt * 10) / 10}' along length; 2 rows front/back`

  lines.push({
    stockKey: 'foundation.sono_concrete',
    category: 'Foundation',
    name: 'Concrete mix & sonotubes',
    quantity: layout.postCount,
    unit: 'pcs',
    count: layout.postCount,
    notes: `1 sono tube + mix per pier; ${pierNote}`,
  })

  lines.push({
    stockKey: 'foundation.post_anchor',
    category: 'Foundation',
    name: 'Post anchor brackets',
    quantity: layout.postCount,
    unit: 'pcs',
    count: layout.postCount,
    notes: '1 bracket per pier to transition concrete to wood',
  })

  lines.push({
    stockKey: 'foundation.pier_post',
    category: 'Foundation',
    name: `PT ${layout.postSize} post (above anchor)`,
    quantity: layout.postCount,
    unit: 'pcs',
    allowStoreSizeOverride: true,
    count: layout.postCount,
    stockLengthFt: stock.postLengthFt,
    notes: pierNote,
  })

  addFoundationGirders(project, layout, lines)
  addFloorJoistAndRimLines(project, lines)

  lines.push({
    stockKey: 'floor.subfloor',
    category: 'Floor',
    name: SUBFLOOR_TG_NAME,
    quantity: Math.round(metrics.floorAreaSqFt),
    unit: 'sq ft',
    allowStoreSizeOverride: true,
    stockLengthFt: stock.sheathingSheetSqFt,
    stockIsSheetArea: true,
    notes: 'Enter sheet size below (e.g. 32 for 4×8)',
  })
}

function addFramedFloor(
  project: Project,
  metrics: ProjectMetrics,
  lines: TakeoffLine[],
  decking: { stockKey: string; name: string },
): void {
  const stock = project.storeStock

  addFloorJoistAndRimLines(project, lines)

  lines.push({
    stockKey: decking.stockKey,
    category: 'Floor',
    name: decking.name,
    quantity: Math.round(metrics.floorAreaSqFt),
    unit: 'sq ft',
    allowStoreSizeOverride: true,
    stockLengthFt: stock.sheathingSheetSqFt,
    stockIsSheetArea: true,
    notes: 'Enter sheet size below (e.g. 32 for 4×8)',
  })
}

export function computeTakeoff(project: Project): TakeoffLine[] {
  const metrics = computeMetrics(project)
  const { lengthFt, widthFt } = project.footprint
  const { studSize, studSpacingIn } = project.framing
  const stock = project.storeStock
  const plateBuyFt = ceilEvenStandardLengthFt(lengthFt)
  const lines: TakeoffLine[] = []

  const layout = computePierLayout(project)
  const pitchRad = Math.atan((project.roof.pitchRisePer12 ?? 4) / 12)
  const roofSlopeFactor =
    project.roof.type === 'flat' ? 1 : 1 / Math.cos(Math.min(Math.PI / 3, Math.max(0, pitchRad)))

  if (project.foundation.type === 'timber_pier' && layout) {
    addTimberPierFoundationAndFloor(project, layout, metrics, lines)
  }

  if (project.foundation.type === 'pier_beam' && layout) {
    lines.push({
      stockKey: 'foundation.post',
      category: 'Foundation',
      name: `${layout.postSize} post`,
      quantity: layout.postCount,
      unit: 'pcs',
      allowStoreSizeOverride: true,
      count: layout.postCount,
      stockLengthFt: stock.postLengthFt,
      notes: `1 piece per pier; spacing ${Math.round(layout.spacingLengthFt * 10) / 10}' × ${Math.round(layout.spacingWidthFt * 10) / 10}'`,
    })

    addFoundationGirders(project, layout, lines)
    addFramedFloor(project, metrics, lines, {
      stockKey: 'floor.decking',
      name: 'Floor decking (OSB/plywood)',
    })
  }

  if (project.foundation.type === 'slab') {
    lines.push({
      stockKey: 'foundation.slab',
      category: 'Foundation',
      name: 'Concrete slab',
      quantity: Math.round(metrics.floorAreaSqFt),
      unit: 'sq ft',
      notes: 'Monolithic slab; no posts',
    })
  }

  const hasFramedFloor =
    project.foundation.type === 'timber_pier' ||
    project.foundation.type === 'pier_beam'
  const joistCount = hasFramedFloor ? computeFloorJoistCount(project) : 0

  const studCount = computeStudCount(project)
  const studLf = studCount * project.wallHeightFt
  lines.push({
    stockKey: 'framing.studs',
    category: 'Framing',
    name: `${studSize} stud @ ${studSpacingIn}" OC`,
    quantity: studCount,
    unit: 'pcs',
    allowStoreSizeOverride: true,
    count: studCount,
    linearFeetNeeded: studLf,
    stockLengthFt: stock.studLengthFt,
    notes:
      stock.studLengthFt >= project.wallHeightFt
        ? `Wall height ${project.wallHeightFt}'; 1 piece per stud if stock length covers wall`
        : `Wall height ${project.wallHeightFt}'; shorter stock may require extra pieces`,
  })

  const plateLf = 3 * metrics.perimeterFt
  lines.push({
    stockKey: 'framing.plates',
    category: 'Framing',
    name: `${studSize} plate (1 bottom + 2 top)`,
    quantity: Math.round(plateLf),
    unit: 'lf',
    allowStoreSizeOverride: true,
    linearFeetNeeded: plateLf,
    stockLengthFt: plateBuyFt,
    notes: `Triple plate around perimeter (${Math.round(plateLf)} lf)`,
  })

  if (!usesStructuralWallPanels(project)) {
    lines.push({
      stockKey: 'walls.sheathing',
      category: 'Walls',
      name: 'Wall sheathing',
      quantity: Math.round(metrics.wallAreaSqFt),
      unit: 'sq ft',
      allowStoreSizeOverride: true,
      stockLengthFt: stock.sheathingSheetSqFt,
      stockIsSheetArea: true,
      notes: 'Estimate; no door/window deductions',
    })
  }

  // Openings + siding/interior deductions (rough)
  const doorAreaSqFt =
    project.openings.doorType === 'double_60x80'
      ? 60 / 12 * (80 / 12)
      : project.openings.doorType === 'prehung_36x80'
        ? 36 / 12 * (80 / 12)
        : 0
  const windowAreaSqFt =
    project.openings.windowType === 'vinyl_36x36'
      ? 36 / 12 * (36 / 12)
      : project.openings.windowType === 'vinyl_24x36'
        ? 24 / 12 * (36 / 12)
        : 0
  const openingsSqFt =
    (project.openings.doorCount ?? 0) * doorAreaSqFt +
    (project.openings.windowCount ?? 0) * windowAreaSqFt
  const wallNetSqFt = Math.max(0, metrics.wallAreaSqFt - openingsSqFt)
  const roofPitch =
    project.roof.type === 'flat' ? 0 : (project.roof.pitchRisePer12 ?? 4)
  const roofSheathingSqFt = estimateRoofSheathingAreaSqFt(
    metrics.floorAreaSqFt,
    project.roof.type,
    roofPitch,
  )
  const sheetSq = stock.sheathingSheetSqFt
  const floorSheetPieces =
    sheetSq > 0 ? Math.ceil(metrics.floorAreaSqFt / sheetSq) : 0
  const wallSheetPieces =
    sheetSq > 0 && !usesStructuralWallPanels(project)
      ? Math.ceil(metrics.wallAreaSqFt / sheetSq)
      : 0
  const roofSheetPieces =
    sheetSq > 0 ? Math.ceil(roofSheathingSqFt / sheetSq) : 0

  if (project.openings.doorType !== 'none' && project.openings.doorCount > 0) {
    lines.push({
      stockKey: 'openings.door',
      category: 'Openings',
      name:
        project.openings.doorType === 'double_60x80'
          ? 'Exterior double door 60"×80" (prehung or kit)'
          : 'Exterior door 36"×80" (prehung)',
      quantity: project.openings.doorCount,
      unit: 'pcs',
      count: project.openings.doorCount,
      notes: 'Hardware/trim not included in this line',
    })
    lines.push({
      stockKey: 'openings.door_hardware',
      category: 'Hardware',
      name: 'Door hardware (hinges + latch/lock)',
      quantity: project.openings.doorCount,
      unit: 'pcs',
      count: project.openings.doorCount,
      notes: '1 set per door (estimate)',
    })
  }

  if (project.openings.windowType !== 'none' && project.openings.windowCount > 0) {
    lines.push({
      stockKey: 'openings.window',
      category: 'Openings',
      name:
        project.openings.windowType === 'vinyl_36x36'
          ? 'Vinyl window 36"×36"'
          : 'Vinyl window 24"×36"',
      quantity: project.openings.windowCount,
      unit: 'pcs',
      count: project.openings.windowCount,
      notes: 'Flashing/tape not included in this line',
    })
  }

  if (project.siding.type !== 'none') {
    lines.push({
      stockKey: 'exterior.siding',
      category: 'Exterior',
      name:
        project.siding.type === 'lp_smartside_4x8'
          ? 'LP SmartSide panel siding (4×8)'
          : 'T1-11 panel siding (4×8)',
      quantity: Math.round(wallNetSqFt * 1.05),
      unit: 'sq ft',
      allowStoreSizeOverride: true,
      stockLengthFt: stock.sheathingSheetSqFt,
      stockIsSheetArea: true,
      notes: 'Approx. net wall area (minus openings) + 5% waste',
    })
  }

  if (
    !usesStructuralWallPanels(project) &&
    project.siding.includeHousewrap
  ) {
    lines.push({
      stockKey: 'exterior.housewrap',
      category: 'Exterior',
      name: 'Housewrap',
      quantity: Math.round(wallNetSqFt * 1.1),
      unit: 'sq ft',
      notes: 'Approx. net wall area + overlap waste (estimate)',
    })
  }

  if (project.interior.finish !== 'none') {
    lines.push({
      stockKey: 'interior.wall_finish',
      category: 'Interior',
      name:
        project.interior.finish === 'drywall_1_2_4x8'
          ? 'Drywall 1/2" (4×8)'
          : 'OSB 7/16" (4×8)',
      quantity: Math.round(wallNetSqFt * 1.07),
      unit: 'sq ft',
      allowStoreSizeOverride: true,
      stockLengthFt: stock.sheathingSheetSqFt,
      stockIsSheetArea: true,
      notes: 'Approx. interior walls (minus openings) + 7% waste',
    })
  }

  if (project.interior.insulated) {
    lines.push({
      stockKey: 'interior.insulation',
      category: 'Interior',
      name: 'Wall insulation (batts)',
      quantity: Math.round(wallNetSqFt),
      unit: 'sq ft',
      notes: 'Approx. net wall area (estimate)',
    })
  }

  addRoofFraming(project, lines)

  lines.push({
    stockKey: 'roofing.sheathing',
    category: 'Roofing',
    name: 'Roof sheathing (OSB/plywood)',
    quantity: Math.round(roofSheathingSqFt),
    unit: 'sq ft',
    allowStoreSizeOverride: true,
    stockLengthFt: stock.sheathingSheetSqFt,
    stockIsSheetArea: true,
    notes: 'Roof deck on rafters; buy count rounds up to full sheets',
  })

  addRoofUnderlaymentAndDrip(project, lines, metrics)

  if (project.roofing.type === 'metal') {
    const roofAreaWithWaste = Math.round(metrics.roofAreaSqFt * 1.1)
    const panelCoverageFt = (project.roofing.panelCoverageWidthIn || 36) / 12
    const roofRunFt = project.roof.type === 'gable' || project.roof.type === 'hip' ? widthFt / 2 : widthFt
    const roofSlopeLenFt = roofRunFt * roofSlopeFactor
    const panelCount = panelCoverageFt > 0 ? Math.ceil(lengthFt / panelCoverageFt) : 0
    const totalPanels = project.roof.type === 'gable' || project.roof.type === 'hip' ? panelCount * 2 : panelCount

    lines.push({
      stockKey: 'roofing.metal_panels',
      category: 'Roofing',
      name: `Metal roofing panels (~${Math.round(panelCoverageFt * 12)}\" coverage)`,
      quantity: totalPanels,
      unit: 'pcs',
      count: totalPanels,
      notes: `Panel length ~${Math.round(roofSlopeLenFt * 10) / 10}' (slope)`,
    })

    const screwCount = Math.max(0, Math.round(metrics.roofAreaSqFt * (project.roofing.screwPerSqFt ?? 0.9)))
    lines.push({
      stockKey: 'roofing.screws',
      category: 'Roofing',
      name: 'Metal roofing screws (with washers)',
      quantity: screwCount,
      unit: 'pcs',
      count: screwCount,
      notes: 'Estimate: screws per sq ft',
    })

    if (project.roofing.includeRidgeCap && (project.roof.type === 'gable' || project.roof.type === 'hip')) {
      const ridgeLf = Math.round(lengthFt * 1.05)
      lines.push({
        stockKey: 'roofing.ridge_cap',
        category: 'Roofing',
        name: 'Ridge cap',
        quantity: ridgeLf,
        unit: 'lf',
        linearFeetNeeded: ridgeLf,
        notes: 'Ridge length + waste (estimate)',
      })
      lines.push({
        stockKey: 'roofing.closure_strips',
        category: 'Roofing',
        name: 'Closure strips (ridge/eave)',
        quantity: ridgeLf * 2,
        unit: 'lf',
        linearFeetNeeded: ridgeLf * 2,
        notes: 'Ridge closures both sides (estimate)',
      })
    } else {
      const eaveLf = Math.round(lengthFt * 2)
      lines.push({
        stockKey: 'roofing.closure_strips',
        category: 'Roofing',
        name: 'Closure strips (eave)',
        quantity: eaveLf,
        unit: 'lf',
        linearFeetNeeded: eaveLf,
        notes: 'Eave closures (estimate)',
      })
    }
  }

  if (project.roofing.type === 'shingles') {
    const shingleSqFt = Math.round(roofSheathingSqFt)
    lines.push({
      stockKey: 'roofing.shingles',
      category: 'Roofing',
      name: 'Asphalt shingles',
      quantity: shingleSqFt,
      unit: 'sq ft',
      notes: 'Roof area + waste (estimate); 3-tab or architectural',
    })

    const nailBoxes = Math.max(1, Math.ceil(shingleSqFt / 200))
    lines.push({
      stockKey: 'roofing.shingle_nails',
      category: 'Roofing',
      name: 'Roofing nails — 5 lb box',
      quantity: nailBoxes,
      unit: 'pcs',
      count: nailBoxes,
      notes: 'Rough: ~1 box per 200 sq ft of shingles',
    })

    if (
      project.roofing.includeRidgeCap &&
      (project.roof.type === 'gable' || project.roof.type === 'hip')
    ) {
      const ridgeLf = Math.round(lengthFt * 1.05)
      lines.push({
        stockKey: 'roofing.ridge_cap',
        category: 'Roofing',
        name: 'Ridge cap shingles',
        quantity: ridgeLf,
        unit: 'lf',
        linearFeetNeeded: ridgeLf,
        notes: 'Ridge length + waste (estimate)',
      })
    }
  }

  // Weatherproofing + trim + anchors/adhesives + site/finish (gated by scope)
  const scope = project.buildScope
  const includeFinish = scope === 'full_finish' || scope === 'include_electrical'
  const includeWeather = scope === 'structure_weatherproof' || includeFinish

  if (includeWeather) {
    const flashingRolls =
      Math.ceil(((project.openings.windowCount ?? 0) + (project.openings.doorCount ?? 0)) / 2) || 0
    if (flashingRolls > 0) {
      lines.push({
        stockKey: 'weather.flashing_tape',
        category: 'Weatherproofing',
        name: 'Flashing tape (roll)',
        quantity: flashingRolls,
        unit: 'pcs',
        count: flashingRolls,
        notes: 'Rough: 1 roll per ~2 openings',
      })
    }

    const housewrapTapeRolls =
      !usesStructuralWallPanels(project) && project.siding.includeHousewrap
        ? Math.max(1, Math.ceil(wallNetSqFt / 500))
        : 0
    if (housewrapTapeRolls > 0) {
      lines.push({
        stockKey: 'weather.housewrap_tape',
        category: 'Weatherproofing',
        name: 'Housewrap tape (roll)',
        quantity: housewrapTapeRolls,
        unit: 'pcs',
        count: housewrapTapeRolls,
        notes: 'Rough: 1 roll per ~500 sq ft walls',
      })
    }

    const openingCount = (project.openings.windowCount ?? 0) + (project.openings.doorCount ?? 0)
    const caulkTubes = Math.max(2, Math.ceil(openingCount * 1.5))
    lines.push({
      stockKey: 'weather.caulk',
      category: 'Weatherproofing',
      name: 'Exterior caulk (tube)',
      quantity: caulkTubes,
      unit: 'pcs',
      count: caulkTubes,
      notes: 'Rough: openings + trim seams',
    })

    if (openingCount > 0) {
      const foamCans = Math.max(1, Math.ceil(openingCount / 2))
      lines.push({
        stockKey: 'weather.spray_foam',
        category: 'Weatherproofing',
        name: 'Window/door spray foam (can)',
        quantity: foamCans,
        unit: 'pcs',
        count: foamCans,
        notes: 'Rough: 1 can per ~2 openings',
      })
    }

    const adhesiveTubes = Math.max(
      1,
      Math.ceil((floorSheetPieces + wallSheetPieces) / 4),
    )
    lines.push({
      stockKey: 'hardware.construction_adhesive',
      category: 'Hardware',
      name: 'Construction adhesive (tube)',
      quantity: adhesiveTubes,
      unit: 'pcs',
      count: adhesiveTubes,
      notes: 'Rough: subfloor/sheathing adhesive',
    })

    // Anchors depend on foundation type
    if (project.foundation.type === 'slab') {
      const anchorCount = Math.max(8, Math.ceil(metrics.perimeterFt / 4))
      lines.push({
        stockKey: 'hardware.anchor_bolts',
        category: 'Hardware',
        name: 'Anchor bolts / concrete anchors',
        quantity: anchorCount,
        unit: 'pcs',
        count: anchorCount,
        notes: 'Rough: 1 per ~4 ft perimeter',
      })
    } else {
      const strapCount = Math.max(4, Math.ceil(metrics.perimeterFt / 8))
      lines.push({
        stockKey: 'hardware.anchor_straps',
        category: 'Hardware',
        name: 'Anchor straps / tie-downs',
        quantity: strapCount,
        unit: 'pcs',
        count: strapCount,
        notes: 'Rough tie-downs for skids/piers',
      })
    }

    // Basic ventilation
    if (project.roof.type === 'gable' || project.roof.type === 'hip') {
      lines.push({
        stockKey: 'vent.gable_vent',
        category: 'Ventilation',
        name: 'Gable vents',
        quantity: 2,
        unit: 'pcs',
        count: 2,
        notes: 'Typical: 2 vents (estimate)',
      })
    }
  }

  if (includeFinish) {
    if (project.trim.includeCornerTrim) {
      const cornerLf = Math.round(project.wallHeightFt * 4 * 1.05)
      lines.push({
        stockKey: 'trim.corner_boards',
        category: 'Trim',
        name: 'Corner trim boards',
        quantity: cornerLf,
        unit: 'lf',
        allowStoreSizeOverride: true,
        stockLengthFt: 8,
        linearFeetNeeded: cornerLf,
        notes: '4 corners × wall height + waste',
      })
    }

    if (project.trim.includeFasciaRake) {
      const fasciaLf = Math.round(lengthFt * 2 * 1.05)
      const rakeLf = Math.round((project.roof.type === 'gable' || project.roof.type === 'hip' ? lengthFt * 2 : lengthFt) * 1.05)
      lines.push({
        stockKey: 'trim.fascia',
        category: 'Trim',
        name: 'Fascia boards',
        quantity: fasciaLf,
        unit: 'lf',
        allowStoreSizeOverride: true,
        stockLengthFt: 8,
        linearFeetNeeded: fasciaLf,
        notes: 'Eaves length + waste',
      })
      lines.push({
        stockKey: 'trim.rake',
        category: 'Trim',
        name: 'Rake trim boards',
        quantity: rakeLf,
        unit: 'lf',
        allowStoreSizeOverride: true,
        stockLengthFt: 8,
        linearFeetNeeded: rakeLf,
        notes: 'Rake edges + waste (estimate)',
      })
    }

    // Paint/stain (very rough)
    if (project.siding.type !== 'none') {
      const gallons = Math.max(1, Math.ceil(wallNetSqFt / 350))
      lines.push({
        stockKey: 'finish.paint',
        category: 'Finish',
        name: 'Exterior paint/stain (gal)',
        quantity: gallons,
        unit: 'pcs',
        count: gallons,
        notes: 'Rough coverage ~350 sq ft/gal',
      })
    }

    // Site prep (non-slab): gravel pad estimate
    if (project.foundation.type !== 'slab') {
      const gravelCuFt = Math.round(metrics.floorAreaSqFt * (4 / 12)) // 4\" base
      lines.push({
        stockKey: 'site.gravel',
        category: 'Site',
        name: 'Gravel base (cu ft)',
        quantity: gravelCuFt,
        unit: 'cu ft',
        notes: 'Rough 4\" gravel base under footprint',
      })
    }
  }

  // Electrical rough-in (only when scope includes electrical)
  if (scope === 'include_electrical') {
    const outlets = Math.max(0, project.electrical.outletCount ?? 0)
    const lights = Math.max(0, project.electrical.lightCount ?? 0)
    const boxes = outlets + lights + (outlets > 0 || lights > 0 ? 1 : 0) // +1 for switch
    const wireFt = Math.max(25, Math.ceil(metrics.perimeterFt * 1.25))

    lines.push({
      stockKey: 'electrical.romex',
      category: 'Electrical',
      name: 'NM-B cable (Romex) (ft)',
      quantity: wireFt,
      unit: 'lf',
      linearFeetNeeded: wireFt,
      notes: 'Rough run length + slack',
    })

    if (outlets > 0) {
      lines.push({
        stockKey: 'electrical.outlet',
        category: 'Electrical',
        name: 'Duplex outlet',
        quantity: outlets,
        unit: 'pcs',
        count: outlets,
        notes: 'Count from options',
      })
    }

    lines.push({
      stockKey: 'electrical.switch',
      category: 'Electrical',
      name: 'Light switch',
      quantity: lights > 0 ? 1 : 0,
      unit: 'pcs',
      count: lights > 0 ? 1 : 0,
      notes: 'Assumes 1 switch controls lights',
    })

    if (lights > 0) {
      lines.push({
        stockKey: 'electrical.light',
        category: 'Electrical',
        name: 'Ceiling light fixture',
        quantity: lights,
        unit: 'pcs',
        count: lights,
        notes: 'Count from options',
      })
    }

    if (boxes > 0) {
      lines.push({
        stockKey: 'electrical.box',
        category: 'Electrical',
        name: 'Electrical boxes',
        quantity: boxes,
        unit: 'pcs',
        count: boxes,
        notes: 'Rough: outlets + lights + switch',
      })
    }

    if (project.electrical.includeBreaker) {
      lines.push({
        stockKey: 'electrical.breaker',
        category: 'Electrical',
        name: 'Breaker (15A/20A)',
        quantity: 1,
        unit: 'pcs',
        count: 1,
        notes: 'Assumes 1 circuit (estimate)',
      })
    }
  }

  // Basic fasteners & connectors (very rough, but improves realism)
  const rafterCountForNails = roofUsesRafterFraming(project)
    ? computeRafterCount(
        lengthFt,
        widthFt,
        project.roof.type,
        project.framing.studSpacingIn,
      )
    : 0
  const framingNailsLb = Math.max(
    1,
    Math.ceil((studCount + joistCount * 2 + rafterCountForNails) / 25),
  )
  const totalSheathingSheets =
    floorSheetPieces + wallSheetPieces + roofSheetPieces
  const sheathingNailsLb = Math.max(
    1,
    Math.ceil(totalSheathingSheets / 15),
  )
  const connectorCount = Math.max(4, Math.ceil(metrics.perimeterFt / 2))

  lines.push({
    stockKey: 'hardware.framing_nails',
    category: 'Hardware',
    name: 'Framing nails (16d/10d mix) — 5 lb box',
    quantity: framingNailsLb,
    unit: 'pcs',
    count: framingNailsLb,
    notes: 'Rough estimate based on studs + joists',
  })

  lines.push({
    stockKey: 'hardware.sheathing_nails',
    category: 'Hardware',
    name: 'Sheathing nails — 5 lb box',
    quantity: sheathingNailsLb,
    unit: 'pcs',
    count: sheathingNailsLb,
    notes: 'Rough estimate based on sheet count',
  })

  lines.push({
    stockKey: 'hardware.connectors',
    category: 'Hardware',
    name: 'Connectors / ties / brackets (assorted)',
    quantity: connectorCount,
    unit: 'pcs',
    count: connectorCount,
    notes: 'Hurricane ties, angles, straps (rough)',
  })

  return lines
}
