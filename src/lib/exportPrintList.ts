import { getPrintDocumentData } from './printDocument'
import type { Project } from '../types/project'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildPrintableMaterialsHtml(project: Project): string {
  const doc = getPrintDocumentData(project)

  const rows = doc.materialRows
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.category)}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.displayNeed)}</td>
        <td>${escapeHtml(row.sizeCell)}</td>
        <td class="num">${escapeHtml(row.buyCell)}</td>
        <td class="num">${escapeHtml(row.unitPrice)}</td>
        <td class="num">${escapeHtml(row.lineTotal)}</td>
        <td>${escapeHtml(row.notes)}</td>
      </tr>`,
    )
    .join('')

  const warningsHtml =
    doc.warnings.length > 0
      ? `<section class="print-warnings"><h2>Structural notes</h2>${doc.warnings.map((w) => `<p>${escapeHtml(w)}</p>`).join('')}</section>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(doc.projectName)} — Materials List</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      color: #1f1c18;
      margin: 2rem;
      line-height: 1.45;
    }
    h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
    h2 { margin: 1.25rem 0 0.5rem; font-size: 1rem; }
    .meta { color: #5c554c; font-size: 0.9rem; margin-bottom: 1rem; }
    .meta p { margin: 0.2rem 0; }
    .spec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem 1.5rem; font-size: 0.9rem; }
    .spec-grid dt { font-weight: 600; margin: 0; }
    .spec-grid dd { margin: 0 0 0.5rem; }
    .total-box {
      margin: 1rem 0 1.5rem;
      padding: 1rem 1.25rem;
      background: #f4f1ec;
      border-radius: 8px;
      display: inline-block;
    }
    .total-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #5c554c; }
    .total-amount { font-size: 1.75rem; font-weight: 700; color: #2d6a4f; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { border: 1px solid #d8d0c4; padding: 0.5rem 0.65rem; text-align: left; vertical-align: top; }
    th { background: #f4f1ec; font-weight: 600; }
    td.num { text-align: right; }
    tfoot td { font-weight: 700; background: #f4f1ec; }
    .disclaimer { margin-top: 1.5rem; font-size: 0.8rem; color: #5c554c; max-width: 40rem; }
    .print-warnings { background: #fef3c7; border: 1px solid #f59e0b; padding: 0.75rem 1rem; border-radius: 6px; }
    @media print {
      body { margin: 0.5in; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(doc.projectName)}</h1>
  <div class="meta">
    <p><strong>Date:</strong> ${escapeHtml(doc.dateLabel)}</p>
  </div>
  <h2>Structure</h2>
  <dl class="spec-grid">
    <dt>Footprint</dt><dd>${escapeHtml(doc.footprintSummary)} — ${doc.floorAreaSqFt} sq ft floor</dd>
    <dt>Wall height</dt><dd>${doc.wallHeightFt}'</dd>
    <dt>Roof</dt><dd>${escapeHtml(doc.roofSummary)}</dd>
    <dt>Perimeter</dt><dd>${doc.perimeterFt} ft</dd>
    <dt>Est. wall area</dt><dd>${Math.round(doc.wallAreaSqFt * 10) / 10} sq ft</dd>
    <dt>Est. roof area</dt><dd>${Math.round(doc.roofAreaSqFt * 10) / 10} sq ft</dd>
  </dl>
  <h2>Build details</h2>
  <dl class="spec-grid">
    <dt>Foundation</dt><dd>${escapeHtml(doc.foundationLabel)}</dd>
    <dt>Framing</dt><dd>${escapeHtml(doc.framingLabel)}</dd>
    <dt>Build scope</dt><dd>${escapeHtml(doc.buildScopeLabel)}</dd>
    <dt>Roof covering</dt><dd>${escapeHtml(doc.roofCoveringLabel)}</dd>
    <dt>Wall system</dt><dd>${escapeHtml(doc.wallSystemLabel)}</dd>
    <dt>Siding</dt><dd>${escapeHtml(doc.sidingLabel)}</dd>
    <dt>Openings</dt><dd>${escapeHtml(doc.openingsLabel)}</dd>
    <dt>Interior</dt><dd>${escapeHtml(doc.interiorLabel)}</dd>
  </dl>
  ${warningsHtml}
  <div class="total-box">
    <div class="total-label">Estimated materials (Lowe's)</div>
    <div class="total-amount">${escapeHtml(doc.subtotalFormatted)}</div>
  </div>
  <table>
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
      ${rows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="6">Materials subtotal</td>
        <td class="num">${escapeHtml(doc.subtotalFormatted)}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>
  <p class="disclaimer">${escapeHtml(doc.priceSourceNote)}</p>
  <p class="disclaimer no-print">The print dialog should open automatically. If not, use your browser&apos;s Print command (e.g. Cmd/Ctrl+P).</p>
</body>
</html>`
}

const PRINT_READY_DELAY_MS = 600

export function printMaterialsList(project: Project): void {
  const html = buildPrintableMaterialsHtml(project)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (!win) {
    URL.revokeObjectURL(url)
    alert('Pop-up blocked. Allow pop-ups for this site to print the materials list.')
    return
  }

  let printed = false
  const tryPrint = () => {
    if (printed || win.closed) return
    printed = true
    URL.revokeObjectURL(url)
    win.focus()
    win.print()
  }

  win.addEventListener('load', tryPrint, { once: true })
  setTimeout(tryPrint, PRINT_READY_DELAY_MS)
}

export function hasComputedMaterials(project: Project): boolean {
  return project.materials.some((m) => m.source === 'computed')
}
