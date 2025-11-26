import { ipcMain, desktopCapturer, BrowserWindow, shell, app, screen } from 'electron'

import fs from 'node:fs/promises'
import path from 'node:path'
import { RECORDINGS_DIR } from '../main'

// Zoom follow cursor state management
interface ZoomFollowState {
  enabled: boolean
  zoomLevel: number
  followSpeed: number
  smoothing: number
}

let zoomFollowState: ZoomFollowState = {
  enabled: false,
  zoomLevel: 2.0,
  followSpeed: 0.15,
  smoothing: 0.1
}

interface SelectedSource {
  id: string
  name: string
  display_id?: string
  thumbnail?: string | null
  appIcon?: string | null
}

let selectedSource: SelectedSource | null = null

export function registerIpcHandlers(
  createEditorWindow: () => void,
  createSourceSelectorWindow: () => BrowserWindow,
  getMainWindow: () => BrowserWindow | null,
  getSourceSelectorWindow: () => BrowserWindow | null,
  onRecordingStateChange?: (recording: boolean, sourceName: string) => void
) {
  ipcMain.handle('get-sources', async (_, opts) => {
    const sources = await desktopCapturer.getSources(opts)
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      display_id: source.display_id,
      thumbnail: source.thumbnail ? source.thumbnail.toDataURL() : null,
      appIcon: source.appIcon ? source.appIcon.toDataURL() : null
    }))
  })

  ipcMain.handle('select-source', (_, source: SelectedSource) => {
    selectedSource = source
    const sourceSelectorWin = getSourceSelectorWindow()
    if (sourceSelectorWin) {
      sourceSelectorWin.close()
    }
    return selectedSource
  })

  ipcMain.handle('get-selected-source', () => {
    return selectedSource
  })

  ipcMain.handle('open-source-selector', () => {
    const sourceSelectorWin = getSourceSelectorWindow()
    if (sourceSelectorWin) {
      sourceSelectorWin.focus()
      return
    }
    createSourceSelectorWindow()
  })

  ipcMain.handle('switch-to-editor', () => {
    const mainWin = getMainWindow()
    if (mainWin) {
      mainWin.close()
    }
    createEditorWindow()
  })



  ipcMain.handle('store-recorded-video', async (_, videoData: ArrayBuffer, fileName: string) => {
    try {
      const videoPath = path.join(RECORDINGS_DIR, fileName)
      await fs.writeFile(videoPath, Buffer.from(videoData))
      return {
        success: true,
        path: videoPath,
        message: 'Video stored successfully'
      }
    } catch (error) {
      console.error('Failed to store video:', error)
      return {
        success: false,
        message: 'Failed to store video',
        error: String(error)
      }
    }
  })



  ipcMain.handle('get-recorded-video-path', async () => {
    try {
      const files = await fs.readdir(RECORDINGS_DIR)
      const videoFiles = files.filter(file => file.endsWith('.webm'))
      
      if (videoFiles.length === 0) {
        return { success: false, message: 'No recorded video found' }
      }
      
      const latestVideo = videoFiles.sort().reverse()[0]
      const videoPath = path.join(RECORDINGS_DIR, latestVideo)
      
      return { success: true, path: videoPath }
    } catch (error) {
      console.error('Failed to get video path:', error)
      return { success: false, message: 'Failed to get video path', error: String(error) }
    }
  })

  // Get cursor data for a recording (if available)
  ipcMain.handle('get-cursor-data', async () => {
    try {
      const files = await fs.readdir(RECORDINGS_DIR)
      const cursorFiles = files.filter(file => file.endsWith('-cursor.json'))
      
      if (cursorFiles.length === 0) {
        return { success: true, data: null, message: 'No cursor data found' }
      }
      
      // Get the latest cursor data file
      const latestCursorFile = cursorFiles.sort().reverse()[0]
      const cursorPath = path.join(RECORDINGS_DIR, latestCursorFile)
      
      const cursorDataRaw = await fs.readFile(cursorPath, 'utf-8')
      const cursorData = JSON.parse(cursorDataRaw)
      
      return { success: true, data: cursorData }
    } catch (error) {
      console.error('Failed to get cursor data:', error)
      return { success: false, data: null, message: 'Failed to get cursor data', error: String(error) }
    }
  })

  ipcMain.handle('set-recording-state', (_, recording: boolean) => {
    const source = selectedSource || { name: 'Screen' }
    if (onRecordingStateChange) {
      onRecordingStateChange(recording, source.name)
    }
  })

  ipcMain.handle('open-external-url', async (_, url: string) => {
    try {
      await shell.openExternal(url)
      return { success: true }
    } catch (error) {
      console.error('Failed to open URL:', error)
      return { success: false, error: String(error) }
    }
  })

  // Return base path for assets so renderer can resolve file:// paths in production
  ipcMain.handle('get-asset-base-path', () => {
    try {
      if (app.isPackaged) {
        return path.join(process.resourcesPath, 'assets')
      }
      return path.join(app.getAppPath(), 'public', 'assets')
    } catch (err) {
      console.error('Failed to resolve asset base path:', err)
      return null
    }
  })

  ipcMain.handle('save-exported-video', async (_, videoData: ArrayBuffer, fileName: string) => {
    try {
      const downloadsPath = app.getPath('downloads')
      const videoPath = path.join(downloadsPath, fileName)
      await fs.writeFile(videoPath, Buffer.from(videoData))
      
      return {
        success: true,
        path: videoPath,
        message: 'Video exported successfully'
      }
    } catch (error) {
      console.error('Failed to save exported video:', error)
      return {
        success: false,
        message: 'Failed to save exported video',
        error: String(error)
      }
    }
  })

  // Window control handlers for Windows frameless window
  ipcMain.handle('minimize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      win.minimize()
    }
  })

  ipcMain.handle('maximize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
  })

  ipcMain.handle('close-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      win.close()
    }
  })

  // Get current platform
  ipcMain.handle('get-platform', () => {
    return process.platform
  })

  // Zoom follow cursor handlers
  ipcMain.handle('get-cursor-position', () => {
    const point = screen.getCursorScreenPoint()
    const primaryDisplay = screen.getPrimaryDisplay()
    const displays = screen.getAllDisplays()
    
    // Find which display the cursor is on
    let currentDisplay = primaryDisplay
    for (const display of displays) {
      const bounds = display.bounds
      if (
        point.x >= bounds.x &&
        point.x < bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y < bounds.y + bounds.height
      ) {
        currentDisplay = display
        break
      }
    }
    
    // Calculate position relative to the current display
    const relativeX = point.x - currentDisplay.bounds.x
    const relativeY = point.y - currentDisplay.bounds.y
    
    // Normalize to 0-1 range
    const normalizedX = relativeX / currentDisplay.bounds.width
    const normalizedY = relativeY / currentDisplay.bounds.height
    
    return {
      x: point.x,
      y: point.y,
      relativeX,
      relativeY,
      normalizedX,
      normalizedY,
      displayWidth: currentDisplay.bounds.width,
      displayHeight: currentDisplay.bounds.height,
      displayId: currentDisplay.id
    }
  })

  ipcMain.handle('set-zoom-follow-state', (_, state: Partial<ZoomFollowState>) => {
    zoomFollowState = { ...zoomFollowState, ...state }
    return zoomFollowState
  })

  ipcMain.handle('get-zoom-follow-state', () => {
    return zoomFollowState
  })

  ipcMain.handle('get-display-info', () => {
    const primaryDisplay = screen.getPrimaryDisplay()
    const allDisplays = screen.getAllDisplays()
    
    return {
      primary: {
        id: primaryDisplay.id,
        width: primaryDisplay.bounds.width,
        height: primaryDisplay.bounds.height,
        x: primaryDisplay.bounds.x,
        y: primaryDisplay.bounds.y,
        scaleFactor: primaryDisplay.scaleFactor
      },
      all: allDisplays.map(d => ({
        id: d.id,
        width: d.bounds.width,
        height: d.bounds.height,
        x: d.bounds.x,
        y: d.bounds.y,
        scaleFactor: d.scaleFactor
      }))
    }
  })
}
