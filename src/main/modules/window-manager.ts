import path from "node:path";
import { BrowserWindow } from "electron";
import { DEFAULT_LOCALE, t } from "../../common/i18n";
import { IPC_CHANNELS } from "../../common/ipc";
import type { AppView, SupportedLocale } from "../../common/types";

type WindowName = "history" | "slot-picker";

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
  private slotPickerWindow: BrowserWindow | null = null;
  private locale: SupportedLocale = DEFAULT_LOCALE;

  setLocale(locale: SupportedLocale): void {
    this.locale = locale;

    this.historyWindow?.setTitle(t(locale, "app.title"));
    this.slotPickerWindow?.setTitle(t(locale, "picker.windowTitle"));
  }

  openHistory(): void {
    this.showMainWindow("history");
  }

  openSettings(): void {
    this.showMainWindow("settings");
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
    for (const window of [this.historyWindow, this.slotPickerWindow]) {
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

    this.slotPickerWindow ??= this.createSlotPickerWindow();
    return this.slotPickerWindow;
  }

  private showMainWindow(view: AppView): void {
    const window = this.getOrCreateWindow("history");
    const sendView = () => {
      window.webContents.send(IPC_CHANNELS.appShowView, view);
    };

    window.show();
    window.focus();

    if (window.webContents.isLoadingMainFrame()) {
      window.webContents.once("did-finish-load", sendView);
      return;
    }

    sendView();
  }

  private createHistoryWindow(): BrowserWindow {
    const window = new BrowserWindow({
      ...baseWindowOptions,
      title: t(this.locale, "app.title"),
      width: 980,
      height: 720,
      minWidth: 860,
      minHeight: 580
    });

    this.attachLifecycle(window, "history");
    void window.loadFile(rendererPath("history.html"));
    return window;
  }

  private createSlotPickerWindow(): BrowserWindow {
    const window = new BrowserWindow({
      ...baseWindowOptions,
      title: t(this.locale, "picker.windowTitle"),
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
      this.slotPickerWindow = null;
    });

    if (name === "slot-picker") {
      window.on("blur", () => {
        window.hide();
      });
    }
  }
}
