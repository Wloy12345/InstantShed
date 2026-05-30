import { computePierLayout, defaultMaxSpanFt } from '../../../lib/foundationLayout'
import type { FoundationType, PostSize, Project, StudSize, StudSpacingIn } from '../../../types/project'

interface FoundationSectionProps {
  project: Project
  onChange: (project: Project) => void
}

export function FoundationSection({ project, onChange }: FoundationSectionProps) {
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
    <section className="panel details-section">
      <h2>Foundation &amp; floor framing</h2>

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
              ? 'Concrete piers, post anchors, PT 4×6 girders (2 runners), rim and floor joists, T&G subfloor.'
              : 'Posts with PT 4×6 girders (one per pier row), framed floor on top.'}{' '}
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

      <h3 className="subsection-title">Wall framing</h3>

      <label className="field">
        <span>Stud size</span>
        <select
          value={project.framing.studSize}
          onChange={(e) => updateFraming({ studSize: e.target.value as StudSize })}
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
    </section>
  )
}
