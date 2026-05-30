import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { Project } from '../types/project'
import { computePierLayout } from '../lib/foundationLayout'
import { wallHeightFromDragDelta } from '../lib/footprintEditor'
import { computeFramingMembers } from '../lib/framingLayout'
import type { FramingMember } from '../lib/framingLayout'
import { computeDoorPlacements, computeWindowPlacements } from '../lib/openingsLayout'

interface BuildingPreview3DProps {
  project: Project
  onChange: (project: Project) => void
}

type ViewMode = 'solid' | 'cutaway' | 'framing'

const WALL_THICKNESS = 0.2

const PIXELS_PER_FOOT_DRAG = 24

const OrbitRef = createContext<React.RefObject<OrbitControlsImpl | null>>({
  current: null,
})

const SIDING_COLORS: Record<Project['siding']['type'], string> = {
  none: '#cfc6b8',
  t111_4x8: '#b89b6e',
  lp_smartside_4x8: '#d9cdb8',
}

const INTERIOR_COLORS: Record<Project['interior']['finish'], string> = {
  none: '#bfb09a',
  osb_7_16_4x8: '#cdab73',
  drywall_1_2_4x8: '#f3f1ec',
}

const ROOFING_STYLE: Record<Project['roofing']['type'], { color: string; metalness: number; roughness: number }> = {
  metal: { color: '#6c7a86', metalness: 0.7, roughness: 0.35 },
  shingles: { color: '#4f4a44', metalness: 0.05, roughness: 0.95 },
}

const FRAMING_COLORS: Record<FramingMember['kind'], string> = {
  stud: '#c8a76c',
  plate: '#b8924f',
  joist: '#c8a76c',
  rafter: '#caa968',
  ridge: '#a87f3f',
  post: '#6b5a45',
}

const VIEW_MODES: Array<{ id: ViewMode; label: string; title: string }> = [
  { id: 'solid', label: 'Solid', title: 'Full exterior model' },
  { id: 'cutaway', label: 'Cutaway', title: 'Cut the building in half to see inside' },
  { id: 'framing', label: 'Framing', title: 'Show only the structural framing' },
]

export function BuildingPreview3D({ project, onChange }: BuildingPreview3DProps) {
  const { lengthFt, widthFt } = project.footprint
  const maxDim = Math.max(lengthFt, widthFt, 8)
  const camDist = maxDim * 1.4
  const camY = project.wallHeightFt * 1.2 + 4
  const orbitRef = useRef<OrbitControlsImpl | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('solid')

  return (
    <section className="panel building-preview-panel">
      <h2>3D preview</h2>
      <p className="hint-block">
        Drag the <strong>green ring</strong> to set wall height, and rotate with the mouse. Use{' '}
        <strong>Cutaway</strong> to slice the building open or <strong>Framing</strong> to see the
        structure.
      </p>
      <div className="building-preview-canvas">
        <div className="preview-view-toolbar" role="group" aria-label="3D view mode">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              title={mode.title}
              className={viewMode === mode.id ? 'active' : ''}
              onClick={() => setViewMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <Canvas
          camera={{
            position: [camDist, camY, camDist],
            fov: 45,
            near: 0.1,
            far: 500,
          }}
          gl={{ antialias: true, localClippingEnabled: true }}
        >
          <color attach="background" args={['#e8e4dc']} />
          <ambientLight intensity={0.55} />
          <directionalLight position={[12, 20, 8]} intensity={1.1} castShadow />
          <ClippingController active={viewMode === 'cutaway'} widthFt={widthFt} />
          <OrbitRef.Provider value={orbitRef}>
            <group position={[0, 0, 0]}>
              <ShedMeshes project={project} onChange={onChange} viewMode={viewMode} />
            </group>
          </OrbitRef.Provider>
          <OrbitControls
            ref={orbitRef}
            makeDefault
            target={[0, project.wallHeightFt / 2, 0]}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={maxDim * 0.6}
            maxDistance={maxDim * 3}
          />
        </Canvas>
      </div>
    </section>
  )
}

/**
 * Drives renderer-level clipping so the cutaway mode slices the whole model on a
 * single plane through the center (along the width axis), revealing the interior.
 */
function ClippingController({ active, widthFt }: { active: boolean; widthFt: number }) {
  const { gl } = useThree()

  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
    [],
  )

  useEffect(() => {
    // localClippingEnabled is set via the Canvas `gl` prop; here we only toggle
    // the active clip plane. Mutating the renderer is the idiomatic r3f pattern.
    /* eslint-disable react-hooks/immutability */
    gl.clippingPlanes = active ? [plane] : []
    return () => {
      gl.clippingPlanes = []
    }
    /* eslint-enable react-hooks/immutability */
  }, [gl, active, plane, widthFt])

  return null
}

function ShedMeshes({
  project,
  onChange,
  viewMode,
}: {
  project: Project
  onChange: (project: Project) => void
  viewMode: ViewMode
}) {
  const { lengthFt, widthFt } = project.footprint
  const h = project.wallHeightFt
  const layout = computePierLayout(project)
  const isSlab = project.foundation.type === 'slab'
  const isFraming = viewMode === 'framing'

  const halfL = lengthFt / 2
  const halfW = widthFt / 2
  const t = WALL_THICKNESS

  const pitchRad = useMemo(() => {
    const rise = project.roof.pitchRisePer12 ?? 4
    return Math.atan(rise / 12)
  }, [project.roof.pitchRisePer12])

  const sidingColor = SIDING_COLORS[project.siding.type]
  const interiorColor = INTERIOR_COLORS[project.interior.finish]
  const showInterior = project.interior.finish !== 'none'

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[lengthFt, widthFt]} />
        <meshStandardMaterial color={isFraming ? '#d8cfc0' : '#c4b8a8'} side={THREE.DoubleSide} />
      </mesh>

      {isFraming ? (
        <FramingMeshes project={project} />
      ) : (
        <>
          <mesh position={[0, h / 2, halfW - t / 2]} castShadow>
            <boxGeometry args={[lengthFt, h, t]} />
            <meshStandardMaterial color={sidingColor} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, h / 2, -halfW + t / 2]} castShadow>
            <boxGeometry args={[lengthFt, h, t]} />
            <meshStandardMaterial color={sidingColor} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[halfL - t / 2, h / 2, 0]} castShadow>
            <boxGeometry args={[t, h, widthFt - t * 2]} />
            <meshStandardMaterial color={sidingColor} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-halfL + t / 2, h / 2, 0]} castShadow>
            <boxGeometry args={[t, h, widthFt - t * 2]} />
            <meshStandardMaterial color={sidingColor} side={THREE.DoubleSide} />
          </mesh>

          <SidingDetail project={project} halfL={halfL} halfW={halfW} h={h} />

          {showInterior && (
            <InteriorLiner halfL={halfL} halfW={halfW} h={h} t={t} color={interiorColor} />
          )}

          <Openings project={project} halfL={halfL} halfW={halfW} h={h} />

          <RoofMesh
            roofType={project.roof.type}
            roofingType={project.roofing.type}
            lengthFt={lengthFt}
            widthFt={widthFt}
            wallHeightFt={h}
            pitchRad={pitchRad}
          />

          {isSlab && (
            <mesh position={[0, -0.15, 0]} receiveShadow>
              <boxGeometry args={[lengthFt + 0.4, 0.3, widthFt + 0.4]} />
              <meshStandardMaterial color="#9c958a" />
            </mesh>
          )}

          {!isSlab &&
            layout?.posts.map((post, i) => (
              <mesh
                key={i}
                position={[post.xFt - halfL, 0.4, post.yFt - halfW]}
                castShadow
              >
                <cylinderGeometry args={[0.2, 0.25, 0.8, 8]} />
                <meshStandardMaterial color="#6b5a45" />
              </mesh>
            ))}

          {!isSlab && <FoundationBeams project={project} halfW={halfW} />}
        </>
      )}

      <WallHeightHandle
        wallHeightFt={h}
        halfL={halfL}
        onChange={(wallHeightFt) => onChange({ ...project, wallHeightFt })}
      />
    </>
  )
}

/** Thin liner planes just inside each wall, colored by the chosen interior finish. */
function InteriorLiner({
  halfL,
  halfW,
  h,
  t,
  color,
}: {
  halfL: number
  halfW: number
  h: number
  t: number
  color: string
}) {
  const inset = t + 0.01
  return (
    <group>
      <mesh position={[0, h / 2, halfW - inset]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[halfL * 2 - t * 2, h]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, h / 2, -halfW + inset]}>
        <planeGeometry args={[halfL * 2 - t * 2, h]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[halfL - inset, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[halfW * 2 - t * 2, h]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-halfL + inset, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[halfW * 2 - t * 2, h]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/**
 * Adds material-specific surface detail to the walls: vertical grooves for T1-11
 * panel siding, horizontal lap shadow lines for LP SmartSide, and corner trim
 * boards when enabled. Strips sit slightly proud of the wall to avoid z-fighting.
 */
function SidingDetail({
  project,
  halfL,
  halfW,
  h,
}: {
  project: Project
  halfL: number
  halfW: number
  h: number
}) {
  const { type } = project.siding
  const lengthFt = halfL * 2
  const widthFt = halfW * 2
  const off = WALL_THICKNESS / 2 + 0.012
  const lineColor = '#4a3f30'

  const detail = useMemo(() => {
    if (type === 'none') return null
    const xWalls: Array<{ key: string; position: [number, number, number]; size: [number, number, number] }> = []
    const zWalls: typeof xWalls = []

    if (type === 't111_4x8') {
      // Vertical grooves every ~16".
      const spacing = 16 / 12
      const lenPositions = evenInteriorPositions(lengthFt, spacing)
      lenPositions.forEach((x, i) => {
        xWalls.push({ key: `gv-f-${i}`, position: [x, h / 2, halfW + off], size: [0.04, h, 0.025] })
        xWalls.push({ key: `gv-b-${i}`, position: [x, h / 2, -halfW - off], size: [0.04, h, 0.025] })
      })
      const depthPositions = evenInteriorPositions(widthFt, spacing)
      depthPositions.forEach((z, i) => {
        zWalls.push({ key: `gv-r-${i}`, position: [halfL + off, h / 2, z], size: [0.025, h, 0.04] })
        zWalls.push({ key: `gv-l-${i}`, position: [-halfL - off, h / 2, z], size: [0.025, h, 0.04] })
      })
    } else {
      // LP SmartSide lap: horizontal shadow lines every ~8".
      const spacing = 8 / 12
      const rows = evenInteriorPositions(h, spacing)
      rows.forEach((y, i) => {
        xWalls.push({ key: `lap-f-${i}`, position: [0, y, halfW + off], size: [lengthFt, 0.04, 0.02] })
        xWalls.push({ key: `lap-b-${i}`, position: [0, y, -halfW - off], size: [lengthFt, 0.04, 0.02] })
        zWalls.push({ key: `lap-r-${i}`, position: [halfL + off, y, 0], size: [0.02, 0.04, widthFt] })
        zWalls.push({ key: `lap-l-${i}`, position: [-halfL - off, y, 0], size: [0.02, 0.04, widthFt] })
      })
    }
    return [...xWalls, ...zWalls]
  }, [type, lengthFt, widthFt, h, halfL, halfW, off])

  const corners = useMemo(() => {
    if (!project.trim.includeCornerTrim) return []
    const c = off + 0.01
    return [
      { key: 'ct-1', position: [halfL + c, h / 2, halfW + c] as [number, number, number] },
      { key: 'ct-2', position: [-halfL - c, h / 2, halfW + c] as [number, number, number] },
      { key: 'ct-3', position: [halfL + c, h / 2, -halfW - c] as [number, number, number] },
      { key: 'ct-4', position: [-halfL - c, h / 2, -halfW - c] as [number, number, number] },
    ]
  }, [project.trim.includeCornerTrim, halfL, halfW, h, off])

  return (
    <group>
      {detail?.map((d) => (
        <mesh key={d.key} position={d.position}>
          <boxGeometry args={d.size} />
          <meshStandardMaterial color={lineColor} roughness={0.9} />
        </mesh>
      ))}
      {corners.map((c) => (
        <mesh key={c.key} position={c.position}>
          <boxGeometry args={[0.25, h, 0.25]} />
          <meshStandardMaterial color="#efe9dd" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

/** Evenly spaced interior positions across `span` (centered on 0), excluding the ends. */
function evenInteriorPositions(span: number, spacing: number): number[] {
  if (span <= 0 || spacing <= 0) return []
  const segments = Math.max(1, Math.round(span / spacing))
  const positions: number[] = []
  for (let i = 1; i < segments; i++) {
    positions.push(-span / 2 + (span * i) / segments)
  }
  return positions
}

/** Doors on the front wall and windows distributed across the side walls. */
function Openings({
  project,
  halfL,
  halfW,
  h,
}: {
  project: Project
  halfL: number
  halfW: number
  h: number
}) {
  const doors = useMemo(() => computeDoorPlacements(project, halfL), [project, halfL])
  const windows = useMemo(
    () => computeWindowPlacements(project, halfW, h),
    [project, halfW, h],
  )

  return (
    <group>
      {doors.map((d, i) => (
        <group key={`door-${i}`} position={[d.x, d.heightFt / 2, halfW + 0.02]}>
          <mesh>
            <boxGeometry args={[d.widthFt + 0.2, d.heightFt + 0.2, 0.05]} />
            <meshStandardMaterial color="#3b332a" />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[d.widthFt, d.heightFt, 0.05]} />
            <meshStandardMaterial color="#6f5b41" />
          </mesh>
        </group>
      ))}
      {windows.map((w, i) => {
        const x = w.side === 'right' ? halfL + 0.02 : -halfL - 0.02
        return (
          <group
            key={`window-${i}`}
            position={[x, w.sillFt + w.heightFt / 2, w.z]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <mesh>
              <boxGeometry args={[w.widthFt + 0.2, w.heightFt + 0.2, 0.05]} />
              <meshStandardMaterial color="#e8e4dc" />
            </mesh>
            <mesh position={[0, 0, 0.03]}>
              <boxGeometry args={[w.widthFt, w.heightFt, 0.04]} />
              <meshStandardMaterial
                color="#9fc4d6"
                transparent
                opacity={0.55}
                metalness={0.1}
                roughness={0.1}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/** Simple beam runs spanning the pier rows, shown under the floor. */
function FoundationBeams({
  project,
  halfW,
}: {
  project: Project
  halfW: number
}) {
  const layout = computePierLayout(project)
  if (!layout) return null
  const { lengthFt } = project.footprint
  const rowZs = Array.from(new Set(layout.posts.map((p) => p.yFt))).sort((a, b) => a - b)
  return (
    <group>
      {rowZs.map((yFt, i) => (
        <mesh key={i} position={[0, -0.05, yFt - halfW]}>
          <boxGeometry args={[lengthFt, 0.3, 0.4]} />
          <meshStandardMaterial color="#5a4a37" />
        </mesh>
      ))}
    </group>
  )
}

function FramingMeshes({ project }: { project: Project }) {
  const members = useMemo(() => computeFramingMembers(project), [project])
  return (
    <group>
      {members.map((m) => (
        <mesh key={m.key} position={m.position} rotation={m.rotation} castShadow>
          <boxGeometry args={m.size} />
          <meshStandardMaterial color={FRAMING_COLORS[m.kind]} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Surface detail for a single roof plane whose outward normal is local +Y and
 * which spans `planeLen` (local X) by `slopeLen` (local Z). Metal roofs get
 * standing-seam ribs running up the slope; shingle roofs get horizontal courses.
 * Designed to be nested inside a roof-plane mesh so it inherits its transform.
 */
function RoofPlaneDetail({
  planeLen,
  slopeLen,
  roofingType,
}: {
  planeLen: number
  slopeLen: number
  roofingType: Project['roofing']['type']
}) {
  const lines = useMemo(() => {
    const out: Array<{ key: string; position: [number, number, number]; size: [number, number, number] }> = []
    if (roofingType === 'metal') {
      evenInteriorPositions(planeLen, 1.5).forEach((x, i) => {
        out.push({ key: `seam-${i}`, position: [x, 0.11, 0], size: [0.05, 0.1, slopeLen] })
      })
    } else {
      evenInteriorPositions(slopeLen, 1).forEach((z, i) => {
        out.push({ key: `course-${i}`, position: [0, 0.085, z], size: [planeLen, 0.04, 0.06] })
      })
    }
    return out
  }, [planeLen, slopeLen, roofingType])

  const isMetal = roofingType === 'metal'
  return (
    <group>
      {lines.map((l) => (
        <mesh key={l.key} position={l.position}>
          <boxGeometry args={l.size} />
          <meshStandardMaterial
            color={isMetal ? '#8a99a6' : '#332f2a'}
            metalness={isMetal ? 0.6 : 0.05}
            roughness={isMetal ? 0.3 : 0.95}
          />
        </mesh>
      ))}
    </group>
  )
}

function RoofMesh({
  roofType,
  roofingType,
  lengthFt,
  widthFt,
  wallHeightFt,
  pitchRad,
}: {
  roofType: Project['roof']['type']
  roofingType: Project['roofing']['type']
  lengthFt: number
  widthFt: number
  wallHeightFt: number
  pitchRad: number
}) {
  const halfW = widthFt / 2
  const halfL = lengthFt / 2
  const rise = Math.tan(pitchRad) * halfW
  const shedRise = Math.tan(pitchRad) * widthFt
  const roofStyle = ROOFING_STYLE[roofingType]

  const hipGeo = useMemo(() => {
    const ridgeHalfLen = Math.max(0, halfL - halfW)
    const positions: number[] = [
      // Front face (trapezoid)
      -halfL, 0, halfW, halfL, 0, halfW, ridgeHalfLen, rise, 0,
      -halfL, 0, halfW, ridgeHalfLen, rise, 0, -ridgeHalfLen, rise, 0,
      // Back face (trapezoid)
      halfL, 0, -halfW, -halfL, 0, -halfW, -ridgeHalfLen, rise, 0,
      halfL, 0, -halfW, -ridgeHalfLen, rise, 0, ridgeHalfLen, rise, 0,
      // Left hip end (triangle)
      -halfL, 0, halfW, -ridgeHalfLen, rise, 0, -halfL, 0, -halfW,
      // Right hip end (triangle)
      halfL, 0, -halfW, ridgeHalfLen, rise, 0, halfL, 0, halfW,
    ]
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.computeVertexNormals()
    return geo
  }, [halfL, halfW, rise])

  const shedSideGeos = useMemo(() => {
    const verts = [0, 0, halfW, 0, 0, -halfW, 0, shedRise, -halfW]
    const makeGeo = () => {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
      geo.computeVertexNormals()
      return geo
    }
    return [makeGeo(), makeGeo()]
  }, [halfW, shedRise])

  if (roofType === 'flat') {
    return (
      <group position={[0, wallHeightFt + 0.08, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[lengthFt, widthFt]} />
          <meshStandardMaterial
            color={roofStyle.color}
            metalness={roofStyle.metalness}
            roughness={roofStyle.roughness}
            side={THREE.DoubleSide}
          />
        </mesh>
        <RoofPlaneDetail planeLen={lengthFt} slopeLen={widthFt} roofingType={roofingType} />
      </group>
    )
  }

  if (roofType === 'shed') {
    const slopeLen = widthFt / Math.cos(pitchRad)
    return (
      <group position={[0, wallHeightFt, 0]}>
        <mesh position={[0, shedRise / 2, 0]} rotation={[pitchRad, 0, 0]} castShadow>
          <boxGeometry args={[lengthFt, 0.12, slopeLen]} />
          <meshStandardMaterial
            color={roofStyle.color}
            metalness={roofStyle.metalness}
            roughness={roofStyle.roughness}
            side={THREE.DoubleSide}
          />
          <RoofPlaneDetail planeLen={lengthFt} slopeLen={slopeLen} roofingType={roofingType} />
        </mesh>
        <mesh position={[0, shedRise / 2, -halfW + WALL_THICKNESS / 2]} castShadow>
          <boxGeometry args={[lengthFt, shedRise, WALL_THICKNESS]} />
          <meshStandardMaterial color="#e8e0d4" side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={shedSideGeos[0]} position={[halfL - WALL_THICKNESS / 2, 0, 0]}>
          <meshStandardMaterial color="#ddd4c8" side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={shedSideGeos[1]} position={[-halfL + WALL_THICKNESS / 2, 0, 0]}>
          <meshStandardMaterial color="#ddd4c8" side={THREE.DoubleSide} />
        </mesh>
      </group>
    )
  }

  if (roofType === 'hip') {
    return (
      <group position={[0, wallHeightFt, 0]}>
        <mesh geometry={hipGeo} castShadow>
          <meshStandardMaterial
            color={roofStyle.color}
            metalness={roofStyle.metalness}
            roughness={roofStyle.roughness}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    )
  }

  // Gable roof
  const slopeLen = halfW / Math.cos(pitchRad)
  return (
    <group position={[0, wallHeightFt, 0]}>
      <mesh position={[0, rise / 2, halfW / 2]} rotation={[pitchRad, 0, 0]} castShadow>
        <boxGeometry args={[lengthFt, 0.12, slopeLen]} />
        <meshStandardMaterial
          color={roofStyle.color}
          metalness={roofStyle.metalness}
          roughness={roofStyle.roughness}
          side={THREE.DoubleSide}
        />
        <RoofPlaneDetail planeLen={lengthFt} slopeLen={slopeLen} roofingType={roofingType} />
      </mesh>
      <mesh position={[0, rise / 2, -halfW / 2]} rotation={[-pitchRad, 0, 0]} castShadow>
        <boxGeometry args={[lengthFt, 0.12, slopeLen]} />
        <meshStandardMaterial
          color={roofStyle.color}
          metalness={roofStyle.metalness}
          roughness={roofStyle.roughness}
          side={THREE.DoubleSide}
        />
        <RoofPlaneDetail planeLen={lengthFt} slopeLen={slopeLen} roofingType={roofingType} />
      </mesh>
    </group>
  )
}

function WallHeightHandle({
  wallHeightFt,
  halfL,
  onChange,
}: {
  wallHeightFt: number
  halfL: number
  onChange: (h: number) => void
}) {
  const orbitRef = useContext(OrbitRef)
  const dragState = useRef<{ active: boolean; startY: number; startH: number }>({
    active: false,
    startY: 0,
    startH: wallHeightFt,
  })
  const { gl } = useThree()

  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    const startY = e.clientY
    const startH = wallHeightFt
    dragState.current = { active: true, startY, startH }
    document.body.style.cursor = 'ns-resize'

    if (orbitRef.current) {
      orbitRef.current.enabled = false
    }

    gl.domElement.setPointerCapture(e.pointerId)

    function onMove(ev: PointerEvent) {
      const dy = ev.clientY - startY
      onChange(wallHeightFromDragDelta(startH, dy, PIXELS_PER_FOOT_DRAG))
    }

    function onUp(ev: PointerEvent) {
      dragState.current.active = false
      document.body.style.cursor = ''
      if (orbitRef.current) {
        orbitRef.current.enabled = true
      }
      gl.domElement.releasePointerCapture(ev.pointerId)
      gl.domElement.removeEventListener('pointermove', onMove)
      gl.domElement.removeEventListener('pointerup', onUp)
    }

    gl.domElement.addEventListener('pointermove', onMove)
    gl.domElement.addEventListener('pointerup', onUp)
  }

  return (
    <group position={[0, wallHeightFt, 0]}>
      <mesh
        position={[halfL + 1.5, 0, 0]}
        onPointerDown={onPointerDown}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          if (!dragState.current.active) document.body.style.cursor = 'ns-resize'
        }}
        onPointerOut={() => {
          if (!dragState.current.active) document.body.style.cursor = ''
        }}
      >
        <torusGeometry args={[1.2, 0.15, 12, 32]} />
        <meshStandardMaterial color="#2d6a4f" emissive="#1b4332" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[halfL + 1.5, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#40916c" />
      </mesh>
    </group>
  )
}
