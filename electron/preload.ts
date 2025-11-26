import { contextBridge, ipcRenderer } from 'electron'

// Type definitions for zoom follow cursor
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

contextBridge.exposeInMainWorld('electronAPI', {
  getAssetBasePath: async () => {
    // ask main process for the correct base path (production vs dev)
    return await ipcRenderer.invoke('get-asset-base-path')
  },
  getSources: async (opts: Electron.SourcesOptions) => {
    return await ipcRenderer.invoke('get-sources', opts)
  },
  switchToEditor: () => {
    return ipcRenderer.invoke('switch-to-editor')
  },
  openSourceSelector: () => {
    return ipcRenderer.invoke('open-source-selector')
  },
  selectSource: (source: unknown) => {
    return ipcRenderer.invoke('select-source', source)
  },
  getSelectedSource: () => {
    return ipcRenderer.invoke('get-selected-source')
  },

  storeRecordedVideo: (videoData: ArrayBuffer, fileName: string) => {
    return ipcRenderer.invoke('store-recorded-video', videoData, fileName)
  },

  getRecordedVideoPath: () => {
    return ipcRenderer.invoke('get-recorded-video-path')
  },
  setRecordingState: (recording: boolean) => {
    return ipcRenderer.invoke('set-recording-state', recording)
  },
  onStopRecordingFromTray: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('stop-recording-from-tray', listener)
    return () => ipcRenderer.removeListener('stop-recording-from-tray', listener)
  },
  openExternalUrl: (url: string) => {
    return ipcRenderer.invoke('open-external-url', url)
  },
  saveExportedVideo: (videoData: ArrayBuffer, fileName: string) => {
    return ipcRenderer.invoke('save-exported-video', videoData, fileName)
  },
  // Window control methods for Windows (frameless window)
  minimizeWindow: () => {
    return ipcRenderer.invoke('minimize-window')
  },
  maximizeWindow: () => {
    return ipcRenderer.invoke('maximize-window')
  },
  closeWindow: () => {
    return ipcRenderer.invoke('close-window')
  },
  getPlatform: () => {
    return ipcRenderer.invoke('get-platform')
  },

  // Zoom follow cursor APIs
  getCursorPosition: (): Promise<CursorPosition> => {
    return ipcRenderer.invoke('get-cursor-position')
  },
  setZoomFollowState: (state: Partial<ZoomFollowState>): Promise<ZoomFollowState> => {
    return ipcRenderer.invoke('set-zoom-follow-state', state)
  },
  getZoomFollowState: (): Promise<ZoomFollowState> => {
    return ipcRenderer.invoke('get-zoom-follow-state')
  },
  getDisplayInfo: (): Promise<{ primary: DisplayInfo; all: DisplayInfo[] }> => {
    return ipcRenderer.invoke('get-display-info')
  }
})