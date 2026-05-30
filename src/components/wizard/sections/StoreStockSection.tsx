import type { Project } from '../../../types/project'
import { StockLengthInput } from './StockLengthInput'

interface StoreStockSectionProps {
  project: Project
  onChange: (project: Project) => void
}

export function StoreStockSection({ project, onChange }: StoreStockSectionProps) {
  const hasPierLayout =
    project.foundation.type === 'pier_beam' ||
    project.foundation.type === 'timber_pier'

  function updateStoreStock(partial: Partial<Project['storeStock']>) {
    onChange({
      ...project,
      storeStock: { ...project.storeStock, ...partial },
      shoppingStockLengths: {},
    })
  }

  return (
    <details className="panel details-section details-advanced">
      <summary>Advanced — shopping list starting sizes</summary>
      <p className="hint-block">
        Starting values for the shopping list. You can change each line on the review step.
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
    </details>
  )
}
