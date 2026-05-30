import { useMemo } from 'react'
import type { Project, ProjectMetrics } from '../types/project'
import { formatFeet, formatSqFt } from '../lib/calculations'
import { computePierLayout } from '../lib/foundationLayout'
import { computeStructuralWarnings } from '../lib/structuralWarnings'
import { computePricedShopping, formatUsd } from '../lib/stockCalculator'

interface SummaryPanelProps {
  project: Project
  metrics: ProjectMetrics
}

export function SummaryPanel({ project, metrics }: SummaryPanelProps) {
  const layout = computePierLayout(project)
  const estimate = useMemo(() => computePricedShopping(project), [project])
  const warnings = useMemo(() => computeStructuralWarnings(project), [project])

  return (
    <section className="panel summary-panel">
      <h2>Summary</h2>

      {warnings.length > 0 && (
        <div className="structural-warnings" role="alert">
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      <div className="summary-estimate">
        <span className="summary-estimate-label">Est. materials (Lowe&apos;s)</span>
        <span className="summary-estimate-value">{formatUsd(estimate.subtotalUsd)}</span>
      </div>

      <dl className="stat-grid">
        <div className="stat">
          <dt>Floor area</dt>
          <dd>{formatSqFt(metrics.floorAreaSqFt)}</dd>
        </div>
        <div className="stat">
          <dt>Perimeter</dt>
          <dd>{formatFeet(metrics.perimeterFt)}</dd>
        </div>
        <div className="stat">
          <dt>Wall area (est.)</dt>
          <dd>{formatSqFt(metrics.wallAreaSqFt)}</dd>
        </div>
        <div className="stat">
          <dt>Roof area (est.)</dt>
          <dd>{formatSqFt(metrics.roofAreaSqFt)}</dd>
        </div>
      </dl>

      <dl className="summary-meta">
        <div>
          <dt>Foundation</dt>
          <dd>
            {project.foundation.type === 'slab'
              ? 'Concrete slab'
              : project.foundation.type === 'timber_pier'
                ? `${project.foundation.postSize ?? '6x6'} timber pier`
                : `${project.foundation.postSize ?? '6x6'} pier & beam`}
          </dd>
        </div>
        <div>
          <dt>Framing</dt>
          <dd>
            {project.framing.studSize} @ {project.framing.studSpacingIn}&quot; OC
          </dd>
        </div>
        {layout && (
          <div>
            <dt>Posts</dt>
            <dd>
              {layout.postCount} posts,{' '}
              {Math.round(layout.spacingLengthFt * 10) / 10}&apos; spacing
            </dd>
          </div>
        )}
      </dl>
      <p className="hint-block summary-price-hint">{estimate.priceSourceNote}</p>
    </section>
  )
}
