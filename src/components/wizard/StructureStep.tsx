import {
  footprintOptionsFt,
  WALL_HEIGHT_OPTIONS_FT,
} from '../../lib/dimensionConstraints'
import { computeMetrics, formatFeet, formatSqFt } from '../../lib/calculations'
import type { Project, RoofType } from '../../types/project'
import { FloorplanView } from '../FloorplanView'
import { ROOF_OPTIONS } from './projectFormOptions'

interface StructureStepProps {
  project: Project
  onChange: (project: Project) => void
}

export function StructureStep({ project, onChange }: StructureStepProps) {
  const metrics = computeMetrics(project)
  const showPitch = project.roof.type !== 'flat'

  function update(partial: Partial<Project>) {
    onChange({ ...project, ...partial })
  }

  return (
    <div className="wizard-step structure-step">
      <section className="panel">
        <h2>Structure</h2>
        <p className="hint-block">
          Set the basic size and roof shape. Drag the floorplan below to resize (snaps to 2 ft).
          Length controls rafter spacing; depth is the front-to-back span.
        </p>

        <label className="field">
          <span>Project name</span>
          <input
            type="text"
            value={project.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </label>

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
              {h} ft
              {h === 8
                ? ' (standard — 92-5/8" pre-cut studs)'
                : h === 7
                  ? ' (low profile)'
                  : ' (high / loft)'}
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
      </section>

      <FloorplanView project={project} onChange={onChange} />
    </div>
  )
}
