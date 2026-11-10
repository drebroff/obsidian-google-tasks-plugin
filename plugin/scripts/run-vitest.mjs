#!/usr/bin/env node

// Launches vitest through its canonical entry path.
//
// On Windows, when the shell's working directory is typed with a drive letter
// case that differs from the canonical one (e.g. "c:\" instead of "C:\"), npx
// starts vitest through a path that keeps the typed case. The vitest CLI and its
// worker processes then load their own modules (notably @vitest/runner) from
// lowercase file URLs, while Vite resolves module ids to the canonical case.
// Node's ESM cache treats those URLs as different modules, so
// `import { describe } from "vitest"` inside a test file registers tests into a
// detached collector context and every suite fails with
// "No test suite found in file".
//
// Launching vitest through its canonical path keeps all module URLs consistent,
// regardless of how the working directory was typed.

import { spawn } from "node:child_process";
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
let vitestEntry = path.resolve(scriptDir, "../node_modules/vitest/vitest.mjs");

if (process.platform === "win32") {
  try {
    vitestEntry = realpathSync.native(vitestEntry);
  } catch {
    // Fall back to the resolved path if the canonical one cannot be determined.
  }
}

const child = spawn(process.execPath, [vitestEntry, ...process.argv.slice(2)], {
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
