import path from "node:path";
import { BrowserWindow } from "electron";

type WindowName = "history" | "settings" | "slot-picker";

const rendererPath = (...segments: string[]) =>
  path.join(__dirname, "..", "renderer", ...segments);

const preloadPath = path.join(__dirname, "..", "preload", "preload.js");

const baseWindowOptions = {
  autoHideMenuBar: true,
  show: false,
  backgroundColor: "#102130",
  webPreferences: {
    preload: preloadPath,
    contextIsolation: true,
    nodeIntegration: false
  }
};

export class WindowManager {
  private historyWindow: BrowserWindow | null = null;
  private settingsWindow: BrowserWindow | null = null;
  private slotPickerWindow: BrowserWindow | null = null;

  openHistory(): void {
    const window = this.getOrCreateWindow("history");
    window.show();
    window.focus();
  }

  openSettings(): void {
    const window = this.getOrCreateWindow("settings");
    window.show();
    window.focus();
  }

  openSlotPicker(): void {
    const window = this.getOrCreateWindow("slot-picker");
    window.show();
    window.focus();
  }

  hideSlotPicker(): void {
    this.slotPickerWindow?.hide();
  }

  broadcast(channel: string, payload: unknown): void {
    for (const window of [this.historyWindow, this.settingsWindow, this.slotPickerWindow]) {
      if (window && !window.isDestroyed()) {
        window.webContents.send(channel, payload);
      }
    }
  }

  private getOrCreateWindow(name: WindowName): BrowserWindow {
    if (name === "history") {
      this.historyWindow ??= this.createHistoryWindow();
      return this.historyWindow;
    }

    if (name === "settings") {
      this.settingsWindow ??= this.createSettingsWindow();
      return this.settingsWindow;
    }

    this.slotPickerWindow ??= this.createSlotPickerWindow();
    return this.slotPickerWindow;
  }

  private createHistoryWindow(): BrowserWindow {
    const window = new BrowserWindow({
      ...baseWindowOptions,
      title: "CtrlCVTool",
      width: 980,
      height: 720,
      minWidth: 860,
      minHeight: 580
    });

    this.attachLifecycle(window, "history");
    void window.loadFile(rendererPath("history.html"));
    return window;
  }

  private createSettingsWindow(): BrowserWindow {
    const window = new BrowserWindow({
      ...baseWindowOptions,
      title: "CtrlCVTool Settings",
      width: 960,
      height: 760,
      minWidth: 860,
      minHeight: 680
    });

    this.attachLifecycle(window, "settings");
    void window.loadFile(rendererPath("settings.html"));
    return window;
  }

  private createSlotPickerWindow(): BrowserWindow {
    const window = new BrowserWindow({
      ...baseWindowOptions,
      title: "Choose a Slot",
      width: 440,
      height: 520,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      alwaysOnTop: true,
      skipTaskbar: true
    });

    this.attachLifecycle(window, "slot-picker");
    void window.loadFile(rendererPath("slot-picker.html"));
    return window;
  }

  private attachLifecycle(window: BrowserWindow, name: WindowName): void {
    window.on("closed", () => {
      if (name === "history") {
        this.historyWindow = null;
        return;
      }
      if (name === "settings") {
        this.settingsWindow = null;
        return;
      }
      this.slotPickerWindow = null;
    });

    if (name === "slot-picker") {
      window.on("blur", () => {
        window.hide();
      });
    }
  }
}
