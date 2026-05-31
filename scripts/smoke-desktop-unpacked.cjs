#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const rootDir = process.cwd();
const exePath = path.join(rootDir, "release", "win-unpacked", "Bauplan Buddy.exe");
const startupLogPath = path.join(
  process.env.TEMP || process.env.TMP || rootDir,
  "bauplan-buddy-desktop.log"
);

function fail(message) {
  process.stderr.write(`\n[smoke-desktop-unpacked] ERROR: ${message}\n`);
  process.exit(1);
}

function readLog() {
  try {
    return fs.readFileSync(startupLogPath, "utf8");
  } catch {
    return "";
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (process.platform !== "win32") {
    process.stdout.write("[smoke-desktop-unpacked] SKIP: Windows-only smoke\n");
    return;
  }

  if (!fs.existsSync(exePath)) {
    fail(`Missing unpacked executable: ${exePath}`);
  }

  const previousLog = readLog();
  const child = spawn(exePath, [], {
    cwd: path.dirname(exePath),
    detached: false,
    stdio: "ignore",
    windowsHide: true,
  });

  let exitCode = null;
  child.once("exit", (code) => {
    exitCode = code;
  });

  let ready = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await wait(500);
    if (exitCode !== null) {
      fail(`Desktop app exited before smoke completed with code ${exitCode}`);
    }

    const currentLog = readLog();
    const appendedLog = currentLog.slice(previousLog.length);
    if (appendedLog.includes("renderer-server:listening")) {
      ready = true;
      break;
    }
  }

  try {
    child.kill();
  } catch {
    // The process may already be closed by Electron shutdown handling.
  }

  if (!ready) {
    fail(`Desktop app did not report renderer startup. Log: ${startupLogPath}`);
  }

  process.stdout.write(
    `[smoke-desktop-unpacked] OK: launched ${path.relative(rootDir, exePath)}\n`
  );
}

main().catch((error) => fail(error?.message || String(error)));
