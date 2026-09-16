// Build the extension into Tinycast's extensions directory.
//
// Tinycast loads the same file layout that `ray build` produces, but it has no
// `ray develop` equivalent and `ray develop` cannot change its output directory.
// `npm run build:tinycast` runs this once; `npm run dev:tinycast` passes
// `--watch`, which rebuilds whenever a file under src/ or package.json changes.
//
// Watching polls file mtimes instead of using fs.watch so that it works the
// same everywhere (fs.watch's recursive mode needs FSEvents on macOS, which is
// unavailable in some sandboxed environments).
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const POLL_INTERVAL_MS = 500;

const root = fileURLToPath(new URL("..", import.meta.url));
const packageJsonPath = join(root, "package.json");
const srcDir = join(root, "src");
const { name } = JSON.parse(readFileSync(packageJsonPath, "utf8"));

const extensionsDir =
  process.env.TINYCAST_EXTENSIONS_DIR ??
  join(
    homedir(),
    "Library",
    "Application Support",
    "com.tinycast.app",
    "extensions",
  );
const outDir = join(extensionsDir, name);

function build() {
  console.log(`Building into ${outDir}`);
  const result = spawnSync(
    join(root, "node_modules", ".bin", "ray"),
    ["build", "-e", "dist", "-o", outDir],
    {
      cwd: root,
      stdio: "inherit",
    },
  );
  return result.status ?? 1;
}

/** Returns a string that changes whenever any watched file is added, removed, or modified. */
function snapshot() {
  const files = [
    packageJsonPath,
    ...readdirSync(srcDir, { recursive: true }).map((file) =>
      join(srcDir, file),
    ),
  ];
  return files
    .map((file) => {
      try {
        return `${file}:${statSync(file).mtimeMs}`;
      } catch {
        return `${file}:missing`;
      }
    })
    .join("\n");
}

if (!process.argv.includes("--watch")) {
  process.exitCode = build();
} else {
  build();
  let last = snapshot();
  console.log("Watching src/ and package.json for changes... (Ctrl+C to stop)");
  setInterval(() => {
    const next = snapshot();
    if (next === last) return;
    last = next;
    console.log("\nChange detected, rebuilding...");
    build();
  }, POLL_INTERVAL_MS);
}
