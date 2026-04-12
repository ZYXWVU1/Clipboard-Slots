import path from "node:path";
import { app } from "electron";

export class StartupManager {
  apply(enabled: boolean): boolean {
    try {
      app.setLoginItemSettings(this.buildSettings(enabled));
      return app.getLoginItemSettings().openAtLogin;
    } catch {
      return false;
    }
  }

  private buildSettings(enabled: boolean) {
    if (process.platform !== "win32") {
      return {
        openAtLogin: enabled,
        openAsHidden: true
      };
    }

    if (app.isPackaged) {
      return {
        openAtLogin: enabled,
        openAsHidden: true
      };
    }

    const appEntry = process.argv[1]
      ? path.resolve(process.argv[1])
      : path.join(app.getAppPath(), "dist", "main", "main.js");

    return {
      openAtLogin: enabled,
      openAsHidden: true,
      path: process.execPath,
      args: [appEntry, "--hidden"]
    };
  }
}
