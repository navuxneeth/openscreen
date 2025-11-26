# Windows Installer Customization Guide

This guide explains how to customize the Windows installer for OpenScreen. The project uses [electron-builder](https://www.electron.build/) with [NSIS (Nullsoft Scriptable Install System)](https://nsis.sourceforge.io/) to create Windows installers.

## Table of Contents

- [Understanding the Configuration](#understanding-the-configuration)
- [Basic Customizations](#basic-customizations)
- [Adding Custom Resources](#adding-custom-resources)
- [Adding Custom Cursors](#adding-custom-cursors)
- [Custom NSIS Scripts](#custom-nsis-scripts)
- [Advanced Customizations](#advanced-customizations)
- [Building the Installer](#building-the-installer)

---

## Understanding the Configuration

The Windows installer is configured in `electron-builder.json5`. Here's the current Windows/NSIS configuration:

```json5
{
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ],
    "icon": "icons/icons/win/icon.ico",
    "artifactName": "${productName}-Windows-${arch}-${version}-Setup.${ext}"
  },
  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true,
    "deleteAppDataOnUninstall": false,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "OpenScreen"
  }
}
```

### Key Configuration Options

| Option | Description |
|--------|-------------|
| `oneClick` | If `true`, creates a one-click installer (no wizard). Set to `false` for full wizard experience. |
| `perMachine` | If `true`, installs for all users. If `false`, installs per-user (no admin required). |
| `allowToChangeInstallationDirectory` | Allows users to choose where to install the app. |
| `deleteAppDataOnUninstall` | If `true`, removes app data when uninstalling. |
| `createDesktopShortcut` | Creates a desktop shortcut during installation. |
| `createStartMenuShortcut` | Creates a Start Menu shortcut. |
| `shortcutName` | The name displayed for shortcuts. |

---

## Basic Customizations

### Changing the App Icon

The Windows icon is located at `icons/icons/win/icon.ico`. To change it:

1. Create your new icon in `.ico` format (256x256 recommended, with multiple sizes embedded)
2. Replace the file at `icons/icons/win/icon.ico`
3. Rebuild the installer

**Using electron-icon-builder:**
```bash
# Install the tool (already in devDependencies)
npm install electron-icon-builder --save-dev

# Generate icons from a 1024x1024 PNG
npx electron-icon-builder --input=./your-icon.png --output=./icons
```

### Changing the Installer Name and Version

Edit `package.json`:
```json
{
  "name": "openscreen",
  "version": "1.0.0",
  "productName": "OpenScreen"
}
```

Or override in `electron-builder.json5`:
```json5
{
  "productName": "MyCustomApp",
  "appId": "com.yourname.myapp"
}
```

---

## Adding Custom Resources

### Extra Resources (bundled with app)

Use `extraResources` to include files that should be accessible at runtime:

```json5
{
  "extraResources": [
    {
      "from": "public/wallpapers",
      "to": "assets/wallpapers"
    },
    {
      "from": "resources/cursors",
      "to": "assets/cursors"
    },
    {
      "from": "resources/sounds",
      "to": "assets/sounds"
    }
  ]
}
```

Access these at runtime in your Electron app:
```javascript
const path = require('path');
const { app } = require('electron');

// In production
const resourcePath = path.join(process.resourcesPath, 'assets', 'cursors', 'custom.cur');

// In development
const devPath = path.join(app.getAppPath(), 'resources', 'cursors', 'custom.cur');
```

### Extra Files (root of installation)

Use `extraFiles` to add files to the installation root:

```json5
{
  "extraFiles": [
    {
      "from": "LICENSE",
      "to": "LICENSE.txt"
    },
    {
      "from": "README.md",
      "to": "README.txt"
    }
  ]
}
```

---

## Adding Custom Cursors

To add custom cursors to your screen recording app:

### Step 1: Create Cursor Files

Create your cursor files in `.cur` or `.ani` format:
- `.cur` - Static cursor
- `.ani` - Animated cursor

Place them in a resources folder:
```
resources/
  cursors/
    pointer.cur
    click.ani
    recording.cur
```

### Step 2: Update electron-builder.json5

Add the cursors to extra resources:

```json5
{
  "extraResources": [
    {
      "from": "public/wallpapers",
      "to": "assets/wallpapers"
    },
    {
      "from": "resources/cursors",
      "to": "assets/cursors"
    }
  ]
}
```

### Step 3: Load Cursors in Your App

In your Electron renderer or main process:

```typescript
// Get cursor path
import { app } from 'electron';
import path from 'path';

function getCursorPath(cursorName: string): string {
  if (process.env.NODE_ENV === 'development') {
    return path.join(app.getAppPath(), 'resources', 'cursors', cursorName);
  }
  return path.join(process.resourcesPath, 'assets', 'cursors', cursorName);
}

// Use in CSS (for custom cursor in renderer)
const cursorUrl = getCursorPath('custom-pointer.cur');
document.body.style.cursor = `url("${cursorUrl}"), auto`;
```

### Step 4: Use in HTML/CSS

For web-based cursor customization in your recording overlay:

```css
.recording-area {
  cursor: url('./cursors/recording.cur'), crosshair;
}

.clickable {
  cursor: url('./cursors/pointer.cur'), pointer;
}
```

---

## Custom NSIS Scripts

For advanced installer customization, you can use custom NSIS scripts.

### Creating a Custom Installer Script

Create a file `build/installer.nsh`:

```nsis
!macro customHeader
  ; Add custom header code here
  !system "echo 'Custom NSIS script loaded'"
!macroend

!macro preInit
  ; Code to run before initialization
  SetRegView 64
!macroend

!macro customInit
  ; Custom initialization code
  ; Example: Check for prerequisites
!macroend

!macro customInstall
  ; Custom installation steps
  ; Example: Create additional shortcuts
  CreateShortCut "$DESKTOP\OpenScreen Recording.lnk" "$INSTDIR\Openscreen.exe" "--record"
  
  ; Example: Register file associations
  WriteRegStr HKCR ".osr" "" "OpenScreen.Recording"
  WriteRegStr HKCR "OpenScreen.Recording" "" "OpenScreen Recording"
  WriteRegStr HKCR "OpenScreen.Recording\shell\open\command" "" '"$INSTDIR\Openscreen.exe" "%1"'
!macroend

!macro customUnInstall
  ; Custom uninstallation steps
  Delete "$DESKTOP\OpenScreen Recording.lnk"
  DeleteRegKey HKCR ".osr"
  DeleteRegKey HKCR "OpenScreen.Recording"
!macroend

!macro customInstallMode
  ; Force per-user installation (no admin)
  StrCpy $isForceCurrentInstall "true"
!macroend
```

### Reference the Script in electron-builder.json5

```json5
{
  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true,
    "include": "build/installer.nsh",
    "script": "build/installer.nsi"  // For complete custom script
  }
}
```

### Common NSIS Script Examples

**Add Custom Welcome Page Text:**
```nsis
!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Welcome to OpenScreen Setup"
  !define MUI_WELCOMEPAGE_TEXT "This wizard will install OpenScreen on your computer.$\r$\n$\r$\nOpenScreen is a free screen recording tool with zoom effects."
!macroend
```

**Add License Agreement:**
```nsis
!macro customLicensePage
  !define MUI_LICENSEPAGE_TEXT_TOP "Please read the license agreement carefully."
  !insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!macroend
```

**Run Application After Install:**
```nsis
!macro customFinishPage
  !define MUI_FINISHPAGE_RUN "$INSTDIR\Openscreen.exe"
  !define MUI_FINISHPAGE_RUN_TEXT "Launch OpenScreen"
!macroend
```

---

## Advanced Customizations

### Custom Installer Graphics

Create custom installer images:

1. **Header Image** (150x57 pixels, BMP format):
   ```json5
   {
     "nsis": {
       "installerHeaderIcon": "build/installerHeaderIcon.ico"
     }
   }
   ```

2. **Sidebar Image** (164x314 pixels, BMP format):
   Create `build/installerSidebar.bmp` and reference in NSIS script.

### Multi-Language Support

```json5
{
  "nsis": {
    "language": "1033",  // English
    // Or for multi-language:
    "multiLanguageInstaller": true
  }
}
```

### Signed Installer

For production releases, sign your installer:

```json5
{
  "win": {
    "certificateFile": "./cert.pfx",
    "certificatePassword": "your-password",
    "signingHashAlgorithms": ["sha256"]
  }
}
```

### Custom Installation Directory

```json5
{
  "nsis": {
    "allowToChangeInstallationDirectory": true,
    "installerIcon": "icons/icons/win/icon.ico",
    "uninstallerIcon": "icons/icons/win/uninstaller.ico",
    "installerHeader": "build/installerHeader.bmp",
    "installerSidebar": "build/installerSidebar.bmp"
  }
}
```

### Per-Machine vs Per-User Installation

```json5
{
  "nsis": {
    // Per-user (no admin required)
    "perMachine": false,
    
    // Or system-wide (requires admin)
    // "perMachine": true,
    
    // Or let user choose
    // "allowElevation": true
  }
}
```

---

## Building the Installer

After making your customizations:

### Development Build
```bash
# Install dependencies
npm install

# Build for Windows
npm run build:win
```

### Production Build
```bash
# Full build with TypeScript compilation
npm run build

# Or Windows-specific
npm run build:win
```

### Output Location

Built installers are placed in:
```
release/
  {version}/
    Openscreen-Windows-x64-{version}-Setup.exe
```

---

## Full Example Configuration

Here's a complete `electron-builder.json5` with common customizations:

```json5
{
  "$schema": "https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json",
  "appId": "com.yourcompany.openscreen",
  "productName": "OpenScreen",
  "asar": true,
  "compression": "maximum",
  
  "directories": {
    "output": "release/${version}"
  },
  
  "files": [
    "dist",
    "dist-electron",
    "!*.png",
    "!*.md"
  ],
  
  "extraResources": [
    {
      "from": "public/wallpapers",
      "to": "assets/wallpapers"
    },
    {
      "from": "resources/cursors",
      "to": "assets/cursors"
    }
  ],
  
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64", "ia32"]  // Build for both 64-bit and 32-bit
      }
    ],
    "icon": "icons/icons/win/icon.ico",
    "artifactName": "${productName}-Windows-${arch}-${version}-Setup.${ext}"
  },
  
  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true,
    "deleteAppDataOnUninstall": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "OpenScreen",
    "include": "build/installer.nsh",
    "installerIcon": "icons/icons/win/icon.ico",
    "uninstallerIcon": "icons/icons/win/icon.ico",
    "license": "LICENSE"
  }
}
```

---

## Troubleshooting

### Common Issues

1. **Icon not showing**: Ensure icon is a valid `.ico` file with multiple sizes (16x16, 32x32, 48x48, 256x256)

2. **Resources not found**: Check paths in `extraResources` are relative to project root

3. **NSIS script errors**: Validate syntax using NSIS compiler or check electron-builder logs

4. **Build fails on CI**: Ensure all required files exist and paths are correct for the CI environment

### Debug Mode

Run electron-builder with debug output:
```bash
DEBUG=electron-builder npm run build:win
```

---

## Resources

- [electron-builder Documentation](https://www.electron.build/)
- [NSIS Documentation](https://nsis.sourceforge.io/Docs/)
- [electron-builder NSIS Options](https://www.electron.build/configuration/nsis)
- [NSIS Script Reference](https://nsis.sourceforge.io/Docs/Chapter4.html)
