import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export class ImageStore {
  private readonly baseDirectory: string;
  private readonly imageDirectory: string;

  constructor(baseDirectory: string) {
    this.baseDirectory = baseDirectory;
    this.imageDirectory = path.join(baseDirectory, "images");
  }

  savePng(id: string, pngBytes: Buffer): string {
    if (!existsSync(this.imageDirectory)) {
      mkdirSync(this.imageDirectory, { recursive: true });
    }

    const relativePath = path.posix.join("images", `${id}.png`);
    writeFileSync(this.resolve(relativePath), pngBytes);
    return relativePath;
  }

  read(relativePath: string): Buffer {
    return readFileSync(this.resolve(relativePath));
  }

  exists(relativePath: string): boolean {
    return existsSync(this.resolve(relativePath));
  }

  delete(relativePath?: string): void {
    if (!relativePath) {
      return;
    }

    rmSync(this.resolve(relativePath), { force: true });
  }

  clear(): void {
    rmSync(this.imageDirectory, { recursive: true, force: true });
  }

  toFileUrl(relativePath?: string): string | undefined {
    if (!relativePath || !this.exists(relativePath)) {
      return undefined;
    }

    return pathToFileURL(this.resolve(relativePath)).toString();
  }

  private resolve(relativePath: string): string {
    return path.join(this.baseDirectory, relativePath);
  }
}
