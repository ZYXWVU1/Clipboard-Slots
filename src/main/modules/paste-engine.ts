import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { clipboard, nativeImage, type NativeImage } from "electron";
import { t } from "../../common/i18n";
import type { ActionResult, ClipboardHistoryItem } from "../../common/types";
import { ClipboardWatcher } from "./clipboard-watcher";
import { HistoryStore } from "./history-store";
import { ImageStore } from "./image-store";
import { SettingsManager } from "./settings-manager";

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const failed = (message: string): ActionResult => ({
  ok: false,
  message
});

type ClipboardSnapshot =
  | { kind: "empty" }
  | { kind: "text"; text: string }
  | { kind: "image"; image: NativeImage; fingerprint: string };

export class PasteEngine {
  constructor(
    private readonly historyStore: HistoryStore,
    private readonly settingsManager: SettingsManager,
    private readonly clipboardWatcher: ClipboardWatcher,
    private readonly imageStore: ImageStore
  ) {}

  async copyHistoryItem(id: string): Promise<ActionResult> {
    const item = this.historyStore.getById(id);
    const locale = this.settingsManager.getSettings().locale;
    if (!item || !this.writeItemToClipboard(item)) {
      return failed(t(locale, "action.itemUnavailable"));
    }

    return {
      ok: true,
      message: t(locale, "action.copiedSlot", { slot: item.slot })
    };
  }

  async pasteSlot(slot: number): Promise<ActionResult> {
    const item = this.historyStore.getBySlot(slot);
    const locale = this.settingsManager.getSettings().locale;
    if (!item) {
      return failed(t(locale, "action.slotEmpty", { slot }));
    }

    return this.pasteItem(item);
  }

  private captureClipboardSnapshot(): ClipboardSnapshot {
    const image = clipboard.readImage();
    if (!image.isEmpty()) {
      return {
        kind: "image",
        image,
        fingerprint: createHash("sha256").update(image.toPNG()).digest("hex")
      };
    }

    const text = clipboard.readText();
    if (text) {
      return { kind: "text", text };
    }

    return { kind: "empty" };
  }

  private writeItemToClipboard(item: ClipboardHistoryItem, suppressMs = 5000): boolean {
    if (item.contentType === "image") {
      if (!item.imageRelativePath || !this.imageStore.exists(item.imageRelativePath)) {
        return false;
      }

      const pngBytes = this.imageStore.read(item.imageRelativePath);
      const image = nativeImage.createFromBuffer(pngBytes);
      this.clipboardWatcher.suppressImage(
        createHash("sha256").update(pngBytes).digest("hex"),
        suppressMs
      );
      clipboard.writeImage(image);
      return true;
    }

    this.clipboardWatcher.suppressText(item.content, suppressMs);
    clipboard.writeText(item.content);
    return true;
  }

  private restoreClipboardSnapshot(snapshot: ClipboardSnapshot, suppressMs = 5500): void {
    if (snapshot.kind === "image") {
      this.clipboardWatcher.suppressImage(snapshot.fingerprint, suppressMs);
      clipboard.writeImage(snapshot.image);
      return;
    }

    if (snapshot.kind === "text") {
      this.clipboardWatcher.suppressText(snapshot.text, suppressMs);
      clipboard.writeText(snapshot.text);
    }
  }

  private async pasteItem(item: ClipboardHistoryItem): Promise<ActionResult> {
    const settings = this.settingsManager.getSettings();
    const previousClipboard = settings.restoreClipboardAfterPaste
      ? this.captureClipboardSnapshot()
      : { kind: "empty" as const };

    if (!this.writeItemToClipboard(item)) {
      return failed(t(settings.locale, "action.itemUnavailable"));
    }

    await delay(80);

    try {
      await this.simulatePaste();
    } catch {
      return failed(t(settings.locale, "action.pasteFailed"));
    }

    if (previousClipboard.kind !== "empty") {
      const restoreDelayMs = 350;
      setTimeout(() => {
        this.restoreClipboardSnapshot(previousClipboard, restoreDelayMs + 5000);
      }, restoreDelayMs);
    }

    return {
      ok: true,
      message: t(settings.locale, "action.pastedSlot", { slot: item.slot })
    };
  }

  private async simulatePaste(): Promise<void> {
    if (process.platform === "win32") {
      await this.runCommand("powershell.exe", [
        "-NoProfile",
        "-STA",
        "-WindowStyle",
        "Hidden",
        "-Command",
        "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"
      ]);
      return;
    }

    if (process.platform === "darwin") {
      await this.runCommand("osascript", [
        "-e",
        'tell application "System Events" to keystroke "v" using command down'
      ]);
      return;
    }

    await this.runCommand("xdotool", ["key", "--clearmodifiers", "ctrl+v"]);
  }

  private runCommand(command: string, args: string[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: "ignore",
        windowsHide: true
      });

      child.once("error", reject);
      child.once("exit", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(`${command} exited with code ${code}`));
      });
    });
  }
}
