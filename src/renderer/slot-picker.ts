import type { ClipboardHistoryItem, SlotPickerContext } from "../common/types";

const form = document.querySelector<HTMLFormElement>("#picker-form");
const slotInput = document.querySelector<HTMLInputElement>("#slot-input");
const pickerList = document.querySelector<HTMLDivElement>("#picker-list");
const statusBanner = document.querySelector<HTMLDivElement>("#picker-status");
const cancelButton = document.querySelector<HTMLButtonElement>("#cancel-button");

if (!form || !slotInput || !pickerList || !statusBanner) {
  throw new Error("Slot picker UI failed to initialize.");
}

let context: SlotPickerContext | null = null;
let timeoutHandle: number | undefined;

const truncate = (value: string, maxLength = 120) =>
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

const startTimeout = () => {
  if (!context) {
    return;
  }

  if (timeoutHandle) {
    window.clearTimeout(timeoutHandle);
  }

  timeoutHandle = window.setTimeout(async () => {
    await window.ctrlCvApi.cancelSlotPicker();
  }, context.timeoutMs);
};

const renderItems = (items: ClipboardHistoryItem[]) => {
  pickerList.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No slots are available yet.";
    pickerList.append(empty);
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "item-card";

    const head = document.createElement("div");
    head.className = "item-head";

    const title = document.createElement("h3");
    title.textContent = `Slot ${item.slot}`;

    const stamp = document.createElement("span");
    stamp.className = item.pinned ? "badge orange" : "badge";
    stamp.textContent = item.pinned ? "Pinned" : "Ready";

    head.append(title, stamp);

    const preview = document.createElement("div");
    preview.className = "item-preview";
    preview.textContent = truncate(item.content);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const pasteButton = document.createElement("button");
    pasteButton.className = "button-primary";
    pasteButton.textContent = `Paste Slot ${item.slot}`;
    pasteButton.addEventListener("click", async () => {
      const result = await window.ctrlCvApi.submitSlotPicker(item.slot);
      showBanner(result.message, result.ok ? "success" : "error");
    });

    actions.append(pasteButton);
    card.append(head, preview, actions);
    pickerList.append(card);
  }
};

const initialize = async () => {
  context = await window.ctrlCvApi.getSlotPickerContext();
  renderItems(context.items);
  slotInput.focus();
  slotInput.select();
  startTimeout();
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const slot = Number(slotInput.value);
  if (!Number.isInteger(slot) || slot < 1) {
    showBanner("Enter a valid slot number.", "error");
    return;
  }

  const result = await window.ctrlCvApi.submitSlotPicker(slot);
  showBanner(result.message, result.ok ? "success" : "error");
});

cancelButton?.addEventListener("click", async () => {
  await window.ctrlCvApi.cancelSlotPicker();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    void window.ctrlCvApi.cancelSlotPicker();
  }
});

window.addEventListener("focus", () => {
  void initialize();
});

window.ctrlCvApi.onHistoryChanged((items) => {
  if (!context) {
    return;
  }
  context = {
    ...context,
    items
  };
  renderItems(items);
  startTimeout();
});

void initialize();
