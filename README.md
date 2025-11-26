<p align="center">
	<img src="openscreen.png" alt="OpenScreen Logo" width="64" />
</p>

# <p align="center">OpenScreen</p>

<p align="center"><strong>Free, open-source screen recording with beautiful zoom effects — your Screen Studio alternative!</strong></p>

<p align="center">
	<img src="preview.png" alt="OpenScreen App Preview" style="height: 320px; margin-right: 12px;" />
</p>

---

## ⚡ Quick Install (Windows)

**3 easy steps to get started:**

1. **Download** → [Get the latest Windows installer](https://github.com/siddharthvaddem/openscreen/releases) (look for `Openscreen-Windows-x64-...-Setup.exe`)

2. **Install** → Run the downloaded `.exe` file and follow the wizard

3. **Launch** → Open OpenScreen from Start Menu or Desktop shortcut

> 💡 **Tip:** If Windows SmartScreen shows a warning, click **"More info"** → **"Run anyway"** (the app is safe, just not code-signed yet)

**That's it! You're ready to create beautiful screen recordings! 🎉**

---

## ✨ What You Can Do

| Feature | Description |
|---------|-------------|
| 🖥️ **Screen Recording** | Record your whole screen or specific apps |
| 🔍 **Smooth Zooms** | Add manual zooms with customizable depth levels |
| ✂️ **Video Cropping** | Crop recordings to hide unwanted parts |
| 🎨 **Custom Backgrounds** | Use wallpapers, solid colors, gradients, or your own images |
| 🎬 **Pro Effects** | Motion blur and exponential easing for smooth animations |

---

## 🍎 macOS Users

Download from [Releases](https://github.com/siddharthvaddem/openscreen/releases), then run in Terminal:

```bash
xattr -rd com.apple.quarantine /Applications/Openscreen.app
```

Then go to **System Preferences > Security & Privacy** and grant "screen recording" + "accessibility" permissions.

---

## 🛠️ For Developers

Want to build from source or contribute? See the [Contribution Guide](./CONTRIBUTING.md).

```bash
# Clone and install
git clone https://github.com/siddharthvaddem/openscreen.git
cd openscreen
npm install

# Run in development mode
npm run dev

# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac
```

---

## 📄 License

[MIT License](./LICENSE) — 100% free for personal and commercial use!

---

<details>
<summary><strong>📖 Original README (click to expand)</strong></summary>

---

<p align="center">
	<img src="openscreen.png" alt="OpenScreen Logo" width="64" />
</p>


# <p align="center">OpenScreen</p>

<p align="center"><strong>OpenScreen is your free, open-source alternative to Screen Studio (sort of).</strong></p>


If you don't want to pay $29/month for Screen Studio but want a much simpler version that does what most people seem to need, making beautiful product demos and walkthroughs, here's a free-to-use app for you. OpenScreen does not offer all Screen Studio features, but covers the basics well!

Screen Studio is an awesome product and this is definitely not a 1:1 clone. OpenScreen is a much simpler take, just the basics for folks who want control and don't want to pay. If you need all the fancy features, your best bet is to support Screen Studio (they really do a great job, haha). But if you just want something free (no gotchas) and open, this project does the job!

OpenScreen is 100% free for personal and commercial use. Use it, modify it, distribute it. (Just be cool 😁 and give a shoutout if you feel like it !)



**⚠️ DISCLAIMER: This is very much in beta and might be buggy here and there (but hope you have a good experience!).**

</p>
<p align="center">
	<img src="preview.png" alt="OpenScreen App Preview" style="height: 320px; margin-right: 12px;" />
	<img src="preview2.png" alt="OpenScreen App Preview 2" style="height: 320px; margin-right: 12px;" />
	<img src="preview3.png" alt="OpenScreen App Preview 3" style="height: 320px; margin-right: 12px;" />
	<img src="preview4.png" alt="OpenScreen App Preview 4" style="height: 320px; margin-right: 12px;" />
	
</p>
</p>

## Core Features
- Record your whole screen or specific apps
- Add manual zooms (customizable depth levels)
- Customize the duration and position of zooms however you please
- Crop video recordings to hide parts
- Choose between wallpapers, solid colors, gradients or your own picture for your background
- Motion blur and exponential easing for smoother pan and zoom effects

## Installation

Download the latest installer for your platform from the [GitHub Releases](https://github.com/siddharthvaddem/openscreen/releases) page.

### Windows Installation

1. Download the Windows installer (`Openscreen-Windows-x64-{version}-Setup.exe`) from the [Releases](https://github.com/siddharthvaddem/openscreen/releases) page.
2. Run the installer and follow the installation wizard.
3. Launch OpenScreen from the Start Menu or Desktop shortcut.

**Note:** Windows SmartScreen may show a warning since the app is not signed with a code signing certificate. Click "More info" and then "Run anyway" to proceed with the installation.

### macOS Installation

Download the latest installer for your platform from the [GitHub Releases](https://github.com/siddharthvaddem/openscreen/releases) page.

If you encounter issues with macOS Gatekeeper blocking the app (since it does not come with a developer certificate), you can bypass this by running the following command in your terminal after installation:

```bash
xattr -rd com.apple.quarantine /Applications/Openscreen.app
```

After running this command, proceed to **System Preferences > Security & Privacy** to grant the necessary permissions for "screen recording" and "accessibility". Once permissions are granted, you can launch the app.

## Built with
- Electron
- React
- TypeScript
- Vite
- PixiJS
- dnd-timeline

---


_I'm new to open source, idk what I'm doing lol. If something is wrong please raise an issue 🙏_

## License


This project is licensed under the [MIT License](./LICENSE). By using this software, you agree that the authors are not liable for any issues, damages, or claims arising from its use.

</details>
