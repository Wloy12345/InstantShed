import type { MaterialLine, Project } from '../types/project'
import { formatUsd } from '../lib/pricing'
import { hasComputedMaterials, printMaterialsList } from '../lib/exportPrintList'
import { suggestMaterials } from '../lib/projectIO'

interface MaterialsTableProps {
  project: Project
  onChange: (project: Project) => void
}

export function MaterialsTable({ project, onChange }: MaterialsTableProps) {
  const canExport = hasComputedMaterials(project)

  function updateMaterials(materials: MaterialLine[]) {
    onChange({ ...project, materials })
  }

  function updateLine(id: string, partial: Partial<MaterialLine>) {
    updateMaterials(
      project.materials.map((line) =>
        line.id === id ? { ...line, ...partial } : line,
      ),
    )
  }

  function addLine() {
    updateMaterials([
      ...project.materials,
      {
        id: crypto.randomUUID(),
        category: '',
        name: '',
        quantity: 0,
        unit: '',
        source: 'manual',
      },
    ])
  }

  function removeLine(id: string) {
    updateMaterials(project.materials.filter((line) => line.id !== id))
  }

  function handleSuggest() {
    const suggested = suggestMaterials(project)
    const manual = project.materials.filter((m) => m.source === 'manual')
    updateMaterials([...suggested, ...manual])
  }

  function handleExportPrint() {
    printMaterialsList(project)
  }

  const materialsSubtotal = project.materials.reduce(
    (sum, line) => sum + (line.lineTotalUsd ?? 0),
    0,
  )

  return (
    <section className="panel materials-panel">
      <div className="panel-header-row">
        <h2>Saved materials</h2>
        <div className="button-group">
          <button
            type="button"
            className="btn"
            onClick={handleExportPrint}
            disabled={!canExport}
            title={
              canExport
                ? 'Open printable list with Lowe\'s estimates'
                : 'Use Regenerate on the shopping list first'
            }
          >
            Export &amp; print
          </button>
          <button type="button" className="btn secondary" onClick={handleSuggest}>
            Refresh from project
          </button>
          <button type="button" className="btn secondary" onClick={addLine}>
            Add row
          </button>
        </div>
      </div>

      {!canExport ? (
        <p className="empty-hint">
          Click <strong>Regenerate</strong> on the shopping list above to save materials here,
          then use <strong>Export &amp; print</strong> for a printable list with price estimates.
        </p>
      ) : (
        <>
          {materialsSubtotal > 0 && (
            <p className="materials-subtotal-hint">
              Saved list subtotal: <strong>{formatUsd(materialsSubtotal)}</strong> (from last
              regenerate)
            </p>
          )}
          <div className="table-wrap">
            <table className="materials-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Name</th>
                  <th>Buy</th>
                  <th>Unit</th>
                  <th>Est. price</th>
                  <th>Notes</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {project.materials.map((line) => (
                  <tr key={line.id}>
                    <td>
                      <input
                        type="text"
                        value={line.category}
                        onChange={(e) =>
                          updateLine(line.id, { category: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={line.name}
                        onChange={(e) =>
                          updateLine(line.id, { name: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={line.piecesToBuy ?? line.quantity}
                        onChange={(e) =>
                          updateLine(line.id, {
                            quantity: Number(e.target.value) || 0,
                            piecesToBuy: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={line.unit}
                        onChange={(e) =>
                          updateLine(line.id, { unit: e.target.value })
                        }
                      />
                    </td>
                    <td className="price-cell">
                      {line.lineTotalUsd != null && line.lineTotalUsd > 0 ? (
                        <>
                          <span className="line-total">{formatUsd(line.lineTotalUsd)}</span>
                          {line.unitPriceUsd != null && (
                            <span className="price-detail">
                              {line.piecesToBuy ?? line.quantity} ×{' '}
                              {formatUsd(line.unitPriceUsd)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="price-muted">—</span>
                      )}
                    </td>
                    <td>
                      <input
                        type="text"
                        value={line.notes ?? ''}
                        onChange={(e) =>
                          updateLine(line.id, { notes: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn danger small"
                        onClick={() => removeLine(line.id)}
                        aria-label="Remove row"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
