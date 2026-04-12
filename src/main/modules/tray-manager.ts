import { Menu, Tray, nativeImage } from "electron";
import { DEFAULT_LOCALE, t } from "../../common/i18n";
import type { SupportedLocale } from "../../common/types";

const traySvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#122739"/>
  <rect x="12" y="14" width="40" height="36" rx="8" fill="#f4efe7"/>
  <rect x="18" y="22" width="28" height="4" rx="2" fill="#cc613a"/>
  <rect x="18" y="31" width="20" height="4" rx="2" fill="#2c6176"/>
  <rect x="18" y="40" width="24" height="4" rx="2" fill="#2c6176"/>
</svg>
`;

const buildTrayIcon = () =>
  nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(traySvg).toString("base64")}`
  );

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
      this.tray = new Tray(buildTrayIcon());
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
