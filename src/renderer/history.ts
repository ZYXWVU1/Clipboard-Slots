import { MAX_DIRECT_SLOT_SHORTCUTS } from "../common/defaults";
import type {
  AppSettings,
  AppView,
  ClipboardHistoryItem,
  HotkeyStatus
} from "../common/types";

interface SettingsState {
  settings: AppSettings;
  hotkeys: HotkeyStatus;
}

const historyView = document.querySelector<HTMLDivElement>("#history-view");
const settingsView = document.querySelector<HTMLDivElement>("#settings-view");
const historyList = document.querySelector<HTMLDivElement>("#history-list");
const historyStatusBanner = document.querySelector<HTMLDivElement>("#history-status");
const settingsStatusBanner = document.querySelector<HTMLDivElement>("#settings-status");
const summaryRoot = document.querySelector<HTMLDivElement>("#history-summary");
const openSettingsButton = document.querySelector<HTMLButtonElement>("#open-settings-button");
const viewHistoryButton = document.querySelector<HTMLButtonElement>("#view-history-button");
const settingsOpenHistoryButton = document.querySelector<HTMLButtonElement>(
  "#settings-open-history-button"
);
const clearHistoryButton = document.querySelector<HTMLButtonElement>("#clear-history-button");

const settingsForm = document.querySelector<HTMLFormElement>("#settings-form");
const shortcutGrid = document.querySelector<HTMLDivElement>("#shortcut-grid");
const heroBadges = document.querySelector<HTMLDivElement>("#hero-badges");
const hotkeyWarnings = document.querySelector<HTMLDivElement>("#hotkey-warnings");
const hotkeyStatusList = document.querySelector<HTMLDivElement>("#hotkey-status-list");
const saveButton = document.querySelector<HTMLButtonElement>("#save-button");
const resetShortcutsButton = document.querySelector<HTMLButtonElement>("#reset-shortcuts-button");
const settingsClearHistoryButton = document.querySelector<HTMLButtonElement>(
  "#settings-clear-history-button"
);

if (
  !historyView ||
  !settingsView ||
  !historyList ||
  !historyStatusBanner ||
  !settingsStatusBanner ||
  !summaryRoot ||
  !settingsForm ||
  !shortcutGrid ||
  !heroBadges ||
  !hotkeyWarnings ||
  !hotkeyStatusList
) {
  throw new Error("Main UI failed to initialize.");
}

let currentView: AppView = "history";
let items: ClipboardHistoryItem[] = [];
let settingsState: SettingsState | null = null;

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

const truncate = (value: string, maxLength = 220) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;

const showBanner = (
  target: HTMLDivElement,
  message: string,
  variant: "success" | "error" | "neutral" = "neutral"
) => {
  target.hidden = false;
  target.textContent = message;
  target.className =
    variant === "neutral" ? "status-banner" : `status-banner ${variant}`;
};

const setBusy = (busy: boolean) => {
  if (saveButton) {
    saveButton.disabled = busy;
  }
  if (resetShortcutsButton) {
    resetShortcutsButton.disabled = busy;
  }
  if (settingsClearHistoryButton) {
    settingsClearHistoryButton.disabled = busy;
  }
  if (clearHistoryButton) {
    clearHistoryButton.disabled = busy;
  }
};

const showView = (view: AppView) => {
  currentView = view;
  historyView.hidden = view !== "history";
  settingsView.hidden = view !== "settings";

  if (viewHistoryButton) {
    viewHistoryButton.className =
      view === "history" ? "button-primary" : "button-secondary";
  }
  if (openSettingsButton) {
    openSettingsButton.className =
      view === "settings" ? "button-primary" : "button-secondary";
  }
};

const renderSummary = () => {
  const pinnedCount = items.filter((item) => item.pinned).length;
  const latestItem = items.at(-1);

  summaryRoot.innerHTML = "";

  const entries = [
    {
      label: "Saved items",
      value: String(items.length)
    },
    {
      label: "Pinned",
      value: String(pinnedCount)
    },
    {
      label: "Latest slot",
      value: latestItem ? `Slot ${latestItem.slot}` : "None"
    }
  ];

  for (const entry of entries) {
    const card = document.createElement("section");
    card.className = "summary-card";

    const label = document.createElement("p");
    label.textContent = entry.label;

    const value = document.createElement("strong");
    value.textContent = entry.value;

    card.append(label, value);
    summaryRoot.append(card);
  }
};

const renderHistory = () => {
  renderSummary();
  historyList.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Nothing has been captured yet. Copy text normally to populate the slot list.";
    historyList.append(empty);
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "item-card";

    const head = document.createElement("div");
    head.className = "item-head";

    const titleBlock = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = `Slot ${item.slot}`;

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.innerHTML = `
      <span>${item.contentType.toUpperCase()}</span>
      <span>${formatTimestamp(item.timestamp)}</span>
      <span>${item.content.length} chars</span>
      <span>${item.pinned ? "Pinned" : "Unpinned"}</span>
    `;

    titleBlock.append(title, meta);

    const status = document.createElement("span");
    status.className = item.pinned ? "badge orange" : "badge";
    status.textContent = item.pinned ? "Pinned" : "Live";

    head.append(titleBlock, status);

    const preview = document.createElement("div");
    preview.className = "item-preview";
    preview.textContent = truncate(item.content);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const copyButton = document.createElement("button");
    copyButton.className = "button-secondary";
    copyButton.textContent = "Copy Again";
    copyButton.addEventListener("click", async () => {
      const result = await window.ctrlCvApi.copyHistoryItem(item.id);
      showBanner(historyStatusBanner, result.message, result.ok ? "success" : "error");
    });

    const pasteButton = document.createElement("button");
    pasteButton.className = "button-primary";
    pasteButton.textContent = "Paste Now";
    pasteButton.addEventListener("click", async () => {
      const result = await window.ctrlCvApi.pasteHistoryItem(item.id);
      showBanner(historyStatusBanner, result.message, result.ok ? "success" : "error");
    });

    const pinButton = document.createElement("button");
    pinButton.className = "button-ghost";
    pinButton.textContent = item.pinned ? "Unpin" : "Pin";
    pinButton.addEventListener("click", async () => {
      await window.ctrlCvApi.togglePin(item.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "button-danger";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", async () => {
      await window.ctrlCvApi.deleteHistoryItem(item.id);
    });

    actions.append(copyButton, pasteButton, pinButton, deleteButton);
    card.append(head, preview, actions);
    historyList.append(card);
  }
};

const renderSettingsHeroBadges = (settings: AppSettings) => {
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

const renderSettingsForm = (settings: AppSettings) => {
  const hotkeyModeInput = settingsForm.querySelector<HTMLInputElement>(
    `input[name="hotkeyMode"][value="${settings.hotkeyMode}"]`
  );
  if (hotkeyModeInput) {
    hotkeyModeInput.checked = true;
  }

  const assignValue = (selector: string, value: string | number | boolean) => {
    const input = settingsForm.querySelector<HTMLInputElement>(selector);
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
  renderSettingsHeroBadges(settings);
};

const applySettingsState = (nextState: SettingsState) => {
  settingsState = nextState;
  renderSettingsForm(nextState.settings);
  renderHotkeyStatus(nextState.hotkeys);
};

const collectSettingsFromForm = (): Partial<AppSettings> => {
  const formData = new FormData(settingsForm);
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

const refreshHistory = async () => {
  items = await window.ctrlCvApi.getHistory();
  renderHistory();
};

const initializeSettings = async () => {
  const [settings, hotkeys] = await Promise.all([
    window.ctrlCvApi.getSettings(),
    window.ctrlCvApi.getHotkeyStatus()
  ]);

  applySettingsState({ settings, hotkeys });
};

clearHistoryButton?.addEventListener("click", async () => {
  await window.ctrlCvApi.clearHistory();
  showBanner(historyStatusBanner, "Clipboard history cleared.", "success");
});

settingsClearHistoryButton?.addEventListener("click", async () => {
  setBusy(true);

  try {
    await window.ctrlCvApi.clearHistory();
    showBanner(settingsStatusBanner, "Clipboard history cleared.", "success");
  } catch {
    showBanner(settingsStatusBanner, "Clipboard history could not be cleared.", "error");
  } finally {
    setBusy(false);
  }
});

openSettingsButton?.addEventListener("click", () => {
  showView("settings");
});

viewHistoryButton?.addEventListener("click", () => {
  showView("history");
});

settingsOpenHistoryButton?.addEventListener("click", () => {
  showView("history");
});

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(true);

  try {
    const result = await window.ctrlCvApi.saveSettings(collectSettingsFromForm());
    applySettingsState({
      settings: result.settings,
      hotkeys: result.hotkeyStatus
    });
    showBanner(settingsStatusBanner, "Settings saved.", "success");
  } catch {
    showBanner(settingsStatusBanner, "Settings could not be saved.", "error");
  } finally {
    setBusy(false);
  }
});

resetShortcutsButton?.addEventListener("click", async () => {
  setBusy(true);

  try {
    const result = await window.ctrlCvApi.resetShortcuts();
    applySettingsState({
      settings: result.settings,
      hotkeys: result.hotkeyStatus
    });
    showBanner(settingsStatusBanner, "Shortcut fields were reset to the defaults.", "success");
  } catch {
    showBanner(settingsStatusBanner, "Shortcut reset failed.", "error");
  } finally {
    setBusy(false);
  }
});

window.ctrlCvApi.onHistoryChanged((nextItems) => {
  items = nextItems;
  renderHistory();
});

window.ctrlCvApi.onSettingsChanged((settings) => {
  if (!settingsState) {
    return;
  }

  applySettingsState({
    settings,
    hotkeys: settingsState.hotkeys
  });
});

window.ctrlCvApi.onHotkeysChanged((hotkeys) => {
  if (!settingsState) {
    return;
  }

  applySettingsState({
    settings: settingsState.settings,
    hotkeys
  });
});

window.ctrlCvApi.onAppViewChanged((view) => {
  showView(view);
});

showView(currentView);
void Promise.all([refreshHistory(), initializeSettings()]);
