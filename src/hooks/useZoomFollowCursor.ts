import { useState, useRef, useCallback, useEffect } from 'react'

export interface ZoomFollowState {
  enabled: boolean
  zoomLevel: number
  followSpeed: number
  smoothing: number
}

export interface CursorPosition {
  x: number
  y: number
  relativeX: number
  relativeY: number
  normalizedX: number
  normalizedY: number
  displayWidth: number
  displayHeight: number
  displayId: number
}

interface ZoomTarget {
  x: number
  y: number
  scale: number
}

interface UseZoomFollowCursorOptions {
  onZoomChange?: (zoom: ZoomTarget) => void
  pollingInterval?: number
  safeZoneSensitivity?: number // Normalized 0-1, how much cursor must move to exit safe zone
}

interface UseZoomFollowCursorReturn {
  zoomState: ZoomFollowState
  currentZoom: ZoomTarget
  isZooming: boolean
  toggleZoom: () => void
  setZoomLevel: (level: number) => void
  setFollowSpeed: (speed: number) => void
  setSmoothing: (smoothing: number) => void
  startTracking: () => void
  stopTracking: () => void
  cursorPosition: CursorPosition | null
}

const DEFAULT_ZOOM_STATE: ZoomFollowState = {
  enabled: false,
  zoomLevel: 2.0,
  followSpeed: 0.15,
  smoothing: 0.1
}

const DEFAULT_ZOOM_TARGET: ZoomTarget = {
  x: 0.5,
  y: 0.5,
  scale: 1.0
}

/**
 * Default safe zone sensitivity (5% of screen).
 * Cursor must move more than this distance from the safe zone center
 * to resume tracking and prevent jittery movement.
 */
const DEFAULT_SAFE_ZONE_SENSITIVITY = 0.05

/**
 * Linear interpolation helper
 */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

/**
 * Ease in/out function for smoother animations
 */
function easeInOut(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Hook for zoom and follow cursor functionality during screen recording
 * Based on the OBS zoom-to-mouse script behavior
 */
export function useZoomFollowCursor(
  options: UseZoomFollowCursorOptions = {}
): UseZoomFollowCursorReturn {
  const { 
    onZoomChange, 
    pollingInterval = 16,
    safeZoneSensitivity = DEFAULT_SAFE_ZONE_SENSITIVITY 
  } = options // ~60fps

  const [zoomState, setZoomState] = useState<ZoomFollowState>(DEFAULT_ZOOM_STATE)
  const [currentZoom, setCurrentZoom] = useState<ZoomTarget>(DEFAULT_ZOOM_TARGET)
  const [isZooming, setIsZooming] = useState(false)
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null)

  // Refs for animation state
  const animationFrameRef = useRef<number | null>(null)
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const targetZoomRef = useRef<ZoomTarget>(DEFAULT_ZOOM_TARGET)
  const currentZoomRef = useRef<ZoomTarget>(DEFAULT_ZOOM_TARGET)
  const isTrackingRef = useRef(false)
  const zoomTimeRef = useRef(0)
  const isZoomingInRef = useRef(false)
  const isZoomingOutRef = useRef(false)

  // Safe zone to prevent jittery movement when cursor is near center
  const safeZoneRef = useRef<{ x: number; y: number } | null>(null)

  /**
   * Get current cursor position from Electron
   */
  const fetchCursorPosition = useCallback(async (): Promise<CursorPosition | null> => {
    try {
      if (window.electronAPI?.getCursorPosition) {
        const pos = await window.electronAPI.getCursorPosition()
        return pos
      }
    } catch (error) {
      console.error('Failed to get cursor position:', error)
    }
    return null
  }, [])

  /**
   * Calculate the zoom target based on cursor position
   */
  const calculateZoomTarget = useCallback(
    (cursor: CursorPosition, zoomLevel: number): ZoomTarget => {
      // Calculate the visible area when zoomed
      const visibleWidth = 1 / zoomLevel
      const visibleHeight = 1 / zoomLevel

      // Center the zoom on the cursor, but clamp to keep within bounds
      const halfVisibleWidth = visibleWidth / 2
      const halfVisibleHeight = visibleHeight / 2

      // The center position should be clamped so the visible area stays in bounds
      const centerX = clamp(cursor.normalizedX, halfVisibleWidth, 1 - halfVisibleWidth)
      const centerY = clamp(cursor.normalizedY, halfVisibleHeight, 1 - halfVisibleHeight)

      return {
        x: centerX,
        y: centerY,
        scale: zoomLevel
      }
    },
    []
  )

  /**
   * Animation loop for smooth zoom transitions
   */
  const animateZoom = useCallback(() => {
    const target = targetZoomRef.current
    const current = currentZoomRef.current
    const state = zoomState

    if (isZoomingInRef.current || isZoomingOutRef.current) {
      // Animate zoom in/out transition
      zoomTimeRef.current += state.followSpeed
      const t = easeInOut(clamp(zoomTimeRef.current, 0, 1))

      const targetScale = isZoomingInRef.current ? state.zoomLevel : 1
      const newScale = lerp(current.scale, targetScale, t)
      const newX = lerp(current.x, target.x, t)
      const newY = lerp(current.y, target.y, t)

      const newZoom: ZoomTarget = { x: newX, y: newY, scale: newScale }
      currentZoomRef.current = newZoom
      setCurrentZoom(newZoom)
      onZoomChange?.(newZoom)

      if (zoomTimeRef.current >= 1) {
        if (isZoomingInRef.current) {
          isZoomingInRef.current = false
          setIsZooming(true)
        } else if (isZoomingOutRef.current) {
          isZoomingOutRef.current = false
          setIsZooming(false)
        }
        zoomTimeRef.current = 0
      }
    } else if (isTrackingRef.current && zoomState.enabled) {
      // Follow cursor with smooth interpolation
      const dx = target.x - current.x
      const dy = target.y - current.y

      // Check if cursor is in safe zone
      if (safeZoneRef.current) {
        const safeDx = Math.abs(target.x - safeZoneRef.current.x)
        const safeDy = Math.abs(target.y - safeZoneRef.current.y)

        // If cursor moved outside safe zone, resume tracking
        if (safeDx > safeZoneSensitivity || safeDy > safeZoneSensitivity) {
          safeZoneRef.current = null
        } else {
          // Stay in safe zone, don't move
          animationFrameRef.current = requestAnimationFrame(animateZoom)
          return
        }
      }

      // Apply smooth interpolation
      const speed = state.smoothing
      const newX = current.x + dx * speed
      const newY = current.y + dy * speed

      // Check if we've reached the target (create safe zone)
      const distanceX = Math.abs(target.x - newX)
      const distanceY = Math.abs(target.y - newY)
      if (distanceX < 0.001 && distanceY < 0.001) {
        safeZoneRef.current = { x: target.x, y: target.y }
      }

      const newZoom: ZoomTarget = { x: newX, y: newY, scale: current.scale }
      currentZoomRef.current = newZoom
      setCurrentZoom(newZoom)
      onZoomChange?.(newZoom)
    }

    if (isTrackingRef.current || isZoomingInRef.current || isZoomingOutRef.current) {
      animationFrameRef.current = requestAnimationFrame(animateZoom)
    }
  }, [zoomState, onZoomChange])

  /**
   * Start cursor tracking
   */
  const startTracking = useCallback(() => {
    if (isTrackingRef.current) return

    isTrackingRef.current = true

    // Poll cursor position
    trackingIntervalRef.current = setInterval(async () => {
      const cursor = await fetchCursorPosition()
      if (cursor) {
        setCursorPosition(cursor)
        if (zoomState.enabled) {
          const target = calculateZoomTarget(cursor, zoomState.zoomLevel)
          targetZoomRef.current = target
        }
      }
    }, pollingInterval)

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animateZoom)
  }, [fetchCursorPosition, calculateZoomTarget, zoomState, pollingInterval, animateZoom])

  /**
   * Stop cursor tracking
   */
  const stopTracking = useCallback(() => {
    isTrackingRef.current = false

    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current)
      trackingIntervalRef.current = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  /**
   * Toggle zoom on/off
   */
  const toggleZoom = useCallback(async () => {
    if (!zoomState.enabled) {
      // Zoom in
      const cursor = await fetchCursorPosition()
      if (cursor) {
        const target = calculateZoomTarget(cursor, zoomState.zoomLevel)
        targetZoomRef.current = target
      }

      setZoomState(prev => ({ ...prev, enabled: true }))
      zoomTimeRef.current = 0
      isZoomingInRef.current = true
      isZoomingOutRef.current = false
      safeZoneRef.current = null

      // Sync with electron
      if (window.electronAPI?.setZoomFollowState) {
        await window.electronAPI.setZoomFollowState({ enabled: true })
      }
    } else {
      // Zoom out
      targetZoomRef.current = { x: 0.5, y: 0.5, scale: 1 }
      setZoomState(prev => ({ ...prev, enabled: false }))
      zoomTimeRef.current = 0
      isZoomingInRef.current = false
      isZoomingOutRef.current = true
      safeZoneRef.current = null

      // Sync with electron
      if (window.electronAPI?.setZoomFollowState) {
        await window.electronAPI.setZoomFollowState({ enabled: false })
      }
    }
  }, [zoomState, fetchCursorPosition, calculateZoomTarget])

  /**
   * Set zoom level
   */
  const setZoomLevel = useCallback(async (level: number) => {
    const clampedLevel = clamp(level, 1.25, 5)
    setZoomState(prev => ({ ...prev, zoomLevel: clampedLevel }))

    if (window.electronAPI?.setZoomFollowState) {
      await window.electronAPI.setZoomFollowState({ zoomLevel: clampedLevel })
    }
  }, [])

  /**
   * Set follow speed
   */
  const setFollowSpeed = useCallback(async (speed: number) => {
    const clampedSpeed = clamp(speed, 0.01, 1)
    setZoomState(prev => ({ ...prev, followSpeed: clampedSpeed }))

    if (window.electronAPI?.setZoomFollowState) {
      await window.electronAPI.setZoomFollowState({ followSpeed: clampedSpeed })
    }
  }, [])

  /**
   * Set smoothing
   */
  const setSmoothing = useCallback(async (smoothing: number) => {
    const clampedSmoothing = clamp(smoothing, 0.01, 1)
    setZoomState(prev => ({ ...prev, smoothing: clampedSmoothing }))

    if (window.electronAPI?.setZoomFollowState) {
      await window.electronAPI.setZoomFollowState({ smoothing: clampedSmoothing })
    }
  }, [])

  // Load initial state from electron
  useEffect(() => {
    async function loadState() {
      if (window.electronAPI?.getZoomFollowState) {
        try {
          const state = await window.electronAPI.getZoomFollowState()
          setZoomState(state)
        } catch (error) {
          console.error('Failed to load zoom follow state:', error)
        }
      }
    }
    loadState()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking()
    }
  }, [stopTracking])

  return {
    zoomState,
    currentZoom,
    isZooming,
    toggleZoom,
    setZoomLevel,
    setFollowSpeed,
    setSmoothing,
    startTracking,
    stopTracking,
    cursorPosition
  }
}
