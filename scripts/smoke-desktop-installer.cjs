#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { chromium, _electron: electron } = require("playwright");

const rootDir = process.cwd();
const releaseDir = path.join(rootDir, "release");
const packageName = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"), "utf8")
).name;
const productName = "Bauplan Buddy";
const defaultInstallDir = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"),
  "Programs",
  packageName
);
const requestedInstallDir = path.join(os.tmpdir(), "bauplan-buddy-installer-smoke");
const browserProfileDir = path.join(os.tmpdir(), "bauplan-buddy-installer-browser-smoke");
const startupLogPath = path.join(os.tmpdir(), "bauplan-buddy-desktop.log");

function fail(message) {
  process.stderr.write(`\n[smoke-desktop-installer] ERROR: ${message}\n`);
  process.exit(1);
}

function info(message) {
  process.stdout.write(`[smoke-desktop-installer] ${message}\n`);
}

function readLog() {
  try {
    return fs.readFileSync(startupLogPath, "utf8");
  } catch {
    return "";
  }
}

function extractRendererUrl(logText) {
  const matches = [...logText.matchAll(/renderer-server:listening\s+(http:\/\/127\.0\.0\.1:\d+)/g)];
  const lastMatch = matches.at(-1);
  return lastMatch?.[1] || null;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findInstaller() {
  if (!fs.existsSync(releaseDir)) {
    fail(`Release directory not found: ${releaseDir}`);
  }

  const installers = fs
    .readdirSync(releaseDir)
    .filter((file) => /^Bauplan Buddy Setup .*\.exe$/i.test(file))
    .map((file) => path.join(releaseDir, file));

  if (installers.length === 0) {
    fail("No Windows installer found in release/");
  }

  installers.sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);
  return installers[0];
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "ignore",
      windowsHide: true,
      ...options,
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${path.basename(command)} exited with code ${code}`));
    });
  });
}

async function killProcessTree(pid) {
  if (!pid) {
    return;
  }

  await runProcess("taskkill.exe", ["/PID", String(pid), "/T", "/F"]).catch(() => {
    // The app may already be closed.
  });
}

async function removeDirectoryIfSafe(targetDir) {
  const resolvedTarget = path.resolve(targetDir);
  const resolvedTemp = path.resolve(os.tmpdir());
  if (!resolvedTarget.startsWith(resolvedTemp + path.sep)) {
    return;
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      fs.rmSync(resolvedTarget, { recursive: true, force: true });
      return;
    } catch (error) {
      if (attempt === 9) {
        throw error;
      }

      await wait(500);
    }
  }
}

async function waitForInstalledExe() {
  const candidates = [
    path.join(requestedInstallDir, `${productName}.exe`),
    path.join(defaultInstallDir, `${productName}.exe`),
  ];

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const found = candidates.find((candidate) => fs.existsSync(candidate));
    if (found) {
      return found;
    }

    await wait(500);
  }

  fail(`Installed executable not found. Checked: ${candidates.join(", ")}`);
}

async function verifyDefaultInstallPath(installerPath) {
  info(`Checking default NSIS install path ${defaultInstallDir}`);
  await runProcess(installerPath, ["/S"]);

  const installedExePath = path.join(defaultInstallDir, `${productName}.exe`);
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (fs.existsSync(installedExePath)) {
      await cleanupInstall(installedExePath);
      return;
    }

    await wait(500);
  }

  fail(`Default installed executable not found at ${installedExePath}`);
}

async function smokeInstalledApp(exePath) {
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
  let rendererUrl = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await wait(500);
    if (exitCode !== null) {
      fail(`Installed desktop app exited before smoke completed with code ${exitCode}`);
    }

    const appendedLog = readLog().slice(previousLog.length);
    rendererUrl = extractRendererUrl(appendedLog);
    if (rendererUrl) {
      ready = true;
      break;
    }
  }

  if (!ready) {
    await killProcessTree(child.pid);
    fail(`Installed desktop app did not report renderer startup. Log: ${startupLogPath}`);
  }

  return { child, rendererUrl };
}

async function createRendererContext() {
  await removeDirectoryIfSafe(browserProfileDir);
  return chromium.launchPersistentContext(browserProfileDir, {
    acceptDownloads: true,
    headless: true,
  });
}

function trackRuntimeErrors(page) {
  const runtimeErrors = [];

  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      runtimeErrors.push(message.text());
    }
  });

  return runtimeErrors;
}

async function prepareInstalledRenderer(context, rendererUrl) {
  if (!rendererUrl) {
    fail("Missing installed renderer URL");
  }

  const page = context.pages()[0] || await context.newPage();
  const runtimeErrors = trackRuntimeErrors(page);

  await page.goto(`${rendererUrl}/#/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.removeItem("bauplan_beta_user");
    localStorage.removeItem("bauplan_beta_store");
  });
  await page.goto(`${rendererUrl}/#/login`, { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL("**/#/dashboard");
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();

  await page.goto(`${rendererUrl}/#/projects`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("Projektname eingeben").fill("Installer Smoke Projekt");
  await page.getByRole("button", { name: "Neu anlegen" }).click();
  await page.getByText("Installer Smoke Projekt").waitFor();

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText("Installer Smoke Projekt").waitFor();

  await page.goto(`${rendererUrl}/#/settings`, { waitUntil: "domcontentloaded" });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Daten sichern" }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  if (!download.suggestedFilename().includes("bauplan-buddy-beta-backup")) {
    fail(`Unexpected backup filename: ${download.suggestedFilename()}`);
  }
  if (!backupPath) {
    fail("Backup export did not produce a readable download path");
  }

  if (runtimeErrors.length > 0) {
    fail(`Installed renderer reported runtime errors: ${runtimeErrors.join(" | ")}`);
  }

  return backupPath;
}

async function verifyRestartAndBackupImport(context, rendererUrl, backupPath) {
  if (!rendererUrl) {
    fail("Missing restarted renderer URL");
  }

  const page = context.pages()[0] || await context.newPage();
  const runtimeErrors = trackRuntimeErrors(page);

  await page.goto(`${rendererUrl}/#/projects`, { waitUntil: "domcontentloaded" });
  await page.getByText("Installer Smoke Projekt").waitFor();

  await page.goto(`${rendererUrl}/#/settings`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Beta-Demodaten zurücksetzen" }).click();
  await page.goto(`${rendererUrl}/#/projects`, { waitUntil: "domcontentloaded" });
  await page.getByText("Installer Smoke Projekt").waitFor({ state: "hidden" });

  await page.goto(`${rendererUrl}/#/settings`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Beta-Datensicherung auswählen").setInputFiles(backupPath);
  await page.waitForURL("**/#/settings");
  await page.goto(`${rendererUrl}/#/projects`, { waitUntil: "domcontentloaded" });
  await page.getByText("Installer Smoke Projekt").waitFor();

  if (runtimeErrors.length > 0) {
    fail(`Restarted renderer reported runtime errors: ${runtimeErrors.join(" | ")}`);
  }
}

async function verifyInstalledUpdaterPanel(exePath) {
  const electronApp = await electron.launch({
    executablePath: exePath,
    cwd: path.dirname(exePath),
    timeout: 30000,
  });

  try {
    const page = await electronApp.firstWindow();
    const runtimeErrors = trackRuntimeErrors(page);

    await page.goto(`${page.url()}#/login`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.removeItem("bauplan_beta_user");
    });
    await page.goto(`${page.url()}#/login`, { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL("**/#/dashboard");
    await page.goto(`${page.url().split("#")[0]}#/settings`, {
      waitUntil: "domcontentloaded",
    });

    await page.getByText("Desktop-Updates").waitFor();
    await page.getByRole("button", { name: "Updater prüfen" }).click();
    await page
      .getByText("Update-Checks sind in dieser lokalen Beta noch nicht produktiv angebunden.")
      .waitFor();

    if (runtimeErrors.length > 0) {
      fail(`Installed updater panel reported runtime errors: ${runtimeErrors.join(" | ")}`);
    }
  } finally {
    await electronApp.close();
  }
}

async function cleanupInstall(installedExePath) {
  const installDir = path.dirname(installedExePath);
  const uninstaller = path.join(installDir, `Uninstall ${productName}.exe`);

  if (fs.existsSync(uninstaller)) {
    await runProcess(uninstaller, ["/S"]).catch((error) => {
      info(`Uninstaller warning: ${error.message}`);
    });
  }

  if (path.resolve(installDir) === path.resolve(requestedInstallDir)) {
    await removeDirectoryIfSafe(installDir);
  }
}

async function main() {
  if (process.platform !== "win32") {
    info("SKIP: Windows-only installer smoke");
    return;
  }

  if (fs.existsSync(defaultInstallDir)) {
    fail(
      `Existing local installation found at ${defaultInstallDir}. Remove it manually or run the unpacked smoke instead.`
    );
  }

  await removeDirectoryIfSafe(requestedInstallDir);
  const installerPath = findInstaller();
  info(`Installing ${path.relative(rootDir, installerPath)}`);

  await verifyDefaultInstallPath(installerPath);
  await runProcess(installerPath, ["/S", `/D=${requestedInstallDir}`]);
  const installedExePath = await waitForInstalledExe();
  let rendererContext = null;
  let appProcess = null;

  try {
    const smokeResult = await smokeInstalledApp(installedExePath);
    appProcess = smokeResult.child;
    rendererContext = await createRendererContext();
    const backupPath = await prepareInstalledRenderer(rendererContext, smokeResult.rendererUrl);

    await killProcessTree(appProcess.pid);
    appProcess = null;

    const restartResult = await smokeInstalledApp(installedExePath);
    appProcess = restartResult.child;
    await verifyRestartAndBackupImport(
      rendererContext,
      restartResult.rendererUrl,
      backupPath
    );

    await killProcessTree(appProcess.pid);
    appProcess = null;
    await verifyInstalledUpdaterPanel(installedExePath);

    info(`OK: installed, restarted and exercised ${installedExePath}`);
  } finally {
    if (rendererContext) {
      await rendererContext.close();
    }
    if (appProcess) {
      await killProcessTree(appProcess.pid);
    }
    await removeDirectoryIfSafe(browserProfileDir);
    await cleanupInstall(installedExePath);
  }
}

main().catch((error) => fail(error?.message || String(error)));
