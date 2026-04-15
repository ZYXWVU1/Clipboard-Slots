import { Menu, Tray } from "electron";
import { DEFAULT_LOCALE, t } from "../../common/i18n";
import type { SupportedLocale } from "../../common/types";

import { getTrayIcon } from "./icon-manager";

interface TrayActions {
  openHistory: () => void;
  openSettings: () => void;
  clearHistory: () => void;
  quit: () => void;
}

export class TrayManager {
  private tray: Tray | null = null;
  private actions: TrayActions | null = null;
  private locale: SupportedLocale = DEFAULT_LOCALE;

  create(actions: TrayActions, locale: SupportedLocale): void {
    this.actions = actions;
    this.locale = locale;

    if (!this.tray) {
      this.tray = new Tray(getTrayIcon());
      this.tray.on("double-click", actions.openHistory);
    }

    this.refresh();
  }

  setLocale(locale: SupportedLocale): void {
    this.locale = locale;
    this.refresh();
  }

  destroy(): void {
    this.tray?.destroy();
    this.tray = null;
    this.actions = null;
  }

  private refresh(): void {
    if (!this.tray || !this.actions) {
      return;
    }

    this.tray.setToolTip(t(this.locale, "app.title"));
    this.tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: t(this.locale, "tray.openApp"),
          click: this.actions.openHistory
        },
        {
          label: t(this.locale, "tray.openSettings"),
          click: this.actions.openSettings
        },
        {
          type: "separator"
        },
        {
          label: t(this.locale, "tray.clearHistory"),
          click: this.actions.clearHistory
        },
        {
          type: "separator"
        },
        {
          label: t(this.locale, "tray.quit"),
          click: this.actions.quit
        }
      ])
    );
  }
}
