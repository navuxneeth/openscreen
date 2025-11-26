"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  getAssetBasePath: async () => {
    return await electron.ipcRenderer.invoke("get-asset-base-path");
  },
  getSources: async (opts) => {
    return await electron.ipcRenderer.invoke("get-sources", opts);
  },
  switchToEditor: () => {
    return electron.ipcRenderer.invoke("switch-to-editor");
  },
  openSourceSelector: () => {
    return electron.ipcRenderer.invoke("open-source-selector");
  },
  selectSource: (source) => {
    return electron.ipcRenderer.invoke("select-source", source);
  },
  getSelectedSource: () => {
    return electron.ipcRenderer.invoke("get-selected-source");
  },
  storeRecordedVideo: (videoData, fileName) => {
    return electron.ipcRenderer.invoke("store-recorded-video", videoData, fileName);
  },
  getRecordedVideoPath: () => {
    return electron.ipcRenderer.invoke("get-recorded-video-path");
  },
  setRecordingState: (recording) => {
    return electron.ipcRenderer.invoke("set-recording-state", recording);
  },
  onStopRecordingFromTray: (callback) => {
    const listener = () => callback();
    electron.ipcRenderer.on("stop-recording-from-tray", listener);
    return () => electron.ipcRenderer.removeListener("stop-recording-from-tray", listener);
  },
  openExternalUrl: (url) => {
    return electron.ipcRenderer.invoke("open-external-url", url);
  },
  saveExportedVideo: (videoData, fileName) => {
    return electron.ipcRenderer.invoke("save-exported-video", videoData, fileName);
  },
  // Window control methods for Windows (frameless window)
  minimizeWindow: () => {
    return electron.ipcRenderer.invoke("minimize-window");
  },
  maximizeWindow: () => {
    return electron.ipcRenderer.invoke("maximize-window");
  },
  closeWindow: () => {
    return electron.ipcRenderer.invoke("close-window");
  },
  getPlatform: () => {
    return electron.ipcRenderer.invoke("get-platform");
  },
  // Zoom follow cursor APIs
  getCursorPosition: () => {
    return electron.ipcRenderer.invoke("get-cursor-position");
  },
  setZoomFollowState: (state) => {
    return electron.ipcRenderer.invoke("set-zoom-follow-state", state);
  },
  getZoomFollowState: () => {
    return electron.ipcRenderer.invoke("get-zoom-follow-state");
  },
  getDisplayInfo: () => {
    return electron.ipcRenderer.invoke("get-display-info");
  }
});
