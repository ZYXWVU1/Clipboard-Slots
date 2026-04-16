import { createHash } from "node:crypto";
import { clipboard, type NativeImage } from "electron";
import type { AppSettings } from "../../common/types";
import { HistoryStore } from "./history-store";

type ClipboardAdapter = Pick<typeof clipboard, "readText" | "readImage">;

const fingerprintImage = (image: NativeImage): string =>
  createHash("sha256").update(image.toPNG()).digest("hex");

export class ClipboardWatcher {
  private pollTimer?: NodeJS.Timeout;
  private pollIntervalMs = 0;
  private lastObservedText = "";
  private lastObservedImageFingerprint = "";
  private readonly textSuppressions = new Map<string, number>();
  private readonly imageSuppressions = new Map<string, number>();

  constructor(
    private readonly historyStore: HistoryStore,
    private readonly getSettings: () => AppSettings,
    private readonly clipboardAdapter: ClipboardAdapter = clipboard
  ) {}

  start(): void {
    this.lastObservedText = this.clipboardAdapter.readText();
    const currentImage = this.clipboardAdapter.readImage();
    this.lastObservedImageFingerprint = currentImage.isEmpty()
      ? ""
      : fingerprintImage(currentImage);
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

    this.textSuppressions.set(text, Date.now() + durationMs);
  }

  suppressImage(fingerprint: string, durationMs = 2500): void {
    if (!fingerprint) {
      return;
    }

    this.imageSuppressions.set(fingerprint, Date.now() + durationMs);
  }

  pollClipboardForTest(): void {
    this.pollClipboard();
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

    const currentImage = this.clipboardAdapter.readImage();
    if (!currentImage.isEmpty()) {
      const fingerprint = fingerprintImage(currentImage);
      if (fingerprint !== this.lastObservedImageFingerprint && !this.isImageSuppressed(fingerprint)) {
        this.lastObservedImageFingerprint = fingerprint;
        const size = currentImage.getSize();
        this.historyStore.addImage({
          pngBytes: currentImage.toPNG(),
          width: size.width,
          height: size.height,
          fingerprint
        });
      }
      return;
    }

    const currentText = this.clipboardAdapter.readText();
    if (currentText === this.lastObservedText) {
      return;
    }

    this.lastObservedText = currentText;

    if (!currentText || this.isTextSuppressed(currentText)) {
      return;
    }

    this.historyStore.addText(currentText);
  }

  private isTextSuppressed(value: string): boolean {
    const expiration = this.textSuppressions.get(value);
    return Boolean(expiration && expiration > Date.now());
  }

  private isImageSuppressed(fingerprint: string): boolean {
    const expiration = this.imageSuppressions.get(fingerprint);
    return Boolean(expiration && expiration > Date.now());
  }

  private cleanupSuppressions(): void {
    const now = Date.now();

    for (const [value, expiration] of this.textSuppressions.entries()) {
      if (expiration <= now) {
        this.textSuppressions.delete(value);
      }
    }

    for (const [fingerprint, expiration] of this.imageSuppressions.entries()) {
      if (expiration <= now) {
        this.imageSuppressions.delete(fingerprint);
      }
    }
  }
}
