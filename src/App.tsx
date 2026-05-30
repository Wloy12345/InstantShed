import { useRef, useState } from 'react'
import './App.css'
import {
  initialWizardStep,
  ProjectWizard,
  type WizardStep,
} from './components/wizard/ProjectWizard'
import {
  createDefaultProject,
  downloadProject,
  parseProjectJson,
} from './lib/projectIO'
import type { Project } from './types/project'

function App() {
  const [project, setProject] = useState<Project>(createDefaultProject)
  const [wizardStep, setWizardStep] = useState<WizardStep>(initialWizardStep)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleNew() {
    setProject(createDefaultProject())
    setWizardStep(1)
    setImportError(null)
  }

  function handleExport() {
    setImportError(null)
    downloadProject(project)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const text = await file.text()
      const loaded = parseProjectJson(text)
      setProject(loaded)
      setWizardStep(1)
      setImportError(null)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import project.')
    }
  }

  const showHeaderActions = wizardStep < 4

  return (
    <div className="app">
      <header className={`app-header${wizardStep === 4 ? ' print-mode' : ''}`}>
        <div>
          <h1>InstantShed</h1>
          <p className="tagline">Construction project planner</p>
        </div>
        {showHeaderActions && (
          <div className="header-actions no-print">
            <button type="button" className="btn secondary" onClick={handleNew}>
              New
            </button>
            <button type="button" className="btn secondary" onClick={handleExport}>
              Export JSON
            </button>
            <button type="button" className="btn" onClick={handleImportClick}>
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={handleFileChange}
            />
          </div>
        )}
      </header>

      {importError && <p className="error-banner no-print">{importError}</p>}

      <main className="wizard-main">
        <ProjectWizard
          project={project}
          onChange={setProject}
          step={wizardStep}
          onStepChange={setWizardStep}
        />
      </main>
    </div>
  )
}

export default App
