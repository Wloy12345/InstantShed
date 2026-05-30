import type { Project } from '../../../types/project'

interface ElectricalSectionProps {
  project: Project
  onChange: (project: Project) => void
}

export function ElectricalSection({ project, onChange }: ElectricalSectionProps) {
  function update(partial: Partial<Project>) {
    onChange({ ...project, ...partial })
  }

  if (project.buildScope !== 'include_electrical') return null

  return (
    <section className="panel details-section">
      <h2>Electrical</h2>

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
    </section>
  )
}
