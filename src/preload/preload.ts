import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import { IPC_CHANNELS } from "../common/ipc";
import type {
  AppSettings,
  ClipboardHistoryItem,
  CtrlCvApi,
  HotkeyStatus,
  SaveSettingsResult,
  SlotPickerContext
} from "../common/types";

const subscribe = <T>(channel: string, callback: (payload: T) => void) => {
  const listener = (_event: IpcRendererEvent, payload: T) => {
    callback(payload);
  };

  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
};

const api: CtrlCvApi = {
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.settingsGet),
  saveSettings: (nextSettings: Partial<AppSettings>): Promise<SaveSettingsResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.settingsSave, nextSettings),
  resetShortcuts: (): Promise<SaveSettingsResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.settingsResetShortcuts),
  getHistory: (): Promise<ClipboardHistoryItem[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.historyGet),
  clearHistory: () => ipcRenderer.invoke(IPC_CHANNELS.historyClear),
  deleteHistoryItem: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.historyDelete, id),
  togglePin: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.historyTogglePin, id),
  copyHistoryItem: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.historyCopy, id),
  pasteHistoryItem: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.historyPasteItem, id),
  pasteSlot: (slot: number) => ipcRenderer.invoke(IPC_CHANNELS.historyPasteSlot, slot),
  openSettings: () => ipcRenderer.invoke(IPC_CHANNELS.appOpenSettings),
  openHistory: () => ipcRenderer.invoke(IPC_CHANNELS.appOpenHistory),
  getHotkeyStatus: (): Promise<HotkeyStatus> =>
    ipcRenderer.invoke(IPC_CHANNELS.hotkeysGetStatus),
  getSlotPickerContext: (): Promise<SlotPickerContext> =>
    ipcRenderer.invoke(IPC_CHANNELS.slotPickerGetContext),
  submitSlotPicker: (slot: number) => ipcRenderer.invoke(IPC_CHANNELS.slotPickerSubmit, slot),
  cancelSlotPicker: () => ipcRenderer.invoke(IPC_CHANNELS.slotPickerCancel),
  onSettingsChanged: (callback) =>
    subscribe<AppSettings>(IPC_CHANNELS.settingsChanged, callback),
  onHistoryChanged: (callback) =>
    subscribe<ClipboardHistoryItem[]>(IPC_CHANNELS.historyChanged, callback),
  onHotkeysChanged: (callback) =>
    subscribe<HotkeyStatus>(IPC_CHANNELS.hotkeysChanged, callback)
};

contextBridge.exposeInMainWorld("ctrlCvApi", api);
