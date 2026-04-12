export type ClipboardContentType = "text";
export type HotkeyMode = "direct" | "chord";

export interface ClipboardHistoryItem {
  id: string;
  slot: number;
  content: string;
  contentType: ClipboardContentType;
  timestamp: string;
  pinned: boolean;
}

export interface AppSettings {
  hotkeyMode: HotkeyMode;
  directHotkeys: Record<number, string>;
  chordActivator: string;
  chordTimeoutMs: number;
  maxHistory: number;
  deduplicateConsecutive: boolean;
  restoreClipboardAfterPaste: boolean;
  startOnBoot: boolean;
  persistHistory: boolean;
  clipboardPollIntervalMs: number;
}

export interface HotkeyRegistration {
  accelerator: string;
  slot?: number;
  status: "registered" | "failed";
  kind: "slot" | "chord";
  reason?: string;
}

export interface HotkeyStatus {
  mode: HotkeyMode;
  registrations: HotkeyRegistration[];
  warnings: string[];
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

export interface SlotPickerContext {
  items: ClipboardHistoryItem[];
  maxHistory: number;
  timeoutMs: number;
}

export interface SaveSettingsResult {
  settings: AppSettings;
  hotkeyStatus: HotkeyStatus;
}

export type AppView = "history" | "settings";

export interface CtrlCvApi {
  getSettings: () => Promise<AppSettings>;
  saveSettings: (nextSettings: Partial<AppSettings>) => Promise<SaveSettingsResult>;
  resetShortcuts: () => Promise<SaveSettingsResult>;
  getHistory: () => Promise<ClipboardHistoryItem[]>;
  clearHistory: () => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  copyHistoryItem: (id: string) => Promise<ActionResult>;
  pasteHistoryItem: (id: string) => Promise<ActionResult>;
  pasteSlot: (slot: number) => Promise<ActionResult>;
  openSettings: () => Promise<void>;
  openHistory: () => Promise<void>;
  getHotkeyStatus: () => Promise<HotkeyStatus>;
  getSlotPickerContext: () => Promise<SlotPickerContext>;
  submitSlotPicker: (slot: number) => Promise<ActionResult>;
  cancelSlotPicker: () => Promise<void>;
  onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void;
  onHistoryChanged: (
    callback: (items: ClipboardHistoryItem[]) => void
  ) => () => void;
  onHotkeysChanged: (callback: (status: HotkeyStatus) => void) => () => void;
  onAppViewChanged: (callback: (view: AppView) => void) => () => void;
}

declare global {
  interface Window {
    ctrlCvApi: CtrlCvApi;
  }
}
