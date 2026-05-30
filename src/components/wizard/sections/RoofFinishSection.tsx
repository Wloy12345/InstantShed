import type { BuildScope, Project, RoofingType } from '../../../types/project'
import { SCOPE_OPTIONS } from '../projectFormOptions'

interface RoofFinishSectionProps {
  project: Project
  onChange: (project: Project) => void
}

export function RoofFinishSection({ project, onChange }: RoofFinishSectionProps) {
  function update(partial: Partial<Project>) {
    onChange({ ...project, ...partial })
  }

  return (
    <section className="panel details-section">
      <h2>Build scope &amp; roof finish</h2>

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
    </section>
  )
}
