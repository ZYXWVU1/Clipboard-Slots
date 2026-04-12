import { Menu, Tray, nativeImage } from "electron";

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

  create(actions: TrayActions): void {
    if (this.tray) {
      return;
    }

    this.tray = new Tray(buildTrayIcon());
    this.tray.setToolTip("CtrlCVTool");
    this.tray.on("double-click", actions.openHistory);
    this.tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "Open CtrlCVTool",
          click: actions.openHistory
        },
        {
          label: "Open Settings",
          click: actions.openSettings
        },
        {
          type: "separator"
        },
        {
          label: "Clear History",
          click: actions.clearHistory
        },
        {
          type: "separator"
        },
        {
          label: "Quit",
          click: actions.quit
        }
      ])
    );
  }

  destroy(): void {
    this.tray?.destroy();
    this.tray = null;
  }
}
