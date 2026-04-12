import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import path from "node:path";
import type { AppSettings, ClipboardHistoryItem } from "../../common/types";
import { JsonFileStore } from "./file-store";

const HISTORY_FILE_NAME = "history.json";

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const cloneItem = (item: ClipboardHistoryItem): ClipboardHistoryItem => ({ ...item });

const sanitizeHistoryItem = (
  value: unknown,
  index: number
): ClipboardHistoryItem | null => {
  if (!isObject(value)) {
    return null;
  }
  if (typeof value.content !== "string" || !value.content) {
    return null;
  }

  return {
    id: typeof value.id === "string" && value.id ? value.id : randomUUID(),
    slot: index + 1,
    content: value.content,
    contentType: "text",
    timestamp:
      typeof value.timestamp === "string" && value.timestamp
        ? value.timestamp
        : new Date().toISOString(),
    pinned: Boolean(value.pinned)
  };
};

export class HistoryStore extends EventEmitter {
  private readonly store: JsonFileStore<ClipboardHistoryItem[]>;
  private items: ClipboardHistoryItem[] = [];

  constructor(
    baseDirectory: string,
    private readonly getSettings: () => AppSettings
  ) {
    super();
    this.store = new JsonFileStore<ClipboardHistoryItem[]>(
      path.join(baseDirectory, HISTORY_FILE_NAME),
      () => []
    );
  }

  load(): ClipboardHistoryItem[] {
    const settings = this.getSettings();
    const rawItems = settings.persistHistory ? this.store.load() : [];
    this.items = this.sanitizeItems(rawItems);
    this.enforceMaxHistory(settings.maxHistory);
    this.persistIfEnabled();
    return this.getAll();
  }

  getAll(): ClipboardHistoryItem[] {
    return this.items.map(cloneItem);
  }

  getById(id: string): ClipboardHistoryItem | undefined {
    const match = this.items.find((item) => item.id === id);
    return match ? cloneItem(match) : undefined;
  }

  getBySlot(slot: number): ClipboardHistoryItem | undefined {
    const match = this.items.find((item) => item.slot === slot);
    return match ? cloneItem(match) : undefined;
  }

  addText(content: string): ClipboardHistoryItem | null {
    if (!content) {
      return null;
    }

    const settings = this.getSettings();
    const latest = this.items.at(-1);
    if (
      settings.deduplicateConsecutive &&
      latest &&
      latest.contentType === "text" &&
      latest.content === content
    ) {
      return null;
    }

    const nextItem: ClipboardHistoryItem = {
      id: randomUUID(),
      slot: this.items.length + 1,
      content,
      contentType: "text",
      timestamp: new Date().toISOString(),
      pinned: false
    };

    this.items.push(nextItem);
    this.enforceMaxHistory(settings.maxHistory);
    this.recalculateSlots();
    this.persistAndEmit();
    return cloneItem(nextItem);
  }

  delete(id: string): void {
    const nextItems = this.items.filter((item) => item.id !== id);
    if (nextItems.length === this.items.length) {
      return;
    }
    this.items = nextItems;
    this.recalculateSlots();
    this.persistAndEmit();
  }

  clear(): void {
    if (this.items.length === 0) {
      return;
    }
    this.items = [];
    this.persistAndEmit();
  }

  togglePin(id: string): void {
    let changed = false;
    this.items = this.items.map((item) => {
      if (item.id !== id) {
        return item;
      }
      changed = true;
      return { ...item, pinned: !item.pinned };
    });
    if (!changed) {
      return;
    }
    this.persistAndEmit();
  }

  applySettings(): void {
    this.enforceMaxHistory(this.getSettings().maxHistory);
    this.recalculateSlots();
    this.persistAndEmit();
  }

  private sanitizeItems(rawItems: unknown): ClipboardHistoryItem[] {
    if (!Array.isArray(rawItems)) {
      return [];
    }

    return rawItems
      .map((value, index) => sanitizeHistoryItem(value, index))
      .filter((value): value is ClipboardHistoryItem => Boolean(value));
  }

  private enforceMaxHistory(maxHistory: number): void {
    while (this.items.length > maxHistory) {
      const unpinnedIndex = this.items.findIndex((item) => !item.pinned);
      const indexToRemove = unpinnedIndex >= 0 ? unpinnedIndex : 0;
      this.items.splice(indexToRemove, 1);
    }
  }

  private recalculateSlots(): void {
    this.items = this.items.map((item, index) => ({
      ...item,
      slot: index + 1
    }));
  }

  private persistIfEnabled(): void {
    if (this.getSettings().persistHistory) {
      this.store.save(this.items);
      return;
    }
    this.store.delete();
  }

  private persistAndEmit(): void {
    this.persistIfEnabled();
    this.emit("updated", this.getAll());
  }
}
