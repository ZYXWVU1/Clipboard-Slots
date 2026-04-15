import path from "node:path";
import { app, nativeImage } from "electron";

const resourceIconPath = path.join(process.resourcesPath, "assets", "icon.png");
const developmentIconPath = path.join(__dirname, "..", "..", "build", "icon.png");

export const getAppIconPath = (): string =>
  app.isPackaged ? resourceIconPath : developmentIconPath;

export const getAppIcon = () => nativeImage.createFromPath(getAppIconPath());

export const getTrayIcon = () => {
  const icon = getAppIcon();
  return icon.isEmpty()
    ? icon
    : icon.resize({
        width: 20,
        height: 20,
        quality: "best"
      });
};
