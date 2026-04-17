import { EventEmitter } from "node:events";
import path from "node:path";
import {
  DEFAULT_CHORD_TIMEOUT_MS,
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_SETTINGS,
  MAX_DIRECT_SLOT_SHORTCUTS,
  MAX_HISTORY_SIZE,
  MIN_HISTORY_SIZE,
  buildDefaultDirectHotkeys
} from "../../common/defaults";
import { DEFAULT_LOCALE, isSupportedLocale } from "../../common/i18n";
import type { AppSettings, HotkeyMode } from "../../common/types";
import { JsonFileStore } from "./file-store";

const SETTINGS_FILE_NAME = "settings.json";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const sanitizeMode = (value: unknown): HotkeyMode =>
  value === "chord" ? "chord" : "direct";

const sanitizeDirectHotkeys = (value: unknown): Record<number, string> => {
  const defaults = buildDefaultDirectHotkeys();
  if (!isObject(value)) {
    return defaults;
  }

  const nextHotkeys = { ...defaults };
  for (const [key, rawAccelerator] of Object.entries(value)) {
    const slot = Number(key);
    if (
      Number.isInteger(slot) &&
      slot >= 1 &&
      slot <= MAX_DIRECT_SLOT_SHORTCUTS &&
      typeof rawAccelerator === "string" &&
      rawAccelerator.trim()
    ) {
      nextHotkeys[slot] = rawAccelerator.trim();
    }
  }

  return nextHotkeys;
};

export const sanitizeSettings = (value: unknown): AppSettings => {
  if (!isObject(value)) {
    return {
      ...DEFAULT_SETTINGS,
      directHotkeys: { ...DEFAULT_SETTINGS.directHotkeys }
    };
  }

  return {
    locale: isSupportedLocale(value.locale) ? value.locale : DEFAULT_LOCALE,
    hotkeyMode: sanitizeMode(value.hotkeyMode),
    directHotkeys: sanitizeDirectHotkeys(value.directHotkeys),
    chordActivator:
      typeof value.chordActivator === "string" && value.chordActivator.trim()
        ? value.chordActivator.trim()
        : DEFAULT_SETTINGS.chordActivator,
    chordTimeoutMs: clamp(
      Number(value.chordTimeoutMs) || DEFAULT_CHORD_TIMEOUT_MS,
      1500,
      30000
    ),
    maxHistory: clamp(
      Number(value.maxHistory) || DEFAULT_SETTINGS.maxHistory,
      MIN_HISTORY_SIZE,
      MAX_HISTORY_SIZE
    ),
    deduplicateConsecutive:
      typeof value.deduplicateConsecutive === "boolean"
        ? value.deduplicateConsecutive
        : DEFAULT_SETTINGS.deduplicateConsecutive,
    restoreClipboardAfterPaste:
      typeof value.restoreClipboardAfterPaste === "boolean"
        ? value.restoreClipboardAfterPaste
        : DEFAULT_SETTINGS.restoreClipboardAfterPaste,
    startOnBoot:
      typeof value.startOnBoot === "boolean"
        ? value.startOnBoot
        : DEFAULT_SETTINGS.startOnBoot,
    persistHistory:
      typeof value.persistHistory === "boolean"
        ? value.persistHistory
        : DEFAULT_SETTINGS.persistHistory,
    clipboardPollIntervalMs: clamp(
      Number(value.clipboardPollIntervalMs) || DEFAULT_POLL_INTERVAL_MS,
      150,
      5000
    )
  };
};

const cloneSettings = (settings: AppSettings): AppSettings => ({
  ...settings,
  directHotkeys: { ...settings.directHotkeys }
});

export class SettingsManager extends EventEmitter {
  private readonly store: JsonFileStore<AppSettings>;
  private settings: AppSettings = cloneSettings(DEFAULT_SETTINGS);

  constructor(baseDirectory: string) {
    super();
    this.store = new JsonFileStore<AppSettings>(
      path.join(baseDirectory, SETTINGS_FILE_NAME),
      () => cloneSettings(DEFAULT_SETTINGS)
    );
  }

  load(): AppSettings {
    this.settings = sanitizeSettings(this.store.load());
    this.store.save(this.settings);
    return this.getSettings();
  }

  getSettings(): AppSettings {
    return cloneSettings(this.settings);
  }

  update(nextSettings: Partial<AppSettings>): AppSettings {
    this.settings = sanitizeSettings({
      ...this.settings,
      ...nextSettings,
      directHotkeys: nextSettings.directHotkeys
        ? { ...this.settings.directHotkeys, ...nextSettings.directHotkeys }
        : this.settings.directHotkeys
    });

    return this.persistEmitAndReturn();
  }

  resetShortcuts(): AppSettings {
    this.settings = sanitizeSettings({
      ...this.settings,
      directHotkeys: buildDefaultDirectHotkeys(),
      chordActivator: DEFAULT_SETTINGS.chordActivator
    });

    return this.persistEmitAndReturn();
  }

  private persistEmitAndReturn(): AppSettings {
    this.store.save(this.settings);
    const emittedSettings = this.getSettings();
    this.emit("updated", emittedSettings);
    return this.getSettings();
  }
}
