import { build } from "esbuild";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "dist");

const ensureDir = (target) => {
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }
};

rmSync(distRoot, { recursive: true, force: true });
ensureDir(path.join(distRoot, "main"));
ensureDir(path.join(distRoot, "preload"));
ensureDir(path.join(distRoot, "renderer"));

await build({
  entryPoints: {
    main: path.join(projectRoot, "src", "main", "main.ts")
  },
  bundle: true,
  outfile: path.join(distRoot, "main", "main.js"),
  platform: "node",
  format: "cjs",
  target: "node20",
  sourcemap: true,
  external: ["electron"]
});

await build({
  entryPoints: {
    preload: path.join(projectRoot, "src", "preload", "preload.ts")
  },
  bundle: true,
  outfile: path.join(distRoot, "preload", "preload.js"),
  platform: "node",
  format: "cjs",
  target: "node20",
  sourcemap: true,
  external: ["electron"]
});

await build({
  entryPoints: {
    history: path.join(projectRoot, "src", "renderer", "history.ts"),
    settings: path.join(projectRoot, "src", "renderer", "settings.ts"),
    "slot-picker": path.join(projectRoot, "src", "renderer", "slot-picker.ts")
  },
  bundle: true,
  outdir: path.join(distRoot, "renderer"),
  platform: "browser",
  format: "iife",
  target: "chrome130",
  sourcemap: true
});

for (const asset of [
  "history.html",
  "settings.html",
  "slot-picker.html",
  "common.css"
]) {
  cpSync(
    path.join(projectRoot, "src", "renderer", asset),
    path.join(distRoot, "renderer", asset)
  );
}
