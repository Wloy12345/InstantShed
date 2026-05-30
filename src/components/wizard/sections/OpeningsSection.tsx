import type { Project } from '../../../types/project'

interface OpeningsSectionProps {
  project: Project
  onChange: (project: Project) => void
}

export function OpeningsSection({ project, onChange }: OpeningsSectionProps) {
  function update(partial: Partial<Project>) {
    onChange({ ...project, ...partial })
  }

  return (
    <section className="panel details-section">
      <h2>Openings</h2>

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
    </section>
  )
}
