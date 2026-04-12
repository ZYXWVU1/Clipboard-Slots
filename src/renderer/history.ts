import type { ClipboardHistoryItem } from "../common/types";

const historyList = document.querySelector<HTMLDivElement>("#history-list");
const statusBanner = document.querySelector<HTMLDivElement>("#history-status");
const summaryRoot = document.querySelector<HTMLDivElement>("#history-summary");
const openSettingsButton = document.querySelector<HTMLButtonElement>("#open-settings-button");
const refreshButton = document.querySelector<HTMLButtonElement>("#refresh-button");
const clearHistoryButton = document.querySelector<HTMLButtonElement>("#clear-history-button");

if (!historyList || !statusBanner || !summaryRoot) {
  throw new Error("History UI failed to initialize.");
}

let items: ClipboardHistoryItem[] = [];

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

const truncate = (value: string, maxLength = 220) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;

const showBanner = (
  message: string,
  variant: "success" | "error" | "neutral" = "neutral"
) => {
  statusBanner.hidden = false;
  statusBanner.textContent = message;
  statusBanner.className =
    variant === "neutral" ? "status-banner" : `status-banner ${variant}`;
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
      showBanner(result.message, result.ok ? "success" : "error");
    });

    const pasteButton = document.createElement("button");
    pasteButton.className = "button-primary";
    pasteButton.textContent = "Paste Now";
    pasteButton.addEventListener("click", async () => {
      const result = await window.ctrlCvApi.pasteHistoryItem(item.id);
      showBanner(result.message, result.ok ? "success" : "error");
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

const refresh = async () => {
  items = await window.ctrlCvApi.getHistory();
  renderHistory();
};

refreshButton?.addEventListener("click", () => {
  void refresh();
});

clearHistoryButton?.addEventListener("click", async () => {
  await window.ctrlCvApi.clearHistory();
  showBanner("Clipboard history cleared.", "success");
});

openSettingsButton?.addEventListener("click", async () => {
  await window.ctrlCvApi.openSettings();
});

window.ctrlCvApi.onHistoryChanged((nextItems) => {
  items = nextItems;
  renderHistory();
});

void refresh();
