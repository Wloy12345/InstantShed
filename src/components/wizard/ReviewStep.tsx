import { useEffect, useRef } from 'react'
import { computeMetrics } from '../../lib/calculations'
import { suggestMaterials } from '../../lib/projectIO'
import type { Project } from '../../types/project'
import { BuildingPreview3D } from '../BuildingPreview3D'
import { ShoppingListPanel } from '../ShoppingListPanel'
import { SummaryPanel } from '../SummaryPanel'

interface ReviewStepProps {
  project: Project
  onChange: (project: Project) => void
}

export function ReviewStep({ project, onChange }: ReviewStepProps) {
  const metrics = computeMetrics(project)
  const syncedRef = useRef(false)

  useEffect(() => {
    if (syncedRef.current) return
    syncedRef.current = true
    const computed = suggestMaterials(project)
    const manual = project.materials.filter((m) => m.source === 'manual')
    onChange({ ...project, materials: [...computed, ...manual] })
    // Sync saved materials once when entering review
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="wizard-step review-step">
      <p className="hint-block wizard-step-intro">
        Preview your build and adjust store sizes or exclusions on the materials list. When
        ready, print a full summary.
      </p>
      <div className="review-layout">
        <BuildingPreview3D project={project} onChange={onChange} />
        <SummaryPanel project={project} metrics={metrics} />
        <ShoppingListPanel project={project} onChange={onChange} />
      </div>
    </div>
  )
}
