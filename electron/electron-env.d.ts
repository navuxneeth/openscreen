/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Zoom follow cursor types
interface CursorPosition {
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

interface ZoomFollowState {
  enabled: boolean
  zoomLevel: number
  followSpeed: number
  smoothing: number
}

interface DisplayInfo {
  id: number
  width: number
  height: number
  x: number
  y: number
  scaleFactor: number
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  electronAPI: {
    getSources: (opts: Electron.SourcesOptions) => Promise<ProcessedDesktopSource[]>
    switchToEditor: () => Promise<void>
    openSourceSelector: () => Promise<void>
    selectSource: (source: ProcessedDesktopSource) => Promise<ProcessedDesktopSource>
    getSelectedSource: () => Promise<ProcessedDesktopSource | null>
    storeRecordedVideo: (videoData: ArrayBuffer, fileName: string) => Promise<{ success: boolean; path?: string; message?: string }>

    getRecordedVideoPath: () => Promise<{ success: boolean; path?: string; message?: string }>
    setRecordingState: (recording: boolean) => Promise<void>
    onStopRecordingFromTray: (callback: () => void) => () => void
    openExternalUrl: (url: string) => Promise<{ success: boolean; error?: string }>
    saveExportedVideo: (videoData: ArrayBuffer, fileName: string) => Promise<{ success: boolean; path?: string; message?: string }>
    getAssetBasePath: () => Promise<string | null>
    // Window control methods for Windows
    minimizeWindow: () => Promise<void>
    maximizeWindow: () => Promise<void>
    closeWindow: () => Promise<void>
    getPlatform: () => Promise<string>
    // Zoom follow cursor methods
    getCursorPosition: () => Promise<CursorPosition>
    setZoomFollowState: (state: Partial<ZoomFollowState>) => Promise<ZoomFollowState>
    getZoomFollowState: () => Promise<ZoomFollowState>
    getDisplayInfo: () => Promise<{ primary: DisplayInfo; all: DisplayInfo[] }>
  }
}

interface ProcessedDesktopSource {
  id: string
  name: string
  display_id: string
  thumbnail: string | null
  appIcon: string | null
}
