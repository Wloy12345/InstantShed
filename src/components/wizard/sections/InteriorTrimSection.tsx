import type { InteriorFinish, Project } from '../../../types/project'
import { INTERIOR_OPTIONS } from '../projectFormOptions'

interface InteriorTrimSectionProps {
  project: Project
  onChange: (project: Project) => void
}

export function InteriorTrimSection({ project, onChange }: InteriorTrimSectionProps) {
  function update(partial: Partial<Project>) {
    onChange({ ...project, ...partial })
  }

  return (
    <section className="panel details-section">
      <h2>Interior &amp; trim</h2>

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
    </section>
  )
}
