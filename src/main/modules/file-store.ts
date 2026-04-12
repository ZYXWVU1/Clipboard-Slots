import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import path from "node:path";

const ensureParentDirectory = (targetPath: string) => {
  const directory = path.dirname(targetPath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
};

export class JsonFileStore<T> {
  constructor(
    private readonly filePath: string,
    private readonly fallbackFactory: () => T
  ) {}

  load(): T {
    if (!existsSync(this.filePath)) {
      return this.fallbackFactory();
    }

    try {
      return JSON.parse(readFileSync(this.filePath, "utf8")) as T;
    } catch {
      this.backupCorruptedFile();
      return this.fallbackFactory();
    }
  }

  save(value: T): void {
    ensureParentDirectory(this.filePath);
    const tempPath = `${this.filePath}.tmp`;
    writeFileSync(tempPath, JSON.stringify(value, null, 2), "utf8");
    rmSync(this.filePath, { force: true });
    renameSync(tempPath, this.filePath);
  }

  delete(): void {
    rmSync(this.filePath, { force: true });
  }

  private backupCorruptedFile(): void {
    if (!existsSync(this.filePath)) {
      return;
    }

    const backupPath = `${this.filePath}.corrupt-${Date.now()}`;
    renameSync(this.filePath, backupPath);
  }
}
