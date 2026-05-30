import { useMemo } from 'react'
import { getPrintDocumentData } from '../../lib/printDocument'
import { formatSqFt } from '../../lib/calculations'
import type { Project } from '../../types/project'

interface PrintStepProps {
  project: Project
  onBack: () => void
}

export function PrintStep({ project, onBack }: PrintStepProps) {
  const doc = useMemo(() => getPrintDocumentData(project), [project])

  function handlePrint() {
    window.print()
  }

  return (
    <div className="wizard-step print-step">
      <div className="print-toolbar no-print">
        <button type="button" className="btn secondary" onClick={onBack}>
          Back to review
        </button>
        <button type="button" className="btn" onClick={handlePrint}>
          Print
        </button>
      </div>

      <article className="print-document">
        <header className="print-header">
          <h1>{doc.projectName}</h1>
          <p className="print-meta-line">
            <strong>Date:</strong> {doc.dateLabel}
          </p>
        </header>

        <section className="print-section">
          <h2>Structure</h2>
          <dl className="print-spec-grid">
            <div>
              <dt>Footprint</dt>
              <dd>
                {doc.footprintSummary} — {doc.floorAreaSqFt} sq ft floor
              </dd>
            </div>
            <div>
              <dt>Wall height</dt>
              <dd>{doc.wallHeightFt}&apos;</dd>
            </div>
            <div>
              <dt>Roof</dt>
              <dd>{doc.roofSummary}</dd>
            </div>
            <div>
              <dt>Perimeter</dt>
              <dd>{doc.perimeterFt} ft</dd>
            </div>
            <div>
              <dt>Est. wall area</dt>
              <dd>{formatSqFt(doc.wallAreaSqFt)}</dd>
            </div>
            <div>
              <dt>Est. roof area</dt>
              <dd>{formatSqFt(doc.roofAreaSqFt)}</dd>
            </div>
          </dl>
        </section>

        <section className="print-section">
          <h2>Build details</h2>
          <dl className="print-spec-grid">
            <div>
              <dt>Foundation</dt>
              <dd>{doc.foundationLabel}</dd>
            </div>
            <div>
              <dt>Framing</dt>
              <dd>{doc.framingLabel}</dd>
            </div>
            <div>
              <dt>Build scope</dt>
              <dd>{doc.buildScopeLabel}</dd>
            </div>
            <div>
              <dt>Roof covering</dt>
              <dd>{doc.roofCoveringLabel}</dd>
            </div>
            <div>
              <dt>Wall system</dt>
              <dd>{doc.wallSystemLabel}</dd>
            </div>
            <div>
              <dt>Siding</dt>
              <dd>{doc.sidingLabel}</dd>
            </div>
            <div>
              <dt>Openings</dt>
              <dd>{doc.openingsLabel}</dd>
            </div>
            <div>
              <dt>Interior</dt>
              <dd>{doc.interiorLabel}</dd>
            </div>
          </dl>
        </section>

        {doc.warnings.length > 0 && (
          <section className="print-section print-warnings">
            <h2>Structural notes</h2>
            {doc.warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </section>
        )}

        <section className="print-section">
          <div className="print-total-box">
            <span className="print-total-label">Estimated materials (Lowe&apos;s)</span>
            <span className="print-total-amount">{doc.subtotalFormatted}</span>
          </div>

          <table className="print-materials-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Material</th>
                <th>Need</th>
                <th>Your size</th>
                <th>Buy</th>
                <th>Unit price</th>
                <th>Line total</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {doc.materialRows.map((row, i) => (
                <tr key={`${row.category}-${row.name}-${i}`}>
                  <td>{row.category}</td>
                  <td>{row.name}</td>
                  <td>{row.displayNeed}</td>
                  <td>{row.sizeCell}</td>
                  <td className="num">{row.buyCell}</td>
                  <td className="num">{row.unitPrice}</td>
                  <td className="num">{row.lineTotal}</td>
                  <td>{row.notes}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6}>
                  <strong>Materials subtotal</strong>
                </td>
                <td className="num">
                  <strong>{doc.subtotalFormatted}</strong>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>

          <p className="print-disclaimer">{doc.priceSourceNote}</p>
        </section>
      </article>
    </div>
  )
}
