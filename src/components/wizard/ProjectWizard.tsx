import { useEffect } from 'react'
import type { Project } from '../../types/project'
import { DetailsStep } from './DetailsStep'
import { PrintStep } from './PrintStep'
import { ReviewStep } from './ReviewStep'
import { StructureStep } from './StructureStep'

export type WizardStep = 1 | 2 | 3 | 4

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 1, label: 'Structure' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Review' },
  { id: 4, label: 'Print' },
]

interface ProjectWizardProps {
  project: Project
  onChange: (project: Project) => void
  step: WizardStep
  onStepChange: (step: WizardStep) => void
}

export function ProjectWizard({
  project,
  onChange,
  step,
  onStepChange,
}: ProjectWizardProps) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  function goToStep(next: WizardStep) {
    onStepChange(next)
  }

  return (
    <div className={`wizard wizard-step-${step}`}>
      <nav className="wizard-steps no-print" aria-label="Build steps">
        {STEPS.map((s, index) => {
          const isActive = step === s.id
          const isComplete = step > s.id
          return (
            <div
              key={s.id}
              className={`wizard-step-indicator${isActive ? ' active' : ''}${isComplete ? ' complete' : ''}`}
            >
              <span className="wizard-step-number">{index + 1}</span>
              <span className="wizard-step-label">{s.label}</span>
              {index < STEPS.length - 1 && <span className="wizard-step-connector" aria-hidden />}
            </div>
          )
        })}
      </nav>

      <div className="wizard-body">
        {step === 1 && <StructureStep project={project} onChange={onChange} />}
        {step === 2 && <DetailsStep project={project} onChange={onChange} />}
        {step === 3 && <ReviewStep project={project} onChange={onChange} />}
        {step === 4 && <PrintStep project={project} onBack={() => goToStep(3)} />}
      </div>

      {step < 4 && (
        <footer className="wizard-nav no-print">
          {step > 1 ? (
            <button
              type="button"
              className="btn secondary"
              onClick={() => goToStep((step - 1) as WizardStep)}
            >
              Back
            </button>
          ) : (
            <span />
          )}
          {step === 3 ? (
            <button type="button" className="btn" onClick={() => goToStep(4)}>
              Print materials list
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => goToStep((step + 1) as WizardStep)}>
              Continue
            </button>
          )}
        </footer>
      )}
    </div>
  )
}

export function initialWizardStep(): WizardStep {
  return 1
}
