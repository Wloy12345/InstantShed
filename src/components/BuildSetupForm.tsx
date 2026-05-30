import { computePierLayout, defaultMaxSpanFt } from '../lib/foundationLayout'
import type { FoundationType, PostSize, Project, StudSize, StudSpacingIn } from '../types/project'

interface BuildSetupFormProps {
  project: Project
  onChange: (project: Project) => void
}

export function BuildSetupForm({ project, onChange }: BuildSetupFormProps) {
  const foundationType = project.foundation.type
  const hasPierLayout =
    foundationType === 'pier_beam' || foundationType === 'timber_pier'
  const layout = computePierLayout(project)
  const postSize = project.foundation.postSize ?? '6x6'
  const maxSpan = project.foundation.maxSpanFt ?? defaultMaxSpanFt(postSize)

  function updateFoundation(partial: Partial<Project['foundation']>) {
    onChange({ ...project, foundation: { ...project.foundation, ...partial } })
  }

  function updateFraming(partial: Partial<Project['framing']>) {
    onChange({ ...project, framing: { ...project.framing, ...partial } })
  }

  function updateStoreStock(partial: Partial<Project['storeStock']>) {
    onChange({
      ...project,
      storeStock: { ...project.storeStock, ...partial },
      shoppingStockLengths: {},
    })
  }

  function pierFoundationConfig(type: 'pier_beam' | 'timber_pier'): Project['foundation'] {
    return {
      type,
      postSize,
      maxSpanFt: defaultMaxSpanFt(postSize),
      perimeterBeam: type === 'pier_beam',
    }
  }

  function handleFoundationType(type: FoundationType) {
    if (type === 'slab') {
      onChange({
        ...project,
        foundation: { type: 'slab', perimeterBeam: false },
        shoppingStockLengths: {},
      })
    } else {
      onChange({
        ...project,
        foundation: pierFoundationConfig(type),
        shoppingStockLengths: {},
      })
    }
  }

  function handlePostSize(size: PostSize) {
    updateFoundation({
      postSize: size,
      maxSpanFt: defaultMaxSpanFt(size),
    })
  }

  return (
    <section className="panel build-setup-form">
      <h2>Build setup</h2>

      <label className="field">
        <span>Foundation</span>
        <select
          value={foundationType}
          onChange={(e) => handleFoundationType(e.target.value as FoundationType)}
        >
          <option value="pier_beam">Pier &amp; beam</option>
          <option value="timber_pier">Timber pier</option>
          <option value="slab">Concrete slab</option>
        </select>
      </label>

      {hasPierLayout && (
        <>
          <label className="field">
            <span>Pier size</span>
            <select
              value={postSize}
              onChange={(e) => handlePostSize(e.target.value as PostSize)}
            >
              <option value="4x4">4×4</option>
              <option value="6x6">6×6</option>
            </select>
          </label>

          <p className="hint-block">
            {foundationType === 'timber_pier'
              ? 'Concrete piers, post anchors, PT rim and floor joists, T&G subfloor (no beam grid).'
              : 'Posts with perimeter and interior beams.'}{' '}
            Max spacing up to {maxSpan} ft
            {layout && (
              <>
                {' '}
                (actual: {Math.round(layout.spacingLengthFt * 10) / 10} ft ×{' '}
                {Math.round(layout.spacingWidthFt * 10) / 10} ft; {layout.postCount} piers)
              </>
            )}
          </p>
        </>
      )}

      <h3 className="subsection-title">Framing</h3>

      <label className="field">
        <span>Stud size</span>
        <select
          value={project.framing.studSize}
          onChange={(e) =>
            updateFraming({ studSize: e.target.value as StudSize })
          }
        >
          <option value="2x4">2×4</option>
          <option value="2x6">2×6</option>
        </select>
      </label>

      <label className="field">
        <span>Stud spacing</span>
        <select
          value={project.framing.studSpacingIn}
          onChange={(e) =>
            updateFraming({ studSpacingIn: Number(e.target.value) as StudSpacingIn })
          }
        >
          <option value={16}>16&quot; on center</option>
          <option value={24}>24&quot; on center</option>
        </select>
      </label>

      <h3 className="subsection-title">Default store sizes</h3>
      <p className="hint-block">
        Starting values for the shopping list. You can change each line on the list itself.
      </p>

      <div className="field-row">
        <StockLengthInput
          label="Post / pier"
          value={project.storeStock.postLengthFt}
          onChange={(v) => updateStoreStock({ postLengthFt: v })}
          disabled={!hasPierLayout}
        />
        <StockLengthInput
          label="Beam / joist"
          value={project.storeStock.beamLengthFt}
          onChange={(v) => updateStoreStock({ beamLengthFt: v })}
        />
      </div>
      <div className="field-row">
        <StockLengthInput
          label="Stud"
          value={project.storeStock.studLengthFt}
          onChange={(v) => updateStoreStock({ studLengthFt: v })}
        />
        <StockLengthInput
          label="Plate"
          value={project.storeStock.plateLengthFt}
          onChange={(v) => updateStoreStock({ plateLengthFt: v })}
        />
      </div>
      <StockLengthInput
        label="Sheathing sheet"
        value={project.storeStock.sheathingSheetSqFt}
        onChange={(v) => updateStoreStock({ sheathingSheetSqFt: v })}
        unit="sq ft / sheet"
        step={1}
        presets={[32, 40, 48]}
        presetLabels={['4×8 (32)', '4×10 (40)', '4×12 (48)']}
      />
    </section>
  )
}

function StockLengthInput({
  label,
  value,
  onChange,
  disabled,
  unit = 'ft',
  step = 0.5,
  presets = [8, 10, 12, 16],
  presetLabels,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled?: boolean
  unit?: string
  step?: number
  presets?: number[]
  presetLabels?: string[]
}) {
  return (
    <div className="field stock-length-field">
      <label className="field">
        <span>
          {label} ({unit})
        </span>
        <input
          type="number"
          min={0.1}
          step={step}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
        />
      </label>
      <div className="preset-chips">
        {presets.map((len, i) => (
          <button
            key={len}
            type="button"
            className="chip"
            disabled={disabled}
            onClick={() => onChange(len)}
          >
            {presetLabels?.[i] ?? `${len}`}
          </button>
        ))}
      </div>
    </div>
  )
}
