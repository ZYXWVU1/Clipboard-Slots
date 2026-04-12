import type { AppSettings, HotkeyMode } from "./types";

export const MAX_DIRECT_SLOT_SHORTCUTS = 9;
export const DEFAULT_HOTKEY_MODE: HotkeyMode = "direct";
export const DEFAULT_POLL_INTERVAL_MS = 400;
export const DEFAULT_CHORD_TIMEOUT_MS = 8000;
export const DEFAULT_MAX_HISTORY = 9;
export const MIN_HISTORY_SIZE = 1;
export const MAX_HISTORY_SIZE = 99;

export const buildDefaultDirectHotkeys = (
  count = MAX_DIRECT_SLOT_SHORTCUTS
): Record<number, string> => {
  const hotkeys: Record<number, string> = {};
  for (let slot = 1; slot <= count; slot += 1) {
    hotkeys[slot] = `CommandOrControl+Alt+${slot}`;
  }
  return hotkeys;
};

export const DEFAULT_SETTINGS: AppSettings = {
  locale: "en",
  hotkeyMode: DEFAULT_HOTKEY_MODE,
  directHotkeys: buildDefaultDirectHotkeys(),
  chordActivator: "CommandOrControl+Alt+Space",
  chordTimeoutMs: DEFAULT_CHORD_TIMEOUT_MS,
  maxHistory: DEFAULT_MAX_HISTORY,
  deduplicateConsecutive: true,
  restoreClipboardAfterPaste: true,
  startOnBoot: false,
  persistHistory: false,
  clipboardPollIntervalMs: DEFAULT_POLL_INTERVAL_MS
};
