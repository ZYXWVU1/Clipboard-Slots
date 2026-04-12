import { clipboard } from "electron";
import type { AppSettings } from "../../common/types";
import { HistoryStore } from "./history-store";

export class ClipboardWatcher {
  private pollTimer?: NodeJS.Timeout;
  private pollIntervalMs = 0;
  private lastObservedText = "";
  private readonly suppressions = new Map<string, number>();

  constructor(
    private readonly historyStore: HistoryStore,
    private readonly getSettings: () => AppSettings
  ) {}

  start(): void {
    this.lastObservedText = clipboard.readText();
    this.restartTimer();
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  updateSettings(): void {
    this.restartTimer();
  }

  suppressText(text: string, durationMs = 2500): void {
    if (!text) {
      return;
    }
    this.suppressions.set(text, Date.now() + durationMs);
  }

  private restartTimer(): void {
    const { clipboardPollIntervalMs } = this.getSettings();
    if (this.pollTimer && clipboardPollIntervalMs === this.pollIntervalMs) {
      return;
    }

    this.stop();
    this.pollIntervalMs = clipboardPollIntervalMs;
    this.pollTimer = setInterval(() => this.pollClipboard(), clipboardPollIntervalMs);
  }

  private pollClipboard(): void {
    this.cleanupSuppressions();
    const currentText = clipboard.readText();

    if (currentText === this.lastObservedText) {
      return;
    }

    this.lastObservedText = currentText;

    if (!currentText || this.isSuppressed(currentText)) {
      return;
    }
    this.historyStore.addText(currentText);
  }

  private isSuppressed(value: string): boolean {
    const expiration = this.suppressions.get(value);
    return Boolean(expiration && expiration > Date.now());
  }

  private cleanupSuppressions(): void {
    const now = Date.now();
    for (const [value, expiration] of this.suppressions.entries()) {
      if (expiration <= now) {
        this.suppressions.delete(value);
      }
    }
  }
}
