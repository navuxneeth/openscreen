export async function getAssetPath(relativePath: string): Promise<string> {
  try {
    if (typeof window !== 'undefined') {
      // If running in a dev server (http/https), prefer the web-served path
      if (window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
        return `/${relativePath.replace(/^\//, '')}`
      }

      if ((window as unknown as { electronAPI?: { getAssetBasePath?: () => Promise<string | null> } }).electronAPI && 
          typeof (window as unknown as { electronAPI: { getAssetBasePath: () => Promise<string | null> } }).electronAPI.getAssetBasePath === 'function') {
        const base = await (window as unknown as { electronAPI: { getAssetBasePath: () => Promise<string | null> } }).electronAPI.getAssetBasePath()
        if (base) {
          const normalized = base.replace(/\\/g, '/')
          // Windows paths need file:/// (three slashes) for absolute paths like C:/
          if (normalized.match(/^[a-zA-Z]:/)) {
            return `file:///${normalized}/${relativePath}`
          }
          return `file://${normalized}/${relativePath}`
        }
      }
    }
  } catch {
    // ignore and use fallback
  }

  // Fallback for web/dev server: public/wallpapers are served at '/wallpapers/...'
  return `/${relativePath.replace(/^\//, '')}`
}

export default getAssetPath;
