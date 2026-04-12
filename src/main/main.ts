import path from "node:path";
import { app, ipcMain } from "electron";
import { IPC_CHANNELS } from "../common/ipc";
import type {
  AppSettings,
  HotkeyStatus,
  SaveSettingsResult,
  SlotPickerContext
} from "../common/types";
import { ClipboardWatcher } from "./modules/clipboard-watcher";
import { HistoryStore } from "./modules/history-store";
import { HotkeyManager } from "./modules/hotkey-manager";
import { PasteEngine } from "./modules/paste-engine";
import { SettingsManager } from "./modules/settings-manager";
import { StartupManager } from "./modules/startup-manager";
import { TrayManager } from "./modules/tray-manager";
import { WindowManager } from "./modules/window-manager";

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
}

let isQuitting = false;

const registerIpcHandlers = (
  settingsManager: SettingsManager,
  historyStore: HistoryStore,
  pasteEngine: PasteEngine,
  windowManager: WindowManager,
  hotkeyManager: HotkeyManager
) => {
  const buildSettingsResponse = (settings: AppSettings): SaveSettingsResult => ({
    settings,
    hotkeyStatus: hotkeyManager.getStatus()
  });

  ipcMain.handle(IPC_CHANNELS.settingsGet, () => settingsManager.getSettings());
  ipcMain.handle(IPC_CHANNELS.settingsSave, (_event, nextSettings: Partial<AppSettings>) =>
    buildSettingsResponse(settingsManager.update(nextSettings))
  );
  ipcMain.handle(IPC_CHANNELS.settingsResetShortcuts, () =>
    buildSettingsResponse(settingsManager.resetShortcuts())
  );
  ipcMain.handle(IPC_CHANNELS.historyGet, () => historyStore.getAll());
  ipcMain.handle(IPC_CHANNELS.historyClear, () => {
    historyStore.clear();
  });
  ipcMain.handle(IPC_CHANNELS.historyDelete, (_event, id: string) => {
    historyStore.delete(id);
  });
  ipcMain.handle(IPC_CHANNELS.historyTogglePin, (_event, id: string) => {
    historyStore.togglePin(id);
  });
  ipcMain.handle(IPC_CHANNELS.historyCopy, (_event, id: string) =>
    pasteEngine.copyHistoryItem(id)
  );
  ipcMain.handle(IPC_CHANNELS.historyPasteItem, (_event, id: string) =>
    pasteEngine.pasteHistoryItem(id)
  );
  ipcMain.handle(IPC_CHANNELS.historyPasteSlot, (_event, slot: number) =>
    pasteEngine.pasteSlot(slot)
  );
  ipcMain.handle(IPC_CHANNELS.appOpenSettings, () => {
    windowManager.openSettings();
  });
  ipcMain.handle(IPC_CHANNELS.appOpenHistory, () => {
    windowManager.openHistory();
  });
  ipcMain.handle(
    IPC_CHANNELS.hotkeysGetStatus,
    (): HotkeyStatus => hotkeyManager.getStatus()
  );
  ipcMain.handle(IPC_CHANNELS.slotPickerGetContext, (): SlotPickerContext => ({
    items: historyStore.getAll(),
    maxHistory: settingsManager.getSettings().maxHistory,
    timeoutMs: settingsManager.getSettings().chordTimeoutMs
  }));
  ipcMain.handle(IPC_CHANNELS.slotPickerSubmit, async (_event, slot: number) => {
    windowManager.hideSlotPicker();
    return pasteEngine.pasteSlot(slot);
  });
  ipcMain.handle(IPC_CHANNELS.slotPickerCancel, () => {
    windowManager.hideSlotPicker();
  });
};

const main = async () => {
  await app.whenReady();

  const hiddenLaunch =
    process.argv.includes("--hidden") || process.argv.includes("--launch-at-startup");
  const storageDirectory = path.join(app.getPath("userData"), "storage");
  const settingsManager = new SettingsManager(storageDirectory);
  const settings = settingsManager.load();
  const historyStore = new HistoryStore(storageDirectory, () => settingsManager.getSettings());
  historyStore.load();

  const windowManager = new WindowManager();
  const clipboardWatcher = new ClipboardWatcher(historyStore, () => settingsManager.getSettings());
  const pasteEngine = new PasteEngine(historyStore, settingsManager, clipboardWatcher);
  const hotkeyManager = new HotkeyManager(
    (slot) => pasteEngine.pasteSlot(slot),
    () => windowManager.openSlotPicker()
  );
  const startupManager = new StartupManager();
  const trayManager = new TrayManager();

  const broadcastSettings = (nextSettings: AppSettings) => {
    windowManager.broadcast(IPC_CHANNELS.settingsChanged, nextSettings);
  };

  const broadcastHistory = () => {
    windowManager.broadcast(IPC_CHANNELS.historyChanged, historyStore.getAll());
  };

  const broadcastHotkeys = () => {
    windowManager.broadcast(IPC_CHANNELS.hotkeysChanged, hotkeyManager.getStatus());
  };

  settingsManager.on("updated", (nextSettings: AppSettings) => {
    historyStore.applySettings();
    clipboardWatcher.updateSettings();
    hotkeyManager.register(nextSettings);
    startupManager.apply(nextSettings.startOnBoot);
    broadcastSettings(nextSettings);
    broadcastHistory();
    broadcastHotkeys();
  });

  historyStore.on("updated", () => {
    broadcastHistory();
  });

  hotkeyManager.on("updated", () => {
    broadcastHotkeys();
  });

  registerIpcHandlers(
    settingsManager,
    historyStore,
    pasteEngine,
    windowManager,
    hotkeyManager
  );

  trayManager.create({
    openHistory: () => windowManager.openHistory(),
    openSettings: () => windowManager.openSettings(),
    clearHistory: () => historyStore.clear(),
    quit: () => {
      isQuitting = true;
      app.quit();
    }
  });

  startupManager.apply(settings.startOnBoot);
  hotkeyManager.register(settings);
  clipboardWatcher.start();

  if (!hiddenLaunch) {
    windowManager.openHistory();
  }

  app.on("second-instance", () => {
    windowManager.openHistory();
  });

  app.on("before-quit", () => {
    isQuitting = true;
    clipboardWatcher.stop();
    hotkeyManager.dispose();
    trayManager.destroy();
  });

  app.on("window-all-closed", (event) => {
    if (!isQuitting) {
      event.preventDefault();
    }
  });

  app.on("activate", () => {
    if (!isQuitting) {
      windowManager.openHistory();
    }
  });
};

if (singleInstanceLock) {
  void main();
}
