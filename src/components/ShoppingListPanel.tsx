import { useMemo } from 'react'
import { suggestMaterials } from '../lib/projectIO'
import { computePricedShopping, formatUsd } from '../lib/stockCalculator'
import type { PricedShoppingLine } from '../lib/pricing'
import type { Project } from '../types/project'

interface ShoppingListPanelProps {
  project: Project
  onChange: (project: Project) => void
}

export function ShoppingListPanel({ project, onChange }: ShoppingListPanelProps) {
  const estimate = useMemo(() => computePricedShopping(project), [project])

  function setStockForLine(stockKey: string, value: number) {
    const shoppingStockLengths = { ...project.shoppingStockLengths }
    if (value > 0) {
      shoppingStockLengths[stockKey] = value
    } else {
      delete shoppingStockLengths[stockKey]
    }
    onChange({ ...project, shoppingStockLengths })
  }

  function setExcludedForLine(stockKey: string, excluded: boolean) {
    const excludedStockKeys = { ...project.excludedStockKeys }
    if (excluded) excludedStockKeys[stockKey] = true
    else delete excludedStockKeys[stockKey]
    onChange({ ...project, excludedStockKeys })
  }

  function handleRegenerate() {
    const computed = suggestMaterials(project)
    const manual = project.materials.filter((m) => m.source === 'manual')
    onChange({ ...project, materials: [...computed, ...manual] })
  }

  return (
    <section className="panel shopping-panel">
      <div className="panel-header-row">
        <h2>Shopping list</h2>
        <button type="button" className="btn" onClick={handleRegenerate}>
          Regenerate
        </button>
      </div>
      <p className="hint-block">
        Enter piece or sheet sizes from the store. Buy count = ceil(need ÷ your size).{' '}
        <strong>Regenerate</strong> saves this list (with prices) to Saved materials below — then
        use <strong>Export &amp; print</strong>.
      </p>

      <div className="estimate-banner">
        <span className="estimate-label">Estimated materials (Lowe&apos;s)</span>
        <span className="estimate-total">{formatUsd(estimate.subtotalUsd)}</span>
        <span className="estimate-disclaimer">{estimate.priceSourceNote}</span>
      </div>

      <div className="table-wrap">
        <table className="materials-table shopping-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Material</th>
              <th>Use</th>
              <th>Need</th>
              <th>Your size</th>
              <th>Buy</th>
              <th>Est. price</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {estimate.lines.map((line) => (
              <ShoppingRow
                key={line.stockKey}
                line={line}
                excluded={project.excludedStockKeys[line.stockKey] === true}
                onStockChange={(v) => setStockForLine(line.stockKey, v)}
                onExcludedChange={(v) => setExcludedForLine(line.stockKey, v)}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="shopping-total-row">
              <td colSpan={6}>
                <strong>Materials subtotal</strong>
              </td>
              <td colSpan={2}>
                <strong>{formatUsd(estimate.subtotalUsd)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}

function ShoppingRow({
  line,
  excluded,
  onStockChange,
  onExcludedChange,
}: {
  line: PricedShoppingLine
  excluded: boolean
  onStockChange: (value: number) => void
  onExcludedChange: (excluded: boolean) => void
}) {
  const isSlab = line.stockKey === 'foundation.slab'
  const isSheet = line.stockIsSheetArea === true
  const canBuy = !isSlab

  return (
    <tr>
      <td>{line.category}</td>
      <td>{line.name}</td>
      <td>
        <label className="stock-input-label">
          <span className="sr-only">Include {line.name} in total</span>
          <input
            type="checkbox"
            checked={!excluded}
            onChange={(e) => onExcludedChange(!e.target.checked)}
          />
        </label>
      </td>
      <td>{line.displayNeed}</td>
      <td>
        {isSlab ? (
          '—'
        ) : line.allowStoreSizeOverride !== true ? (
          '—'
        ) : (
          <label className="stock-input-label">
            <span className="sr-only">
              {isSheet ? 'Sheet size in square feet' : 'Piece length in feet'} for {line.name}
            </span>
            <input
              type="number"
              className="stock-input"
              min={0.1}
              step={isSheet ? 1 : 0.5}
              value={line.effectiveStockFt || ''}
              placeholder={isSheet ? '32' : '8'}
              onChange={(e) => onStockChange(Number(e.target.value) || 0)}
            />
            <span className="stock-unit">{isSheet ? 'sq ft / sheet' : 'ft / piece'}</span>
          </label>
        )}
      </td>
      <td className="buy-cell">
        {!canBuy ? (
          '—'
        ) : needsStockSizeInput(line) && line.effectiveStockFt <= 0 ? (
          <span className="buy-hint">Enter size</span>
        ) : (
          <>
            {line.piecesToBuy}
            <span className="buy-formula">{buyFormulaHint(line, isSheet)}</span>
          </>
        )}
      </td>
      <td className="price-cell">
        <PriceCell line={line} isSlab={isSlab} canBuy={canBuy} excluded={excluded} />
      </td>
      <td className="notes-cell">{line.notes ?? ''}</td>
    </tr>
  )
}

function needsStockSizeInput(line: PricedShoppingLine): boolean {
  if (line.allowStoreSizeOverride !== true) return false
  if (line.stockIsSheetArea) return true
  if (line.unit === 'pcs' && line.stockLengthFt != null) return true
  if (line.unit === 'lf' && line.stockLengthFt != null) return true
  return false
}

function buyFormulaHint(line: PricedShoppingLine, isSheet: boolean): string {
  if (isSheet && line.effectiveStockFt > 0) {
    return `ceil(${line.quantity} ÷ ${line.effectiveStockFt})`
  }
  if (line.unit === 'sq ft' && !line.stockIsSheetArea) {
    return `${line.quantity} sq ft`
  }
  if (line.unit === 'cu ft') {
    return `${line.quantity} cu ft`
  }
  if (line.unit === 'lf') {
    if (line.effectiveStockFt > 0 && line.stockLengthFt != null) {
      return `ceil(${Math.round((line.linearFeetNeeded ?? line.quantity) * 10) / 10} ÷ ${line.effectiveStockFt})`
    }
    return `${Math.round((line.linearFeetNeeded ?? line.quantity) * 10) / 10} lf`
  }
  if (line.unit === 'pcs' && line.name.includes('stud')) {
    if (line.piecesToBuy === line.count) return `${line.count} studs`
    return `ceil(${Math.round((line.linearFeetNeeded ?? 0) * 10) / 10} LF ÷ ${line.effectiveStockFt})`
  }
  if (line.unit === 'pcs') {
    return `${line.count ?? line.piecesToBuy} pcs`
  }
  if (line.effectiveStockFt > 0) {
    return `ceil(${Math.round((line.linearFeetNeeded ?? line.quantity) * 10) / 10} ÷ ${line.effectiveStockFt})`
  }
  return ''
}

function priceDetailText(line: PricedShoppingLine, isSlab: boolean): string | null {
  if (line.unitPriceUsd == null) return null
  if (isSlab) {
    return `${formatUsd(line.unitPriceUsd)}/sq ft × ${line.quantity} sq ft`
  }
  if (line.unit === 'sq ft' && !line.stockIsSheetArea) {
    return `${formatUsd(line.unitPriceUsd)}/sq ft × ${line.quantity} sq ft`
  }
  if (line.unit === 'cu ft') {
    return `${formatUsd(line.unitPriceUsd)}/cu ft × ${line.quantity} cu ft`
  }
  if (line.unit === 'lf') {
    const lf = line.linearFeetNeeded ?? line.quantity
    return `${formatUsd(line.unitPriceUsd)}/ft × ${Math.round(lf * 10) / 10} ft`
  }
  if (line.piecesToBuy > 0) {
    return `${line.piecesToBuy} × ${formatUsd(line.unitPriceUsd)}`
  }
  return null
}

function PriceCell({
  line,
  isSlab,
  canBuy,
  excluded,
}: {
  line: PricedShoppingLine
  isSlab: boolean
  canBuy: boolean
  excluded: boolean
}) {
  if (excluded) {
    return <span className="price-muted">Excluded</span>
  }
  if (line.lineTotalUsd != null && line.lineTotalUsd > 0 && line.unitPriceUsd != null) {
    const detail = priceDetailText(line, isSlab)
    return (
      <>
        <span className="line-total">{formatUsd(line.lineTotalUsd)}</span>
        {detail && <span className="price-detail">{detail}</span>}
        {line.priceSkuNote && <span className="price-detail">{line.priceSkuNote}</span>}
      </>
    )
  }

  if (!canBuy) {
    return <span className="price-muted">—</span>
  }

  if (needsStockSizeInput(line) && line.effectiveStockFt <= 0) {
    return <span className="price-muted">—</span>
  }

  return <span className="price-muted">—</span>
}
