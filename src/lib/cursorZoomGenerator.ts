import type { ZoomRegion, ZoomDepth, ZoomFocus } from '../components/video-editor/types'

export interface CursorDataPoint {
  timestamp: number
  x: number
  y: number
}

export interface RecordingCursorData {
  version: number
  duration: number
  zoomFollowEnabled: boolean
  dataPoints: CursorDataPoint[]
}

export interface GenerateZoomOptions {
  minDuration?: number      // Minimum duration for a zoom region (ms)
  maxDuration?: number      // Maximum duration for a zoom region (ms)
  movementThreshold?: number // Threshold for significant movement (normalized 0-1)
  defaultDepth?: ZoomDepth  // Default zoom depth
  clusterRadius?: number    // Radius to cluster nearby points (normalized 0-1)
}

const DEFAULT_OPTIONS: Required<GenerateZoomOptions> = {
  minDuration: 500,      // 500ms minimum
  maxDuration: 10000,    // 10s maximum  
  movementThreshold: 0.05, // 5% of screen movement triggers new region
  defaultDepth: 3,
  clusterRadius: 0.08    // 8% of screen
}

/**
 * Threshold for detecting stationary cursor movement (normalized distance per ms).
 * This value represents very slow movement - approximately 0.005% of screen width per ms,
 * or about 0.1 pixels per second on a 1920px screen.
 */
const STATIONARY_VELOCITY_THRESHOLD = 0.00005

/**
 * Calculate the Euclidean distance between two points
 */
function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

/**
 * Calculate the velocity of cursor movement between two points
 */
function velocity(p1: CursorDataPoint, p2: CursorDataPoint): number {
  const dist = distance(p1, p2)
  const timeDiff = p2.timestamp - p1.timestamp
  if (timeDiff === 0) return 0
  return dist / timeDiff
}

/**
 * Detect regions where cursor is relatively stationary (slow movement)
 * and generate zoom regions for those areas
 */
export function generateZoomRegionsFromCursorData(
  cursorData: RecordingCursorData,
  options: GenerateZoomOptions = {}
): ZoomRegion[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { dataPoints } = cursorData
  
  if (dataPoints.length < 10) {
    // Not enough data to generate meaningful zooms
    return []
  }

  const zoomRegions: ZoomRegion[] = []
  let regionIdCounter = 1

  // Use a sliding window to detect periods of low movement
  let regionStart: CursorDataPoint | null = null
  let regionPoints: CursorDataPoint[] = []
  let isInStationaryRegion = false

  for (let i = 1; i < dataPoints.length; i++) {
    const prev = dataPoints[i - 1]
    const curr = dataPoints[i]
    
    // Calculate velocity (movement speed)
    const vel = velocity(prev, curr)
    
    // Check if cursor is moving slowly (stationary region)
    const isStationary = vel < opts.movementThreshold / 1000 // Normalize per ms
    
    if (isStationary && !isInStationaryRegion) {
      // Start of a stationary region
      isInStationaryRegion = true
      regionStart = prev
      regionPoints = [prev, curr]
    } else if (isStationary && isInStationaryRegion) {
      // Continue stationary region
      regionPoints.push(curr)
    } else if (!isStationary && isInStationaryRegion) {
      // End of stationary region
      if (regionStart && regionPoints.length > 0) {
        const lastPoint = regionPoints[regionPoints.length - 1]
        const duration = lastPoint.timestamp - regionStart.timestamp
        
        // Only create zoom if duration is within bounds
        if (duration >= opts.minDuration && duration <= opts.maxDuration) {
          // Calculate center point (average of all points in region)
          const avgX = regionPoints.reduce((sum, p) => sum + p.x, 0) / regionPoints.length
          const avgY = regionPoints.reduce((sum, p) => sum + p.y, 0) / regionPoints.length
          
          const focus: ZoomFocus = { cx: avgX, cy: avgY }
          
          zoomRegions.push({
            id: `auto-zoom-${regionIdCounter++}`,
            startMs: regionStart.timestamp,
            endMs: lastPoint.timestamp,
            depth: opts.defaultDepth,
            focus
          })
        }
      }
      
      isInStationaryRegion = false
      regionStart = null
      regionPoints = []
    }
  }

  // Handle case where recording ends in a stationary region
  if (isInStationaryRegion && regionStart && regionPoints.length > 0) {
    const lastPoint = regionPoints[regionPoints.length - 1]
    const duration = lastPoint.timestamp - regionStart.timestamp
    
    if (duration >= opts.minDuration && duration <= opts.maxDuration) {
      const avgX = regionPoints.reduce((sum, p) => sum + p.x, 0) / regionPoints.length
      const avgY = regionPoints.reduce((sum, p) => sum + p.y, 0) / regionPoints.length
      
      const focus: ZoomFocus = { cx: avgX, cy: avgY }
      
      zoomRegions.push({
        id: `auto-zoom-${regionIdCounter++}`,
        startMs: regionStart.timestamp,
        endMs: lastPoint.timestamp,
        depth: opts.defaultDepth,
        focus
      })
    }
  }

  // Merge overlapping or very close zoom regions
  return mergeCloseRegions(zoomRegions, opts.clusterRadius)
}

/**
 * Merge zoom regions that are very close together
 */
function mergeCloseRegions(regions: ZoomRegion[], threshold: number): ZoomRegion[] {
  if (regions.length <= 1) return regions
  
  // Sort by start time
  const sorted = [...regions].sort((a, b) => a.startMs - b.startMs)
  const merged: ZoomRegion[] = []
  
  let current = sorted[0]
  
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]
    
    // Check if regions are close enough to merge
    const timeBetween = next.startMs - current.endMs
    const focusDistance = distance(
      { x: current.focus.cx, y: current.focus.cy }, 
      { x: next.focus.cx, y: next.focus.cy }
    )
    
    if (timeBetween < 500 && focusDistance < threshold) {
      // Merge regions
      const totalDuration = next.endMs - current.startMs
      const currentWeight = (current.endMs - current.startMs) / totalDuration
      const nextWeight = 1 - currentWeight
      
      current = {
        ...current,
        endMs: next.endMs,
        focus: {
          cx: current.focus.cx * currentWeight + next.focus.cx * nextWeight,
          cy: current.focus.cy * currentWeight + next.focus.cy * nextWeight
        },
        depth: Math.max(current.depth, next.depth) as ZoomDepth
      }
    } else {
      merged.push(current)
      current = next
    }
  }
  
  merged.push(current)
  return merged
}

/**
 * Analyze cursor data to detect if auto-zoom would be beneficial
 */
export function shouldAutoGenerateZooms(cursorData: RecordingCursorData): boolean {
  if (!cursorData.zoomFollowEnabled) return false
  if (cursorData.dataPoints.length < 20) return false
  
  // Check if there's enough movement variety
  const { dataPoints } = cursorData
  let totalMovement = 0
  let stationaryTime = 0
  
  for (let i = 1; i < dataPoints.length; i++) {
    const prev = dataPoints[i - 1]
    const curr = dataPoints[i]
    const dist = distance(prev, curr)
    const timeDiff = curr.timestamp - prev.timestamp
    
    totalMovement += dist
    
    // Count as stationary if movement is less than threshold
    if (dist / timeDiff < STATIONARY_VELOCITY_THRESHOLD) {
      stationaryTime += timeDiff
    }
  }
  
  const duration = cursorData.duration
  const stationaryRatio = stationaryTime / duration
  
  // Only suggest auto-zoom if there's a good mix of movement and stationary periods
  return stationaryRatio > 0.2 && stationaryRatio < 0.8 && totalMovement > 0.5
}
