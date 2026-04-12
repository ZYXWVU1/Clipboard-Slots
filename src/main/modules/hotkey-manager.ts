import { EventEmitter } from "node:events";
import { globalShortcut } from "electron";
import { MAX_DIRECT_SLOT_SHORTCUTS } from "../../common/defaults";
import { t } from "../../common/i18n";
import type {
  ActionResult,
  AppSettings,
  HotkeyRegistration,
  HotkeyStatus
} from "../../common/types";

const normalizeAccelerator = (value: string): string =>
  value.replace(/\s+/g, "").toUpperCase();

export class HotkeyManager extends EventEmitter {
  private status: HotkeyStatus = {
    mode: "direct",
    registrations: [],
    warnings: []
  };

  constructor(
    private readonly handlePasteSlot: (slot: number) => Promise<ActionResult>,
    private readonly openSlotPicker: () => void
  ) {
    super();
  }

  register(settings: AppSettings): HotkeyStatus {
    globalShortcut.unregisterAll();

    const registrations: HotkeyRegistration[] = [];
    const warnings: string[] = [];
    const seen = new Map<string, string>();
    const locale = settings.locale;

    if (settings.hotkeyMode === "direct") {
      const directSlots = Object.entries(settings.directHotkeys)
        .map(([slot, accelerator]) => ({
          slot: Number(slot),
          accelerator: accelerator.trim()
        }))
        .filter(
          ({ slot, accelerator }) =>
            Number.isInteger(slot) &&
            slot >= 1 &&
            slot <= Math.min(settings.maxHistory, MAX_DIRECT_SLOT_SHORTCUTS) &&
            Boolean(accelerator)
        )
        .sort((left, right) => left.slot - right.slot);

      if (settings.maxHistory > MAX_DIRECT_SLOT_SHORTCUTS) {
        warnings.push(
          t(locale, "hotkey.warning.directLimit", {
            count: MAX_DIRECT_SLOT_SHORTCUTS
          })
        );
      }

      for (const { slot, accelerator } of directSlots) {
        const normalized = normalizeAccelerator(accelerator);
        const duplicateSlot = seen.get(normalized);

        if (duplicateSlot) {
          registrations.push({
            kind: "slot",
            slot,
            accelerator,
            status: "failed",
            reason: t(locale, "hotkey.conflictSlot", { slot: duplicateSlot })
          });
          continue;
        }

        seen.set(normalized, String(slot));

        try {
          const registered = globalShortcut.register(accelerator, () => {
            void this.handlePasteSlot(slot);
          });

          registrations.push({
            kind: "slot",
            slot,
            accelerator,
            status: registered ? "registered" : "failed",
            reason: registered ? undefined : t(locale, "hotkey.registerFailed")
          });
        } catch {
          registrations.push({
            kind: "slot",
            slot,
            accelerator,
            status: "failed",
            reason: t(locale, "hotkey.invalidSyntax")
          });
        }
      }
    } else {
      try {
        const registered = globalShortcut.register(settings.chordActivator, () => {
          this.openSlotPicker();
        });

        registrations.push({
          kind: "chord",
          accelerator: settings.chordActivator,
          status: registered ? "registered" : "failed",
          reason: registered ? undefined : t(locale, "hotkey.registerFailed")
        });
      } catch {
        registrations.push({
          kind: "chord",
          accelerator: settings.chordActivator,
          status: "failed",
          reason: t(locale, "hotkey.invalidSyntax")
        });
      }

      warnings.push(t(locale, "hotkey.warning.chordMode"));
    }

    this.status = {
      mode: settings.hotkeyMode,
      registrations,
      warnings
    };
    this.emit("updated", this.getStatus());
    return this.getStatus();
  }

  getStatus(): HotkeyStatus {
    return {
      mode: this.status.mode,
      warnings: [...this.status.warnings],
      registrations: this.status.registrations.map((registration) => ({
        ...registration
      }))
    };
  }

  dispose(): void {
    globalShortcut.unregisterAll();
  }
}
