import { spawn } from "node:child_process";
import { clipboard } from "electron";
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
    if (!item) {
      return failed("That clipboard item is no longer available.");
    }
    this.clipboardWatcher.suppressText(item.content);
    clipboard.writeText(item.content);
    return {
      ok: true,
      message: `Copied slot ${item.slot} back to the clipboard.`
    };
  }

  async pasteHistoryItem(id: string): Promise<ActionResult> {
    const item = this.historyStore.getById(id);
    if (!item) {
      return failed("That clipboard item is no longer available.");
    }
    return this.pasteItem(item);
  }

  async pasteSlot(slot: number): Promise<ActionResult> {
    const item = this.historyStore.getBySlot(slot);
    if (!item) {
      return failed(`Slot ${slot} is empty right now.`);
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
      return failed(
        "Paste simulation failed. The target app may be blocking synthetic input."
      );
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
      message: `Pasted slot ${item.slot}.`
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
