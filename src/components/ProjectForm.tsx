import {
  footprintOptionsFt,
  WALL_HEIGHT_OPTIONS_FT,
} from '../lib/dimensionConstraints'
import type {
  BuildScope,
  InteriorFinish,
  Project,
  RoofingType,
  RoofType,
  SidingType,
  WallSystem,
} from '../types/project'
import { computeMetrics, formatFeet, formatSqFt } from '../lib/calculations'

const ROOF_OPTIONS: { value: RoofType; label: string }[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'shed', label: 'Shed (single slope)' },
  { value: 'gable', label: 'Gable' },
  { value: 'hip', label: 'Hip' },
]

const SIDING_OPTIONS: { value: SidingType; label: string }[] = [
  { value: 'none', label: 'None (framing only)' },
  { value: 't111_4x8', label: 'T1-11 panels (4×8)' },
  { value: 'lp_smartside_4x8', label: 'LP SmartSide panels (4×8)' },
]

const INTERIOR_OPTIONS: { value: InteriorFinish; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'osb_7_16_4x8', label: 'OSB 7/16\" (4×8)' },
  { value: 'drywall_1_2_4x8', label: 'Drywall 1/2\" (4×8)' },
]

const SCOPE_OPTIONS: { value: BuildScope; label: string }[] = [
  { value: 'structure_weatherproof', label: 'Structure + weatherproofing' },
  { value: 'full_finish', label: 'Full finish + site prep' },
  { value: 'include_electrical', label: 'Full finish + electrical rough-in' },
]

interface ProjectFormProps {
  project: Project
  onChange: (project: Project) => void
}

export function ProjectForm({ project, onChange }: ProjectFormProps) {
  const metrics = computeMetrics(project)
  const showPitch = project.roof.type !== 'flat'

  function update(partial: Partial<Project>) {
    onChange({ ...project, ...partial })
  }

  return (
    <section className="panel project-form">
      <h2>Project</h2>

      <label className="field">
        <span>Name</span>
        <input
          type="text"
          value={project.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </label>

      <p className="hint-block">
        Or drag the floorplan / 3D handle to adjust size (snaps to 2 ft). Length controls
        rafter spacing; Depth is the front-to-back span.
      </p>

      <div className="field-row">
        <label className="field">
          <span>Length (ft)</span>
          <select
            value={project.footprint.lengthFt}
            onChange={(e) =>
              update({
                footprint: {
                  ...project.footprint,
                  lengthFt: Number(e.target.value),
                },
              })
            }
          >
            {footprintOptionsFt().map((ft) => (
              <option key={ft} value={ft}>
                {ft}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Depth (ft)</span>
          <select
            value={project.footprint.widthFt}
            onChange={(e) =>
              update({
                footprint: {
                  ...project.footprint,
                  widthFt: Number(e.target.value),
                },
              })
            }
          >
            {footprintOptionsFt().map((ft) => (
              <option key={ft} value={ft}>
                {ft}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="inline-stats">
        <span>Floor: {formatSqFt(metrics.floorAreaSqFt)}</span>
        <span>Perimeter: {formatFeet(metrics.perimeterFt)}</span>
      </div>

      <fieldset className="field wall-height-fieldset">
        <legend>Wall height</legend>
        {WALL_HEIGHT_OPTIONS_FT.map((h) => (
          <label key={h} className="field-inline">
            <input
              type="radio"
              name="wallHeight"
              checked={project.wallHeightFt === h}
              onChange={() => update({ wallHeightFt: h })}
            />{' '}
            {h} ft{h === 8 ? ' (standard — 92-5/8" pre-cut studs)' : h === 7 ? ' (low profile)' : ' (high / loft)'}
          </label>
        ))}
      </fieldset>

      <label className="field">
        <span>Roof type</span>
        <select
          value={project.roof.type}
          onChange={(e) =>
            update({
              roof: {
                ...project.roof,
                type: e.target.value as RoofType,
              },
            })
          }
        >
          {ROOF_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {showPitch && (
        <label className="field">
          <span>Pitch (rise per 12&quot; run)</span>
          <input
            type="number"
            min={0}
            step={0.5}
            value={project.roof.pitchRisePer12 ?? 4}
            onChange={(e) =>
              update({
                roof: {
                  ...project.roof,
                  pitchRisePer12: Number(e.target.value) || 0,
                },
              })
            }
          />
        </label>
      )}

      <div className="inline-stats estimate">
        <span>Est. wall area: {formatSqFt(metrics.wallAreaSqFt)}</span>
        <span>Est. roof area: {formatSqFt(metrics.roofAreaSqFt)}</span>
      </div>

      <hr />

      <h3>Build scope</h3>

      <label className="field">
        <span>Scope</span>
        <select
          value={project.buildScope}
          onChange={(e) => update({ buildScope: e.target.value as BuildScope })}
        >
          {SCOPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <h3>Roofing</h3>

      <label className="field">
        <span>Roof covering</span>
        <select
          value={project.roofing.type}
          onChange={(e) =>
            update({
              roofing: { ...project.roofing, type: e.target.value as RoofingType },
            })
          }
        >
          <option value="metal">Metal panels</option>
          <option value="shingles">Asphalt shingles</option>
        </select>
      </label>
      <p className="hint-block">
        Rafters, hurricane ties, and roof sheathing are always included for sloped roofs.
      </p>

      <label className="field">
        <span>
          <input
            type="checkbox"
            checked={project.roofing.includeUnderlayment}
            onChange={(e) =>
              update({
                roofing: { ...project.roofing, includeUnderlayment: e.target.checked },
              })
            }
          />{' '}
          Include underlayment
        </span>
      </label>

      <label className="field">
        <span>
          <input
            type="checkbox"
            checked={project.roofing.includeDripEdge}
            onChange={(e) =>
              update({
                roofing: { ...project.roofing, includeDripEdge: e.target.checked },
              })
            }
          />{' '}
          Include drip edge
        </span>
      </label>

      <label className="field">
        <span>
          <input
            type="checkbox"
            checked={project.roofing.includeRidgeCap}
            onChange={(e) =>
              update({
                roofing: { ...project.roofing, includeRidgeCap: e.target.checked },
              })
            }
          />{' '}
          Include ridge cap (gable/hip)
        </span>
      </label>

      {project.roofing.type === 'metal' && (
        <div className="field-row">
          <label className="field">
            <span>Panel coverage width (in)</span>
            <input
              type="number"
              min={12}
              step={1}
              value={project.roofing.panelCoverageWidthIn}
              onChange={(e) =>
                update({
                  roofing: {
                    ...project.roofing,
                    panelCoverageWidthIn: Number(e.target.value) || 36,
                  },
                })
              }
            />
          </label>
          <label className="field">
            <span>Screws per sq ft</span>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={project.roofing.screwPerSqFt}
              onChange={(e) =>
                update({
                  roofing: {
                    ...project.roofing,
                    screwPerSqFt: Number(e.target.value) || 0.9,
                  },
                })
              }
            />
          </label>
        </div>
      )}

      <h3>Openings</h3>

      <div className="field-row">
        <label className="field">
          <span>Doors</span>
          <input
            type="number"
            min={0}
            step={1}
            value={project.openings.doorCount}
            onChange={(e) =>
              update({
                openings: {
                  ...project.openings,
                  doorCount: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                },
              })
            }
          />
        </label>
        <label className="field">
          <span>Door type</span>
          <select
            value={project.openings.doorType}
            onChange={(e) =>
              update({
                openings: {
                  ...project.openings,
                  doorType: e.target.value as Project['openings']['doorType'],
                },
              })
            }
          >
            <option value="none">None</option>
            <option value="prehung_36x80">Prehung 36&quot;×80&quot;</option>
            <option value="double_60x80">Double 60&quot;×80&quot;</option>
          </select>
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Windows</span>
          <input
            type="number"
            min={0}
            step={1}
            value={project.openings.windowCount}
            onChange={(e) =>
              update({
                openings: {
                  ...project.openings,
                  windowCount: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                },
              })
            }
          />
        </label>
        <label className="field">
          <span>Window type</span>
          <select
            value={project.openings.windowType}
            onChange={(e) =>
              update({
                openings: {
                  ...project.openings,
                  windowType: e.target.value as Project['openings']['windowType'],
                },
              })
            }
          >
            <option value="none">None</option>
            <option value="vinyl_24x36">Vinyl 24&quot;×36&quot;</option>
            <option value="vinyl_36x36">Vinyl 36&quot;×36&quot;</option>
          </select>
        </label>
      </div>

      <h3>Exterior</h3>

      <label className="field">
        <span>Wall system</span>
        <select
          value={project.siding.wallSystem}
          onChange={(e) => {
            const wallSystem = e.target.value as WallSystem
            update({
              siding: {
                ...project.siding,
                wallSystem,
                includeHousewrap:
                  wallSystem === 'sheathing_and_wrap'
                    ? project.siding.includeHousewrap
                    : false,
              },
            })
          }}
        >
          <option value="structural_panel">
            Structural panels (T1-11 / SmartSide to studs)
          </option>
          <option value="sheathing_and_wrap">
            OSB sheathing + housewrap + finish
          </option>
        </select>
      </label>

      <label className="field">
        <span>Siding / finish panels</span>
        <select
          value={project.siding.type}
          onChange={(e) =>
            update({
              siding: { ...project.siding, type: e.target.value as SidingType },
            })
          }
        >
          {SIDING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>
          <input
            type="checkbox"
            checked={project.siding.includeHousewrap}
            disabled={project.siding.wallSystem === 'structural_panel'}
            onChange={(e) =>
              update({
                siding: { ...project.siding, includeHousewrap: e.target.checked },
              })
            }
          />{' '}
          Include housewrap
        </span>
      </label>
      {project.siding.wallSystem === 'structural_panel' && (
        <p className="hint-block">
          Structural panels nail to studs; OSB wall sheathing and housewrap are omitted.
        </p>
      )}

      <h3>Interior</h3>

      <label className="field">
        <span>Wall finish</span>
        <select
          value={project.interior.finish}
          onChange={(e) =>
            update({
              interior: { ...project.interior, finish: e.target.value as InteriorFinish },
            })
          }
        >
          {INTERIOR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>
          <input
            type="checkbox"
            checked={project.interior.insulated}
            onChange={(e) =>
              update({
                interior: { ...project.interior, insulated: e.target.checked },
              })
            }
          />{' '}
          Include insulation (walls)
        </span>
      </label>

      <h3>Trim</h3>

      <label className="field">
        <span>
          <input
            type="checkbox"
            checked={project.trim.includeCornerTrim}
            onChange={(e) =>
              update({ trim: { ...project.trim, includeCornerTrim: e.target.checked } })
            }
          />{' '}
          Include corner trim
        </span>
      </label>

      <label className="field">
        <span>
          <input
            type="checkbox"
            checked={project.trim.includeFasciaRake}
            onChange={(e) =>
              update({ trim: { ...project.trim, includeFasciaRake: e.target.checked } })
            }
          />{' '}
          Include fascia + rake trim
        </span>
      </label>

      {project.buildScope === 'include_electrical' && (
        <>
          <h3>Electrical</h3>

          <div className="field-row">
            <label className="field">
              <span>Outlets</span>
              <input
                type="number"
                min={0}
                step={1}
                value={project.electrical.outletCount}
                onChange={(e) =>
                  update({
                    electrical: {
                      ...project.electrical,
                      outletCount: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                    },
                  })
                }
              />
            </label>
            <label className="field">
              <span>Lights</span>
              <input
                type="number"
                min={0}
                step={1}
                value={project.electrical.lightCount}
                onChange={(e) =>
                  update({
                    electrical: {
                      ...project.electrical,
                      lightCount: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                    },
                  })
                }
              />
            </label>
          </div>

          <label className="field">
            <span>
              <input
                type="checkbox"
                checked={project.electrical.includeBreaker}
                onChange={(e) =>
                  update({
                    electrical: { ...project.electrical, includeBreaker: e.target.checked },
                  })
                }
              />{' '}
              Include breaker (estimate)
            </span>
          </label>
        </>
      )}
    </section>
  )
}
