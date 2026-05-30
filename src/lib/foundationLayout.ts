import type { FoundationConfig, FoundationType, PierLayout, PostSize, Project } from '../types/project'

export function foundationUsesPierLayout(type: FoundationType): boolean {
  return type === 'pier_beam' || type === 'timber_pier'
}

const DEFAULT_MAX_SPAN: Record<PostSize, number> = {
  '4x4': 6,
  '6x6': 8,
}

export function defaultMaxSpanFt(postSize: PostSize): number {
  return DEFAULT_MAX_SPAN[postSize]
}

export function postCountForDimension(dimensionFt: number, maxSpanFt: number): number {
  if (dimensionFt <= 0 || maxSpanFt <= 0) return 2
  return Math.max(2, Math.ceil(dimensionFt / maxSpanFt) + 1)
}

export function spacingForDimension(dimensionFt: number, count: number): number {
  if (count <= 1) return dimensionFt
  return dimensionFt / (count - 1)
}

export function resolveMaxSpanFt(foundation: FoundationConfig): number {
  const postSize = foundation.postSize ?? '6x6'
  if (foundation.maxSpanFt != null && foundation.maxSpanFt > 0) {
    return foundation.maxSpanFt
  }
  return defaultMaxSpanFt(postSize)
}

export function computePierLayout(project: Project): PierLayout | null {
  if (!foundationUsesPierLayout(project.foundation.type)) return null

  const postSize = project.foundation.postSize ?? '6x6'
  const maxSpanFt = resolveMaxSpanFt(project.foundation)
  const { lengthFt, widthFt } = project.footprint

  const isTimberPier = project.foundation.type === 'timber_pier'
  const cols = postCountForDimension(lengthFt, maxSpanFt)
  const rows = isTimberPier ? 2 : postCountForDimension(widthFt, maxSpanFt)
  const spacingLengthFt = spacingForDimension(lengthFt, cols)
  const spacingWidthFt = isTimberPier
    ? widthFt
    : spacingForDimension(widthFt, rows)

  const posts: PierLayout['posts'] = []
  if (isTimberPier) {
    for (let col = 0; col < cols; col++) {
      const xFt = col * spacingLengthFt
      posts.push({ xFt, yFt: 0 })
      posts.push({ xFt, yFt: widthFt })
    }
  } else {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        posts.push({
          xFt: col * spacingLengthFt,
          yFt: row * spacingWidthFt,
        })
      }
    }
  }

  return {
    posts,
    rows,
    cols,
    spacingLengthFt,
    spacingWidthFt,
    postCount: posts.length,
    postSize,
    maxSpanFt,
  }
}
