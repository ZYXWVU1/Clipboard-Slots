import { createHash, randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import path from "node:path";
import type { AppSettings, ClipboardHistoryItem } from "../../common/types";
import { JsonFileStore } from "./file-store";
import { ImageStore } from "./image-store";

const HISTORY_FILE_NAME = "history.json";
const IMAGE_CONTENT_LABEL = "Image";

type StoredHistoryItem = ClipboardHistoryItem & {
  imageFingerprint?: string;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toPositiveInteger = (value: unknown): number | null => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
};

export class HistoryStore extends EventEmitter {
  private readonly store: JsonFileStore<StoredHistoryItem[]>;
  private items: StoredHistoryItem[] = [];

  constructor(
    baseDirectory: string,
    private readonly imageStore: ImageStore,
    private readonly getSettings: () => AppSettings
  ) {
    super();
    this.store = new JsonFileStore<StoredHistoryItem[]>(
      path.join(baseDirectory, HISTORY_FILE_NAME),
      () => []
    );
  }

  load(): ClipboardHistoryItem[] {
    const settings = this.getSettings();

    if (!settings.persistHistory) {
      this.items = [];
      this.store.delete();
      this.imageStore.clear();
      return this.getAll();
    }

    this.items = this.sanitizeItems(this.store.load());
    this.enforceMaxHistory(settings.maxHistory);
    this.persistIfEnabled();
    return this.getAll();
  }

  getAll(): ClipboardHistoryItem[] {
    return this.items.map((item) => this.cloneItem(item));
  }

  getById(id: string): ClipboardHistoryItem | undefined {
    const match = this.items.find((item) => item.id === id);
    return match ? this.cloneItem(match) : undefined;
  }

  getBySlot(slot: number): ClipboardHistoryItem | undefined {
    const match = this.items.find((item) => item.slot === slot);
    return match ? this.cloneItem(match) : undefined;
  }

  addText(content: string): ClipboardHistoryItem | null {
    if (!content) {
      return null;
    }

    const settings = this.getSettings();
    const latest = this.items.at(-1);
    if (
      settings.deduplicateConsecutive &&
      latest?.contentType === "text" &&
      latest.content === content
    ) {
      return null;
    }

    const id = randomUUID();
    const nextItem: StoredHistoryItem = {
      id,
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
    return this.getById(id) ?? null;
  }

  addImage(input: {
    pngBytes: Buffer;
    width: number;
    height: number;
    fingerprint: string;
  }): ClipboardHistoryItem | null {
    const settings = this.getSettings();
    const latest = this.items.at(-1);
    if (
      settings.deduplicateConsecutive &&
      latest?.contentType === "image" &&
      latest.imageFingerprint === input.fingerprint
    ) {
      return null;
    }

    try {
      const id = randomUUID();
      const imageRelativePath = this.imageStore.savePng(id, input.pngBytes);
      const nextItem: StoredHistoryItem = {
        id,
        slot: this.items.length + 1,
        content: IMAGE_CONTENT_LABEL,
        contentType: "image",
        timestamp: new Date().toISOString(),
        pinned: false,
        imageRelativePath,
        imageWidth: input.width,
        imageHeight: input.height,
        imageFingerprint: input.fingerprint
      };

      this.items.push(nextItem);
      this.enforceMaxHistory(settings.maxHistory);
      this.recalculateSlots();
      this.persistAndEmit();
      return this.getById(id) ?? null;
    } catch {
      return null;
    }
  }

  delete(id: string): void {
    const nextItems = this.items.filter((item) => item.id !== id);
    if (nextItems.length === this.items.length) {
      return;
    }

    this.removeAssets(this.items.filter((item) => item.id === id));
    this.items = nextItems;
    this.recalculateSlots();
    this.persistAndEmit();
  }

  updateContent(id: string, content: string): ClipboardHistoryItem | undefined {
    let updatedItem: StoredHistoryItem | undefined;

    this.items = this.items.map((item) => {
      if (item.id !== id || item.contentType !== "text") {
        return item;
      }

      updatedItem = {
        ...item,
        content
      };
      return updatedItem;
    });

    if (!updatedItem) {
      return undefined;
    }

    this.persistAndEmit();
    return this.cloneItem(updatedItem);
  }

  clear(): void {
    if (this.items.length === 0) {
      this.store.delete();
      this.imageStore.clear();
      return;
    }

    this.removeAssets(this.items);
    this.items = [];
    this.imageStore.clear();
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

  private sanitizeItems(rawItems: unknown): StoredHistoryItem[] {
    if (!Array.isArray(rawItems)) {
      return [];
    }

    const sanitizedItems: StoredHistoryItem[] = [];

    for (const [index, value] of rawItems.entries()) {
      const nextItem = this.sanitizeHistoryItem(value, index);
      if (nextItem) {
        sanitizedItems.push(nextItem);
      }
    }

    return sanitizedItems;
  }

  private sanitizeHistoryItem(value: unknown, index: number): StoredHistoryItem | null {
    if (!isObject(value)) {
      return null;
    }

    const id = typeof value.id === "string" && value.id ? value.id : randomUUID();
    const timestamp =
      typeof value.timestamp === "string" && value.timestamp
        ? value.timestamp
        : new Date().toISOString();
    const pinned = Boolean(value.pinned);

    if (value.contentType === "image") {
      const relativePath =
        typeof value.imageRelativePath === "string" && value.imageRelativePath
          ? value.imageRelativePath
          : "";
      const width = toPositiveInteger(value.imageWidth);
      const height = toPositiveInteger(value.imageHeight);

      if (!relativePath || !width || !height || !this.imageStore.exists(relativePath)) {
        if (relativePath) {
          this.imageStore.delete(relativePath);
        }
        return null;
      }

      const pngBytes = this.imageStore.read(relativePath);

      return {
        id,
        slot: index + 1,
        content: IMAGE_CONTENT_LABEL,
        contentType: "image",
        timestamp,
        pinned,
        imageRelativePath: relativePath,
        imageWidth: width,
        imageHeight: height,
        imageFingerprint: createHash("sha256").update(pngBytes).digest("hex")
      };
    }

    if (typeof value.content !== "string" || value.content.length === 0) {
      return null;
    }

    return {
      id,
      slot: index + 1,
      content: value.content,
      contentType: "text",
      timestamp,
      pinned
    };
  }

  private cloneItem(item: StoredHistoryItem): ClipboardHistoryItem {
    return {
      id: item.id,
      slot: item.slot,
      content: item.content,
      contentType: item.contentType,
      timestamp: item.timestamp,
      pinned: item.pinned,
      imageRelativePath: item.imageRelativePath,
      imageWidth: item.imageWidth,
      imageHeight: item.imageHeight,
      imagePreviewUrl: item.imageRelativePath
        ? this.imageStore.toFileUrl(item.imageRelativePath)
        : undefined
    };
  }

  private removeAssets(items: StoredHistoryItem[]): void {
    for (const item of items) {
      if (item.contentType === "image") {
        this.imageStore.delete(item.imageRelativePath);
      }
    }
  }

  private enforceMaxHistory(maxHistory: number): void {
    while (this.items.length > maxHistory) {
      const unpinnedIndex = this.items.findIndex((item) => !item.pinned);
      const indexToRemove = unpinnedIndex >= 0 ? unpinnedIndex : 0;
      const [removed] = this.items.splice(indexToRemove, 1);
      if (removed) {
        this.removeAssets([removed]);
      }
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
