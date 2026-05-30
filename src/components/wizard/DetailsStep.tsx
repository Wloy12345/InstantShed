import type { Project } from '../../types/project'
import { ElectricalSection } from './sections/ElectricalSection'
import { ExteriorSection } from './sections/ExteriorSection'
import { FoundationSection } from './sections/FoundationSection'
import { InteriorTrimSection } from './sections/InteriorTrimSection'
import { OpeningsSection } from './sections/OpeningsSection'
import { RoofFinishSection } from './sections/RoofFinishSection'
import { StoreStockSection } from './sections/StoreStockSection'

interface DetailsStepProps {
  project: Project
  onChange: (project: Project) => void
}

export function DetailsStep({ project, onChange }: DetailsStepProps) {
  return (
    <div className="wizard-step details-step">
      <p className="hint-block wizard-step-intro">
        Configure foundation, finishes, and openings. Defaults work well for a typical shed.
      </p>
      <FoundationSection project={project} onChange={onChange} />
      <RoofFinishSection project={project} onChange={onChange} />
      <OpeningsSection project={project} onChange={onChange} />
      <ExteriorSection project={project} onChange={onChange} />
      <InteriorTrimSection project={project} onChange={onChange} />
      <ElectricalSection project={project} onChange={onChange} />
      <StoreStockSection project={project} onChange={onChange} />
    </div>
  )
}
