import type { Project, SidingType, WallSystem } from '../../../types/project'
import { SIDING_OPTIONS } from '../projectFormOptions'

interface ExteriorSectionProps {
  project: Project
  onChange: (project: Project) => void
}

export function ExteriorSection({ project, onChange }: ExteriorSectionProps) {
  function update(partial: Partial<Project>) {
    onChange({ ...project, ...partial })
  }

  return (
    <section className="panel details-section">
      <h2>Exterior walls</h2>

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
    </section>
  )
}
