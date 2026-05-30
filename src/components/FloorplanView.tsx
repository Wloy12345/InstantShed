import { useCallback, useRef, useState } from 'react'
import type { Project } from '../types/project'
import { computeMetrics, formatFeet, formatSqFt } from '../lib/calculations'
import { computePierLayout } from '../lib/foundationLayout'
import {
  computeFootprintLayout,
  footprintFromCornerDrag,
  footprintFromEdgeDrag,
  type EdgeHandle,
} from '../lib/footprintEditor'

interface FloorplanViewProps {
  project: Project
  onChange: (project: Project) => void
}

const PADDING = 56
const VIEW_SIZE = 320
const HANDLE_R = 8

export function FloorplanView({ project, onChange }: FloorplanViewProps) {
  const { lengthFt, widthFt } = project.footprint
  const metrics = computeMetrics(project)
  const layout = computePierLayout(project)
  const isSlab = project.foundation.type === 'slab'
  const isTimberPier = project.foundation.type === 'timber_pier'

  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{
    kind: 'corner' | 'edge'
    edge?: EdgeHandle
    startX: number
    startY: number
    startLength: number
    startWidth: number
  } | null>(null)

  const [dragging, setDragging] = useState(false)

  const fpLayout = computeFootprintLayout(lengthFt, widthFt, VIEW_SIZE, PADDING)
  const { scale, offsetX, offsetY, rectW, rectH } = fpLayout

  function toSvgX(xFt: number) {
    return offsetX + xFt * scale
  }

  function toSvgY(yFt: number) {
    return offsetY + yFt * scale
  }

  const applyFootprint = useCallback(
    (length: number, width: number) => {
      onChange({
        ...project,
        footprint: { lengthFt: length, widthFt: width },
      })
    },
    [onChange, project],
  )

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      let next: { lengthFt: number; widthFt: number }
      if (d.kind === 'corner') {
        next = footprintFromCornerDrag(
          d.startLength,
          d.startWidth,
          dx,
          dy,
          scale,
        )
      } else {
        next = footprintFromEdgeDrag(
          d.startLength,
          d.startWidth,
          d.edge!,
          dx,
          dy,
          scale,
        )
      }
      applyFootprint(next.lengthFt, next.widthFt)
    },
    [applyFootprint, scale],
  )

  const onPointerUp = useCallback(() => {
    dragRef.current = null
    setDragging(false)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }, [onPointerMove])

  function startDrag(
    e: React.PointerEvent,
    kind: 'corner' | 'edge',
    edge?: EdgeHandle,
  ) {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = {
      kind,
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startLength: lengthFt,
      startWidth: widthFt,
    }
    setDragging(true)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const handles = {
    n: { cx: offsetX + rectW / 2, cy: offsetY, cursor: 'ns-resize', edge: 'n' as const },
    s: { cx: offsetX + rectW / 2, cy: offsetY + rectH, cursor: 'ns-resize', edge: 's' as const },
    e: { cx: offsetX + rectW, cy: offsetY + rectH / 2, cursor: 'ew-resize', edge: 'e' as const },
    w: { cx: offsetX, cy: offsetY + rectH / 2, cursor: 'ew-resize', edge: 'w' as const },
    se: {
      cx: offsetX + rectW,
      cy: offsetY + rectH,
      cursor: 'nwse-resize',
      edge: undefined,
    },
  }

  return (
    <section className="panel floorplan-panel">
      <h2>Floorplan</h2>
      <p className="hint-block floorplan-drag-hint">
        Drag edges or the corner to resize. Values sync with the form and 3D preview.
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className={`floorplan-svg ${dragging ? 'is-dragging' : ''}`}
        role="img"
        aria-label={`Floorplan Length ${formatFeet(lengthFt)} by Depth ${formatFeet(widthFt)}`}
      >
        <defs>
          <pattern
            id="grid"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 16 0 L 0 0 0 16"
              fill="none"
              stroke="var(--grid-stroke)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width={VIEW_SIZE} height={VIEW_SIZE} fill="url(#grid)" />
        <rect
          x={offsetX}
          y={offsetY}
          width={rectW}
          height={rectH}
          className={isSlab ? 'footprint-rect slab' : 'footprint-rect'}
        />

        {layout &&
          layout.cols > 1 &&
          Array.from({ length: layout.cols - 1 }, (_, col) => {
            const x = toSvgX((col + 1) * layout.spacingLengthFt)
            return (
              <line
                key={`v-${col}`}
                x1={x}
                y1={offsetY}
                x2={x}
                y2={offsetY + rectH}
                className="grid-line"
              />
            )
          })}

        {layout &&
          layout.rows > 1 &&
          Array.from({ length: layout.rows - 1 }, (_, row) => {
            const y = toSvgY((row + 1) * layout.spacingWidthFt)
            return (
              <line
                key={`h-${row}`}
                x1={offsetX}
                y1={y}
                x2={offsetX + rectW}
                y2={y}
                className="grid-line"
              />
            )
          })}

        {layout?.posts.map((post, i) => (
          <circle
            key={i}
            cx={toSvgX(post.xFt)}
            cy={toSvgY(post.yFt)}
            r={5}
            className="pier-marker"
          />
        ))}

        <text
          x={VIEW_SIZE / 2}
          y={VIEW_SIZE / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="area-label"
        >
          {formatSqFt(metrics.floorAreaSqFt)}
        </text>
        <text
          x={VIEW_SIZE / 2}
          y={offsetY - 10}
          textAnchor="middle"
          className="dim-label"
        >
          {formatFeet(lengthFt)}
        </text>
        <text
          x={VIEW_SIZE / 2}
          y={offsetY + rectH + 20}
          textAnchor="middle"
          className="dim-label"
        >
          {formatFeet(lengthFt)}
        </text>
        <text
          x={offsetX - 12}
          y={offsetY + rectH / 2}
          textAnchor="end"
          dominantBaseline="middle"
          className="dim-label"
        >
          {formatFeet(widthFt)}
        </text>
        <text
          x={offsetX + rectW + 12}
          y={offsetY + rectH / 2}
          textAnchor="start"
          dominantBaseline="middle"
          className="dim-label"
        >
          {formatFeet(widthFt)}
        </text>

        {(['n', 's', 'e', 'w'] as const).map((key) => {
          const h = handles[key]
          return (
            <circle
              key={key}
              cx={h.cx}
              cy={h.cy}
              r={HANDLE_R}
              className="resize-handle"
              style={{ cursor: h.cursor }}
              onPointerDown={(e) => startDrag(e, 'edge', h.edge)}
            />
          )
        })}
        <circle
          cx={handles.se.cx}
          cy={handles.se.cy}
          r={HANDLE_R}
          className="resize-handle resize-handle-corner"
          style={{ cursor: handles.se.cursor }}
          onPointerDown={(e) => startDrag(e, 'corner')}
        />
      </svg>

      {isSlab && (
        <p className="floorplan-legend">Monolithic slab (no posts)</p>
      )}
      {layout && (
        <p className="floorplan-legend">
          {layout.postCount} × {layout.postSize}{' '}
          {isTimberPier ? 'timber piers' : 'posts'} — spacing{' '}
          {Math.round(layout.spacingLengthFt * 10) / 10}&apos; ×{' '}
          {Math.round(layout.spacingWidthFt * 10) / 10}&apos;
        </p>
      )}
    </section>
  )
}
