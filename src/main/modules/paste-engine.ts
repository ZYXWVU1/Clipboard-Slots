import { spawn } from "node:child_process";
import { clipboard } from "electron";
import { t } from "../../common/i18n";
import type { ActionResult, ClipboardHistoryItem } from "../../common/types";
import { ClipboardWatcher } from "./clipboard-watcher";
import { HistoryStore } from "./history-store";
import { SettingsManager } from "./settings-manager";

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const failed = (message: string): ActionResult => ({
  ok: false,
  message
});

export class PasteEngine {
  constructor(
    private readonly historyStore: HistoryStore,
    private readonly settingsManager: SettingsManager,
    private readonly clipboardWatcher: ClipboardWatcher
  ) {}

  async copyHistoryItem(id: string): Promise<ActionResult> {
    const item = this.historyStore.getById(id);
    const locale = this.settingsManager.getSettings().locale;
    if (!item) {
      return failed(t(locale, "action.itemUnavailable"));
    }
    this.clipboardWatcher.suppressText(item.content);
    clipboard.writeText(item.content);
    return {
      ok: true,
      message: t(locale, "action.copiedSlot", { slot: item.slot })
    };
  }

  async pasteHistoryItem(id: string): Promise<ActionResult> {
    const item = this.historyStore.getById(id);
    const locale = this.settingsManager.getSettings().locale;
    if (!item) {
      return failed(t(locale, "action.itemUnavailable"));
    }
    return this.pasteItem(item);
  }

  async pasteSlot(slot: number): Promise<ActionResult> {
    const item = this.historyStore.getBySlot(slot);
    const locale = this.settingsManager.getSettings().locale;
    if (!item) {
      return failed(t(locale, "action.slotEmpty", { slot }));
    }
    return this.pasteItem(item);
  }

  private async pasteItem(item: ClipboardHistoryItem): Promise<ActionResult> {
    const settings = this.settingsManager.getSettings();
    const previousClipboard = settings.restoreClipboardAfterPaste
      ? clipboard.readText()
      : null;

    this.clipboardWatcher.suppressText(item.content, 5000);
    clipboard.writeText(item.content);
    await delay(80);

    try {
      await this.simulatePaste();
    } catch {
      return failed(t(settings.locale, "action.pasteFailed"));
    }

    if (previousClipboard !== null) {
      const restoreDelayMs = 350;
      this.clipboardWatcher.suppressText(previousClipboard, restoreDelayMs + 5000);
      setTimeout(() => {
        clipboard.writeText(previousClipboard);
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
