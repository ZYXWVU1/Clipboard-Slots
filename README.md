# CtrlCVTool

CtrlCVTool is a Windows-first Electron + TypeScript clipboard utility that stores copied text in ordered slots and lets you paste a specific saved slot with a global shortcut.

## Current app structure

The app is split into a small set of focused layers:

- `src/main/`
  Electron main-process code for clipboard watching, history storage, hotkeys, tray behavior, startup, and window management
- `src/preload/`
  Safe IPC bridge exposed to the renderer
- `src/renderer/`
  The desktop UI for the main window, settings window, and chord slot picker
- `src/common/`
  Shared types, defaults, and IPC channel constants
- `scripts/build.mjs`
  Bundles the TypeScript source into the `dist/` folder with esbuild

## Files added or changed

Main files that make up the app:

- `package.json`
- `tsconfig.json`
- `scripts/build.mjs`
- `src/common/defaults.ts`
- `src/common/ipc.ts`
- `src/common/types.ts`
- `src/main/main.ts`
- `src/main/modules/*.ts`
- `src/preload/preload.ts`
- `src/renderer/history.html`
- `src/renderer/history.ts`
- `src/renderer/settings.html`
- `src/renderer/settings.ts`
- `src/renderer/slot-picker.html`
- `src/renderer/slot-picker.ts`
- `src/renderer/common.css`

## Requirements

- Node.js 20 or newer
- npm
- Windows is the main target

## How to run the app in development

1. Open a terminal in `Project/CtrlCVTool`
2. Install dependencies

```bash
npm install
```

3. Build the app

```bash
npm run build
```

4. Start the desktop app

```bash
npm start
```

The app opens as a normal desktop program and also runs from the system tray in the background.

## How to use the app

### Main window

The main window is the primary UI. It shows:

- saved clipboard slots
- preview text
- timestamps
- pin state

Available actions from the main window:

- `Copy Again`
- `Paste Now`
- `Pin` or `Unpin`
- `Delete`
- `Open Settings`
- `Clear History`

### Copy flow

1. Copy text normally with `Ctrl+C`
2. CtrlCVTool detects the clipboard change
3. The copied text is appended as the next slot

Slot numbering matches copy order exactly:

- slot 1 = oldest saved item still in history
- slot 2 = second saved item still in history
- slot 3 = third saved item still in history

### Paste flow

In direct mode, the default shortcuts are:

- `Ctrl+Alt+1`
- `Ctrl+Alt+2`
- `Ctrl+Alt+3`
- through `Ctrl+Alt+9`

When a slot hotkey is triggered, CtrlCVTool:

1. fetches the saved slot content
2. places it on the clipboard temporarily
3. simulates a normal paste into the active application
4. restores the previous clipboard if that setting is enabled

### Chord mode

If you switch to chord mode in Settings:

- the default activator is `CommandOrControl+Alt+Space`
- the slot picker window opens
- you can type a slot number or click a saved item to paste it

### Tray behavior

The tray menu lets you:

- open the main window
- open settings
- clear history
- quit the app

## Settings

The settings window supports:

- editable direct hotkeys for slots 1 through 9
- direct hotkey mode or chord picker mode
- chord activator shortcut
- chord picker timeout
- max history size
- consecutive deduplication on or off
- clipboard restore after paste on or off
- startup on boot on or off
- history persistence on or off
- clear history
- reset shortcuts to defaults

## How settings are stored

Settings and optional persisted history are stored locally in Electron's user-data folder.

Typical Windows location:

```text
%APPDATA%\CtrlCVTool\storage\
```

Files used there:

- `settings.json`
- `history.json`

If persisted history is disabled, `history.json` is deleted and history stays temporary.

If a settings or history file is corrupted, the app falls back to safe defaults and creates a backup copy of the broken file.

## How the app is launched

During development:

- `npm start` builds the app and launches Electron

For Windows startup:

- enabling `Start on system boot` uses Electron's login-item support
- startup launches the app hidden so it can sit in the tray

## How to build a Windows executable

### Portable single-file style `.exe`

This is the easiest path if you want to open the app from one generated file.

```bash
npm run package
```

That builds a Windows `portable` target and writes the output into:

```text
release/
```

The portable build is the closest match to "openable from 1 file" because it generates a single executable you can launch directly.

### Installer `.exe`

If you want an installer instead:

```bash
npm run package:installer
```

## Notes

- Clipboard capture currently supports plain text in v1
- Global hotkeys are registered with Electron `globalShortcut`
- Paste simulation uses PowerShell `SendKeys` on Windows
- Direct mode exposes the first nine slots as hotkeys; higher slots remain accessible from the main window and chord mode
- If the operating system does not emit a clipboard change for an identical repeat copy, the app cannot distinguish that from no change

## Verification status

I could not run the build locally in this environment because `node` and `npm` are not available on PATH here, so the code was prepared and reviewed statically but not executed in this session.
