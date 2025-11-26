import { BrowserWindow as f, screen as D, ipcMain as i, desktopCapturer as j, shell as W, app as l, nativeImage as O, Tray as F, Menu as V } from "electron";
import { fileURLToPath as P } from "node:url";
import r from "node:path";
import p from "node:fs/promises";
const _ = r.dirname(P(import.meta.url)), k = r.join(_, ".."), w = process.env.VITE_DEV_SERVER_URL, v = r.join(k, "dist"), L = process.platform === "darwin", T = process.platform === "win32";
function C() {
  const e = new f({
    width: 250,
    height: 80,
    minWidth: 250,
    maxWidth: 250,
    minHeight: 80,
    maxHeight: 80,
    frame: !1,
    transparent: !0,
    resizable: !1,
    alwaysOnTop: !0,
    skipTaskbar: !0,
    hasShadow: !1,
    // Windows requires specific handling for transparent windows
    ...T && {
      backgroundMaterial: "none"
    },
    webPreferences: {
      preload: r.join(_, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      backgroundThrottling: !1
    }
  });
  return e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), w ? e.loadURL(w + "?windowType=hud-overlay") : e.loadFile(r.join(v, "index.html"), {
    query: { windowType: "hud-overlay" }
  }), e;
}
function U() {
  const e = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    transparent: !1,
    resizable: !0,
    alwaysOnTop: !1,
    skipTaskbar: !1,
    title: "OpenScreen",
    backgroundColor: "#000000",
    webPreferences: {
      preload: r.join(_, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1,
      backgroundThrottling: !1
    }
  };
  L ? (e.titleBarStyle = "hiddenInset", e.trafficLightPosition = { x: 12, y: 12 }) : T && (e.frame = !1, e.titleBarStyle = "hidden");
  const n = new f(e);
  return n.maximize(), n.webContents.on("did-finish-load", () => {
    n == null || n.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), w ? n.loadURL(w + "?windowType=editor") : n.loadFile(r.join(v, "index.html"), {
    query: { windowType: "editor" }
  }), n;
}
function z() {
  const { width: e, height: n } = D.getPrimaryDisplay().workAreaSize, m = {
    width: 620,
    height: 420,
    minHeight: 350,
    maxHeight: 500,
    x: Math.round((e - 620) / 2),
    y: Math.round((n - 420) / 2),
    frame: !1,
    resizable: !1,
    alwaysOnTop: !0,
    transparent: !0,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: r.join(_, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0
    }
  };
  T && (m.backgroundMaterial = "none");
  const d = new f(m);
  return w ? d.loadURL(w + "?windowType=source-selector") : d.loadFile(r.join(v, "index.html"), {
    query: { windowType: "source-selector" }
  }), d;
}
let b = null;
function M(e, n, m, d, g) {
  i.handle("get-sources", async (t, o) => (await j.getSources(o)).map((s) => ({
    id: s.id,
    name: s.name,
    display_id: s.display_id,
    thumbnail: s.thumbnail ? s.thumbnail.toDataURL() : null,
    appIcon: s.appIcon ? s.appIcon.toDataURL() : null
  }))), i.handle("select-source", (t, o) => {
    b = o;
    const a = d();
    return a && a.close(), b;
  }), i.handle("get-selected-source", () => b), i.handle("open-source-selector", () => {
    const t = d();
    if (t) {
      t.focus();
      return;
    }
    n();
  }), i.handle("switch-to-editor", () => {
    const t = m();
    t && t.close(), e();
  }), i.handle("store-recorded-video", async (t, o, a) => {
    try {
      const s = r.join(h, a);
      return await p.writeFile(s, Buffer.from(o)), {
        success: !0,
        path: s,
        message: "Video stored successfully"
      };
    } catch (s) {
      return console.error("Failed to store video:", s), {
        success: !1,
        message: "Failed to store video",
        error: String(s)
      };
    }
  }), i.handle("get-recorded-video-path", async () => {
    try {
      const o = (await p.readdir(h)).filter((R) => R.endsWith(".webm"));
      if (o.length === 0)
        return { success: !1, message: "No recorded video found" };
      const a = o.sort().reverse()[0];
      return { success: !0, path: r.join(h, a) };
    } catch (t) {
      return console.error("Failed to get video path:", t), { success: !1, message: "Failed to get video path", error: String(t) };
    }
  }), i.handle("set-recording-state", (t, o) => {
    g && g(o, (b || { name: "Screen" }).name);
  }), i.handle("open-external-url", async (t, o) => {
    try {
      return await W.openExternal(o), { success: !0 };
    } catch (a) {
      return console.error("Failed to open URL:", a), { success: !1, error: String(a) };
    }
  }), i.handle("get-asset-base-path", () => {
    try {
      return l.isPackaged ? r.join(process.resourcesPath, "assets") : r.join(l.getAppPath(), "public", "assets");
    } catch (t) {
      return console.error("Failed to resolve asset base path:", t), null;
    }
  }), i.handle("save-exported-video", async (t, o, a) => {
    try {
      const s = l.getPath("downloads"), R = r.join(s, a);
      return await p.writeFile(R, Buffer.from(o)), {
        success: !0,
        path: R,
        message: "Video exported successfully"
      };
    } catch (s) {
      return console.error("Failed to save exported video:", s), {
        success: !1,
        message: "Failed to save exported video",
        error: String(s)
      };
    }
  }), i.handle("minimize-window", (t) => {
    const o = f.fromWebContents(t.sender);
    o && o.minimize();
  }), i.handle("maximize-window", (t) => {
    const o = f.fromWebContents(t.sender);
    o && (o.isMaximized() ? o.unmaximize() : o.maximize());
  }), i.handle("close-window", (t) => {
    const o = f.fromWebContents(t.sender);
    o && o.close();
  }), i.handle("get-platform", () => process.platform);
}
const A = r.dirname(P(import.meta.url)), h = r.join(l.getPath("userData"), "recordings");
async function B() {
  try {
    const e = await p.readdir(h), n = Date.now(), m = 1 * 24 * 60 * 60 * 1e3;
    for (const d of e) {
      const g = r.join(h, d), t = await p.stat(g);
      n - t.mtimeMs > m && (await p.unlink(g), console.log(`Deleted old recording: ${d}`));
    }
  } catch (e) {
    console.error("Failed to cleanup old recordings:", e);
  }
}
async function H() {
  try {
    await p.mkdir(h, { recursive: !0 }), console.log("RECORDINGS_DIR:", h), console.log("User Data Path:", l.getPath("userData"));
  } catch (e) {
    console.error("Failed to create recordings directory:", e);
  }
}
process.env.APP_ROOT = r.join(A, "..");
const N = process.env.VITE_DEV_SERVER_URL, Y = r.join(process.env.APP_ROOT, "dist-electron"), S = r.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = N ? r.join(process.env.APP_ROOT, "public") : S;
let c = null, y = null, u = null, E = "";
function I() {
  c = C();
}
function q() {
  const e = r.join(process.env.VITE_PUBLIC || S, "rec-button.png");
  let n = O.createFromPath(e);
  n = n.resize({ width: 24, height: 24, quality: "best" }), u = new F(n), x();
}
function x() {
  if (!u) return;
  const e = [
    {
      label: "Stop Recording",
      click: () => {
        c && !c.isDestroyed() && c.webContents.send("stop-recording-from-tray");
      }
    }
  ], n = V.buildFromTemplate(e);
  u.setContextMenu(n), u.setToolTip(`Recording: ${E}`);
}
function $() {
  c && (c.close(), c = null), c = U();
}
function G() {
  return y = z(), y.on("closed", () => {
    y = null;
  }), y;
}
l.on("window-all-closed", () => {
  process.platform !== "darwin" && l.quit();
});
l.on("activate", () => {
  f.getAllWindows().length === 0 && I();
});
l.on("before-quit", async (e) => {
  e.preventDefault(), await B(), l.exit(0);
});
l.whenReady().then(async () => {
  await H(), M(
    $,
    G,
    () => c,
    () => y,
    (e, n) => {
      E = n, e ? (u || q(), x(), c && c.minimize()) : (u && (u.destroy(), u = null), c && c.restore());
    }
  ), I();
});
export {
  Y as MAIN_DIST,
  h as RECORDINGS_DIR,
  S as RENDERER_DIST,
  N as VITE_DEV_SERVER_URL
};
