import { MAX_DIRECT_SLOT_SHORTCUTS } from "../common/defaults";
import type { AppSettings, HotkeyStatus } from "../common/types";

interface SettingsState {
  settings: AppSettings;
  hotkeys: HotkeyStatus;
}

const form = document.querySelector<HTMLFormElement>("#settings-form");
const shortcutGrid = document.querySelector<HTMLDivElement>("#shortcut-grid");
const statusBanner = document.querySelector<HTMLDivElement>("#settings-status");
const heroBadges = document.querySelector<HTMLDivElement>("#hero-badges");
const hotkeyWarnings = document.querySelector<HTMLDivElement>("#hotkey-warnings");
const hotkeyStatusList = document.querySelector<HTMLDivElement>("#hotkey-status-list");
const saveButton = document.querySelector<HTMLButtonElement>("#save-button");
const resetShortcutsButton = document.querySelector<HTMLButtonElement>("#reset-shortcuts-button");
const clearHistoryButton = document.querySelector<HTMLButtonElement>("#clear-history-button");
const openHistoryButton = document.querySelector<HTMLButtonElement>("#open-history-button");

if (!form || !shortcutGrid || !statusBanner || !heroBadges || !hotkeyWarnings || !hotkeyStatusList) {
  throw new Error("Settings UI failed to initialize.");
}

let state: SettingsState | null = null;

const showBanner = (
  message: string,
  variant: "success" | "error" | "neutral" = "neutral"
) => {
  statusBanner.hidden = false;
  statusBanner.textContent = message;
  statusBanner.className =
    variant === "neutral" ? "status-banner" : `status-banner ${variant}`;
};

const setBusy = (busy: boolean) => {
  if (saveButton) {
    saveButton.disabled = busy;
  }
  if (resetShortcutsButton) {
    resetShortcutsButton.disabled = busy;
  }
  if (clearHistoryButton) {
    clearHistoryButton.disabled = busy;
  }
};

const renderHeroBadges = (settings: AppSettings) => {
  heroBadges.innerHTML = "";

  const badges = [
    {
      label: settings.hotkeyMode === "direct" ? "Direct hotkeys active" : "Chord picker active",
      className: "badge teal"
    },
    {
      label: `${settings.maxHistory} saved slots`,
      className: "badge orange"
    },
    {
      label: settings.persistHistory ? "Persistent history" : "Temporary history",
      className: settings.persistHistory ? "badge" : "badge red"
    },
    {
      label: settings.restoreClipboardAfterPaste ? "Clipboard restore on" : "Clipboard restore off",
      className: "badge"
    }
  ];

  for (const badge of badges) {
    const element = document.createElement("span");
    element.className = badge.className;
    element.textContent = badge.label;
    heroBadges.append(element);
  }
};

const renderShortcutInputs = (settings: AppSettings) => {
  shortcutGrid.innerHTML = "";

  for (let slot = 1; slot <= MAX_DIRECT_SLOT_SHORTCUTS; slot += 1) {
    const row = document.createElement("div");
    row.className = "shortcut-row";

    const chip = document.createElement("div");
    chip.className = "slot-chip";
    chip.textContent = `Slot ${slot}`;

    const input = document.createElement("input");
    input.type = "text";
    input.name = `directHotkey-${slot}`;
    input.value = settings.directHotkeys[slot] ?? "";
    input.placeholder = `CommandOrControl+Alt+${slot}`;

    row.append(chip, input);
    shortcutGrid.append(row);
  }
};

const renderHotkeyStatus = (hotkeys: HotkeyStatus) => {
  hotkeyWarnings.innerHTML = "";
  hotkeyStatusList.innerHTML = "";

  for (const warning of hotkeys.warnings) {
    const badge = document.createElement("span");
    badge.className = "status-pill orange";
    badge.textContent = warning;
    hotkeyWarnings.append(badge);
  }

  for (const registration of hotkeys.registrations) {
    const row = document.createElement("div");
    row.className = "status-row";

    const title = document.createElement("strong");
    title.textContent =
      registration.kind === "slot"
        ? `Slot ${registration.slot}: ${registration.accelerator}`
        : `Chord activator: ${registration.accelerator}`;

    const detail = document.createElement("div");
    detail.textContent =
      registration.status === "registered"
        ? "Registered successfully."
        : registration.reason ?? "Registration failed.";

    row.append(title, detail);
    hotkeyStatusList.append(row);
  }

  if (hotkeys.registrations.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No hotkeys are registered yet.";
    hotkeyStatusList.append(empty);
  }
};

const renderForm = (settings: AppSettings) => {
  const hotkeyModeInput = form.querySelector<HTMLInputElement>(
    `input[name="hotkeyMode"][value="${settings.hotkeyMode}"]`
  );
  if (hotkeyModeInput) {
    hotkeyModeInput.checked = true;
  }

  const assignValue = (selector: string, value: string | number | boolean) => {
    const input = form.querySelector<HTMLInputElement>(selector);
    if (!input) {
      return;
    }

    if (input.type === "checkbox") {
      input.checked = Boolean(value);
      return;
    }

    input.value = String(value);
  };

  assignValue("#chordActivator", settings.chordActivator);
  assignValue("#chordTimeoutMs", settings.chordTimeoutMs);
  assignValue("#maxHistory", settings.maxHistory);
  assignValue("#clipboardPollIntervalMs", settings.clipboardPollIntervalMs);
  assignValue("#deduplicateConsecutive", settings.deduplicateConsecutive);
  assignValue("#restoreClipboardAfterPaste", settings.restoreClipboardAfterPaste);
  assignValue("#startOnBoot", settings.startOnBoot);
  assignValue("#persistHistory", settings.persistHistory);

  renderShortcutInputs(settings);
  renderHeroBadges(settings);
};

const collectSettingsFromForm = (): Partial<AppSettings> => {
  const formData = new FormData(form);
  const directHotkeys: Record<number, string> = {};

  for (let slot = 1; slot <= MAX_DIRECT_SLOT_SHORTCUTS; slot += 1) {
    directHotkeys[slot] = String(formData.get(`directHotkey-${slot}`) ?? "").trim();
  }

  return {
    hotkeyMode: String(formData.get("hotkeyMode")) === "chord" ? "chord" : "direct",
    chordActivator: String(formData.get("chordActivator") ?? "").trim(),
    chordTimeoutMs: Number(formData.get("chordTimeoutMs") ?? 0),
    maxHistory: Number(formData.get("maxHistory") ?? 0),
    clipboardPollIntervalMs: Number(formData.get("clipboardPollIntervalMs") ?? 0),
    deduplicateConsecutive: formData.get("deduplicateConsecutive") === "on",
    restoreClipboardAfterPaste: formData.get("restoreClipboardAfterPaste") === "on",
    startOnBoot: formData.get("startOnBoot") === "on",
    persistHistory: formData.get("persistHistory") === "on",
    directHotkeys
  };
};

const applyState = (nextState: SettingsState) => {
  state = nextState;
  renderForm(nextState.settings);
  renderHotkeyStatus(nextState.hotkeys);
};

const initialize = async () => {
  const [settings, hotkeys] = await Promise.all([
    window.ctrlCvApi.getSettings(),
    window.ctrlCvApi.getHotkeyStatus()
  ]);

  applyState({ settings, hotkeys });
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(true);

  try {
    const result = await window.ctrlCvApi.saveSettings(collectSettingsFromForm());
    applyState({
      settings: result.settings,
      hotkeys: result.hotkeyStatus
    });
    showBanner("Settings saved.", "success");
  } catch {
    showBanner("Settings could not be saved.", "error");
  } finally {
    setBusy(false);
  }
});

resetShortcutsButton?.addEventListener("click", async () => {
  setBusy(true);

  try {
    const result = await window.ctrlCvApi.resetShortcuts();
    applyState({
      settings: result.settings,
      hotkeys: result.hotkeyStatus
    });
    showBanner("Shortcut fields were reset to the defaults.", "success");
  } catch {
    showBanner("Shortcut reset failed.", "error");
  } finally {
    setBusy(false);
  }
});

clearHistoryButton?.addEventListener("click", async () => {
  setBusy(true);

  try {
    await window.ctrlCvApi.clearHistory();
    showBanner("Clipboard history cleared.", "success");
  } catch {
    showBanner("Clipboard history could not be cleared.", "error");
  } finally {
    setBusy(false);
  }
});

openHistoryButton?.addEventListener("click", async () => {
  await window.ctrlCvApi.openHistory();
});

window.ctrlCvApi.onSettingsChanged((settings) => {
  if (!state) {
    return;
  }
  applyState({
    settings,
    hotkeys: state.hotkeys
  });
});

window.ctrlCvApi.onHotkeysChanged((hotkeys) => {
  if (!state) {
    return;
  }
  applyState({
    settings: state.settings,
    hotkeys
  });
});

void initialize();
