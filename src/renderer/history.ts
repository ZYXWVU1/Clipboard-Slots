import { MAX_DIRECT_SLOT_SHORTCUTS } from "../common/defaults";
import { DEFAULT_LOCALE, t, type TranslationKey } from "../common/i18n";
import type {
  AppSettings,
  AppView,
  ClipboardHistoryItem,
  HotkeyStatus,
  SupportedLocale
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
const languageSelect = document.querySelector<HTMLSelectElement>("#language");

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
  !hotkeyStatusList ||
  !languageSelect
) {
  throw new Error("Main UI failed to initialize.");
}

let currentView: AppView = "history";
let items: ClipboardHistoryItem[] = [];
let settingsState: SettingsState | null = null;
let editingItemId: string | null = null;
let editingDraft = "";

const getLocale = (): SupportedLocale => settingsState?.settings.locale ?? DEFAULT_LOCALE;

const translate = (
  key: TranslationKey,
  params: Record<string, string | number> = {}
): string => t(getLocale(), key, params);

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat(getLocale(), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

const truncate = (value: string, maxLength = 220) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;

const applyStaticTranslations = () => {
  const locale = getLocale();
  document.documentElement.lang = locale;

  for (const element of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = element.dataset.i18n as TranslationKey | undefined;
    if (!key) {
      continue;
    }

    const message = t(locale, key);
    if (element.tagName === "TITLE") {
      document.title = message;
      continue;
    }

    element.textContent = message;
  }

  for (const element of document.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement
  >("[data-i18n-placeholder]")) {
    const key = element.dataset.i18nPlaceholder as TranslationKey | undefined;
    if (!key) {
      continue;
    }

    element.placeholder = t(locale, key);
  }
};

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

  if (openSettingsButton) {
    openSettingsButton.className =
      view === "settings" ? "button-primary" : "button-secondary";
  }
};

const getContentTypeLabel = (item: ClipboardHistoryItem) => {
  if (item.contentType === "text") {
    return translate("history.contentType.text");
  }

  return item.contentType;
};

const renderSummary = () => {
  const pinnedCount = items.filter((item) => item.pinned).length;
  const latestItem = items.at(-1);

  summaryRoot.innerHTML = "";

  const entries = [
    {
      label: translate("summary.savedItems"),
      value: String(items.length)
    },
    {
      label: translate("summary.pinned"),
      value: String(pinnedCount)
    },
    {
      label: translate("summary.latestSlot"),
      value: latestItem
        ? translate("history.slotLabel", { slot: latestItem.slot })
        : translate("common.none")
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
  if (editingItemId && !items.some((item) => item.id === editingItemId)) {
    editingItemId = null;
    editingDraft = "";
  }

  renderSummary();
  historyList.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = translate("history.empty");
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
    title.textContent = translate("history.slotLabel", { slot: item.slot });

    const meta = document.createElement("div");
    meta.className = "item-meta";

    for (const value of [
      getContentTypeLabel(item),
      formatTimestamp(item.timestamp),
      translate("history.charCount", { count: item.content.length }),
      item.pinned ? translate("history.pinned") : translate("history.unpinned")
    ]) {
      const chip = document.createElement("span");
      chip.textContent = value;
      meta.append(chip);
    }

    titleBlock.append(title, meta);

    const status = document.createElement("span");
    status.className = item.pinned ? "badge orange" : "badge";
    status.textContent = item.pinned
      ? translate("history.pinned")
      : translate("history.live");

    head.append(titleBlock, status);

    const preview = document.createElement("div");
    preview.className = "item-preview";
    if (editingItemId === item.id) {
      const editorField = document.createElement("label");
      editorField.className = "editor-field";

      const editorLabel = document.createElement("span");
      editorLabel.className = "field-help";
      editorLabel.textContent = translate("history.editLabel");

      const editor = document.createElement("textarea");
      editor.className = "slot-editor";
      editor.rows = 5;
      editor.value = editingDraft;
      editor.addEventListener("input", () => {
        editingDraft = editor.value;
      });

      editorField.append(editorLabel, editor);
      preview.append(editorField);
    } else {
      preview.textContent = truncate(item.content);
    }

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const copyButton = document.createElement("button");
    copyButton.className = "button-secondary";
    copyButton.textContent = translate("history.copyAgain");
    copyButton.addEventListener("click", async () => {
      const result = await window.ctrlCvApi.copyHistoryItem(item.id);
      showBanner(historyStatusBanner, result.message, result.ok ? "success" : "error");
    });

    const editButton = document.createElement("button");
    if (editingItemId === item.id) {
      editButton.className = "button-primary";
      editButton.textContent = translate("history.saveEdit");
      editButton.addEventListener("click", async () => {
        const result = await window.ctrlCvApi.updateHistoryItem(item.id, editingDraft);
        showBanner(historyStatusBanner, result.message, result.ok ? "success" : "error");
        if (result.ok) {
          editingItemId = null;
          editingDraft = "";
          renderHistory();
        }
      });
    } else {
      editButton.className = "button-primary";
      editButton.textContent = translate("history.edit");
      editButton.addEventListener("click", () => {
        editingItemId = item.id;
        editingDraft = item.content;
        renderHistory();
      });
    }

    const cancelEditButton = document.createElement("button");
    cancelEditButton.className = "button-secondary";
    cancelEditButton.textContent = translate("history.cancelEdit");
    cancelEditButton.addEventListener("click", () => {
      editingItemId = null;
      editingDraft = "";
      renderHistory();
    });

    const pinButton = document.createElement("button");
    pinButton.className = "button-ghost";
    pinButton.textContent = item.pinned
      ? translate("history.unpin")
      : translate("history.pin");
    pinButton.addEventListener("click", async () => {
      await window.ctrlCvApi.togglePin(item.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "button-danger";
    deleteButton.textContent = translate("history.delete");
    deleteButton.addEventListener("click", async () => {
      await window.ctrlCvApi.deleteHistoryItem(item.id);
    });

    actions.append(copyButton, editButton);
    if (editingItemId === item.id) {
      actions.append(cancelEditButton);
    }
    actions.append(pinButton, deleteButton);
    card.append(head, preview, actions);
    historyList.append(card);
  }
};

const renderSettingsHeroBadges = (settings: AppSettings) => {
  heroBadges.innerHTML = "";

  const badges = [
    {
      label:
        settings.hotkeyMode === "direct"
          ? translate("settings.badge.direct")
          : translate("settings.badge.chord"),
      className: "badge teal"
    },
    {
      label: translate("settings.badge.savedSlots", {
        count: settings.maxHistory
      }),
      className: "badge orange"
    },
    {
      label: settings.persistHistory
        ? translate("settings.badge.persistent")
        : translate("settings.badge.temporary"),
      className: settings.persistHistory ? "badge" : "badge red"
    },
    {
      label: settings.restoreClipboardAfterPaste
        ? translate("settings.badge.restoreOn")
        : translate("settings.badge.restoreOff"),
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
    chip.textContent = translate("history.slotLabel", { slot });

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
        ? translate("hotkeys.registration.slot", {
            slot: registration.slot ?? "?",
            accelerator: registration.accelerator
          })
        : translate("hotkeys.registration.chord", {
            accelerator: registration.accelerator
          });

    const detail = document.createElement("div");
    detail.textContent =
      registration.status === "registered"
        ? translate("hotkeys.registered")
        : registration.reason ?? translate("hotkey.registerFailed");

    row.append(title, detail);
    hotkeyStatusList.append(row);
  }

  if (hotkeys.registrations.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = translate("hotkeys.empty");
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
    const input = settingsForm.querySelector<HTMLInputElement | HTMLSelectElement>(selector);
    if (!input) {
      return;
    }

    if (input instanceof HTMLInputElement && input.type === "checkbox") {
      input.checked = Boolean(value);
      return;
    }

    input.value = String(value);
  };

  assignValue("#language", settings.locale);
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
  applyStaticTranslations();
  renderSettingsForm(nextState.settings);
  renderHotkeyStatus(nextState.hotkeys);
  renderHistory();
};

const collectSettingsFromForm = (): Partial<AppSettings> => {
  const formData = new FormData(settingsForm);
  const directHotkeys: Record<number, string> = {};

  for (let slot = 1; slot <= MAX_DIRECT_SLOT_SHORTCUTS; slot += 1) {
    directHotkeys[slot] = String(formData.get(`directHotkey-${slot}`) ?? "").trim();
  }

  return {
    locale: String(formData.get("language") ?? DEFAULT_LOCALE) as SupportedLocale,
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
  try {
    await window.ctrlCvApi.clearHistory();
    showBanner(historyStatusBanner, translate("message.historyCleared"), "success");
  } catch {
    showBanner(historyStatusBanner, translate("message.historyClearFailed"), "error");
  }
});

settingsClearHistoryButton?.addEventListener("click", async () => {
  setBusy(true);

  try {
    await window.ctrlCvApi.clearHistory();
    showBanner(settingsStatusBanner, translate("message.historyCleared"), "success");
  } catch {
    showBanner(settingsStatusBanner, translate("message.historyClearFailed"), "error");
  } finally {
    setBusy(false);
  }
});

openSettingsButton?.addEventListener("click", () => {
  showView("settings");
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
    showBanner(settingsStatusBanner, translate("message.settingsSaved"), "success");
  } catch {
    showBanner(settingsStatusBanner, translate("message.settingsSaveFailed"), "error");
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
    showBanner(settingsStatusBanner, translate("message.shortcutsReset"), "success");
  } catch {
    showBanner(settingsStatusBanner, translate("message.shortcutsResetFailed"), "error");
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
applyStaticTranslations();
void Promise.all([refreshHistory(), initializeSettings()]);
