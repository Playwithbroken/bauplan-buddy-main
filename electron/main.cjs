const { app, BrowserWindow, Menu, Tray, dialog, ipcMain, Notification, nativeImage, shell } = require('electron');
const http = require('http');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');

let mainWindow;
let tray = null;
let updateReadyToInstall = false;
const tearOffWindows = new Set();
let autoUpdater = null;
let rendererServer = null;
let rendererServerPromise = null;
let rendererBaseUrl = null;

const DIST_DIR = path.join(__dirname, "../dist");
const STARTUP_LOG_PATH = path.join(
  process.env.TEMP || process.env.TMP || process.cwd(),
  "bauplan-buddy-desktop.log"
);

function writeStartupLog(message, details) {
  try {
    const timestamp = new Date().toISOString();
    const suffix = details
      ? ` ${typeof details === "string" ? details : JSON.stringify(details)}`
      : "";
    fsSync.appendFileSync(STARTUP_LOG_PATH, `[${timestamp}] ${message}${suffix}\n`, "utf8");
  } catch (error) {
    // Logging must never crash the desktop process.
  }
}

const IPC_CHANNELS = {
  PING: "desktop:ping",
  OPEN_TEAR_OFF: "desktop:open-tear-off",
  NOTIFY: "desktop:notify",
  OPEN_EXTERNAL: "desktop:open-external",
  OPEN_FILE_DIALOG: "desktop:file:open-dialog",
  READ_FILE: "desktop:file:read",
  WRITE_FILE: "desktop:file:write",
  FILE_EXISTS: "desktop:file:exists",
  CHECK_FOR_UPDATES: "desktop:updater:check",
  DOWNLOAD_UPDATE: "desktop:updater:download",
  INSTALL_UPDATE: "desktop:updater:install",
  GET_DIAGNOSTICS: "desktop:diagnostics:get",
};

function getMimeTypeForServer(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".ico":
      return "image/x-icon";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    case ".ttf":
      return "font/ttf";
    default:
      return "application/octet-stream";
  }
}

function resolveRendererFile(requestPath) {
  const decodedPath = decodeURIComponent(requestPath || "/");
  const sanitizedPath = decodedPath.replace(/^\/+/, "");
  const normalizedPath = path.normalize(sanitizedPath);
  const candidatePath = path.join(DIST_DIR, normalizedPath);
  const isInsideDist = candidatePath.startsWith(DIST_DIR);
  const hasFileExtension = path.extname(normalizedPath) !== "";

  if (!isInsideDist) {
    return path.join(DIST_DIR, "index.html");
  }

  if (hasFileExtension && fsSync.existsSync(candidatePath) && fsSync.statSync(candidatePath).isFile()) {
    return candidatePath;
  }

  return path.join(DIST_DIR, "index.html");
}

function ensureRendererServer() {
  if (isDev()) {
    return Promise.resolve(process.env.ELECTRON_START_URL);
  }

  if (rendererBaseUrl) {
    return Promise.resolve(rendererBaseUrl);
  }

  if (rendererServerPromise) {
    return rendererServerPromise;
  }

  rendererServerPromise = new Promise((resolve, reject) => {
    const server = http.createServer(async (request, response) => {
      try {
        const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
        const filePath = resolveRendererFile(requestUrl.pathname);
        const fileContents = await fs.readFile(filePath);

        response.writeHead(200, {
          "Content-Type": getMimeTypeForServer(filePath),
          "Cache-Control": "no-store",
        });
        response.end(fileContents);
      } catch (error) {
        writeStartupLog("renderer-server:error", error?.message || String(error));
        response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Renderer server error");
      }
    });

    server.on("error", (error) => {
      writeStartupLog("renderer-server:listen-error", error?.message || String(error));
      rendererServerPromise = null;
      reject(error);
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        rendererServerPromise = null;
        reject(new Error("Could not determine renderer server address"));
        return;
      }

      rendererServer = server;
      rendererBaseUrl = `http://127.0.0.1:${address.port}`;
      writeStartupLog("renderer-server:listening", rendererBaseUrl);
      resolve(rendererBaseUrl);
    });
  });

  return rendererServerPromise;
}

async function getStartUrl() {
  if (isDev()) {
    return process.env.ELECTRON_START_URL;
  }

  return ensureRendererServer();
}

function isDev() {
  return Boolean(process.env.ELECTRON_START_URL);
}

function getCurrentBaseUrl() {
  return process.env.ELECTRON_START_URL || rendererBaseUrl || `file://${path.join(__dirname, "../dist/index.html")}`;
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function isValidAbsoluteFilePath(targetPath) {
  return typeof targetPath === "string" && path.isAbsolute(targetPath);
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".txt":
      return "text/plain";
    case ".json":
      return "application/json";
    default:
      return "application/octet-stream";
  }
}

function sanitizeTearOffRoute(routePath) {
  if (typeof routePath !== "string") {
    return "generic";
  }

  const trimmed = routePath.trim();
  if (!trimmed) {
    return "generic";
  }

  // Keep known key-based routes for special pop-out content.
  if (/^[a-z0-9_-]+$/i.test(trimmed)) {
    return trimmed;
  }

  // Allow safe app-relative routes.
  if (/^\/[a-z0-9/_-]*$/i.test(trimmed)) {
    return trimmed;
  }

  return "generic";
}

async function readStartupLogTail(maxLines = 60) {
  try {
    const contents = await fs.readFile(STARTUP_LOG_PATH, "utf8");
    return contents
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-maxLines)
      .join("\n");
  } catch {
    return "";
  }
}

function buildTearOffUrl(routePath) {
  const startUrl = getCurrentBaseUrl();
  const sanitizedRoute = sanitizeTearOffRoute(routePath);

  if (isHttpUrl(startUrl) && sanitizedRoute.startsWith("/")) {
    const url = new URL(startUrl);
    url.pathname = sanitizedRoute;
    const params = new URLSearchParams(url.search);
    params.set("tearoff", "true");
    params.set("route", sanitizedRoute);
    url.search = params.toString();
    return url.toString();
  }

  if (sanitizedRoute.startsWith("/")) {
    return `${startUrl}#${sanitizedRoute}`;
  }

  const separator = startUrl.includes("?") ? "&" : "?";
  return `${startUrl}${separator}tearoff=true&route=${encodeURIComponent(sanitizedRoute)}`;
}

async function createWindow() {
  writeStartupLog("window:create:start");
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false, // Don't show until ready-to-show
  });

  // Hide the default menu bar for a cleaner look
  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.on("did-finish-load", () => {
    writeStartupLog("window:webcontents:did-finish-load", mainWindow.webContents.getURL());
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    writeStartupLog("window:webcontents:did-fail-load", {
      errorCode,
      errorDescription,
      validatedURL,
    });
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    writeStartupLog("window:webcontents:render-process-gone", details);
  });

  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    writeStartupLog("window:webcontents:console", { level, message, line, sourceId });
  });

  // Determine URL to load based on environment
  const startUrl = await getStartUrl();
  writeStartupLog("window:create:load-url", startUrl);
  
  await mainWindow.loadURL(startUrl);
  writeStartupLog("window:create:load-url-complete", startUrl);

  mainWindow.once('ready-to-show', () => {
    writeStartupLog("window:ready-to-show");
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    writeStartupLog("window:closed");
    mainWindow = null;
  });
}

function focusMainWindow() {
  if (!mainWindow) {
    void createWindow();
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
}

function createTray() {
  if (tray) {
    return;
  }

  const iconCandidates = [
    path.join(__dirname, "..", "build", "icon.png"),
    path.join(__dirname, "..", "build", "tray.png"),
  ];
  const foundIcon = iconCandidates.find((candidate) => fsSync.existsSync(candidate));
  const trayImage = foundIcon
    ? nativeImage.createFromPath(foundIcon)
    : nativeImage.createFromDataURL(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      );

  tray = new Tray(trayImage);
  tray.setToolTip("Bauplan Buddy");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open Bauplan Buddy", click: () => focusMainWindow() },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() },
    ])
  );
  tray.on("click", () => focusMainWindow());
}

function setupAutoUpdater() {
  try {
    ({ autoUpdater } = require("electron-updater"));
  } catch (error) {
    console.warn("Auto updater unavailable:", error);
    autoUpdater = null;
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = console;

  const sendUpdaterEvent = (payload) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("desktop:updater:event", payload);
    }
  };

  autoUpdater.on("checking-for-update", () => {
    sendUpdaterEvent({ type: "checking-for-update" });
  });

  autoUpdater.on("update-available", (info) => {
    updateReadyToInstall = false;
    sendUpdaterEvent({
      type: "update-available",
      info,
    });
  });

  autoUpdater.on("update-not-available", (info) => {
    updateReadyToInstall = false;
    sendUpdaterEvent({
      type: "update-not-available",
      info,
    });
  });

  autoUpdater.on("download-progress", (progressObj) => {
    sendUpdaterEvent({
      type: "download-progress",
      progress: {
        percent: progressObj.percent,
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total,
      },
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    updateReadyToInstall = true;
    sendUpdaterEvent({
      type: "update-downloaded",
      info,
    });
  });

  autoUpdater.on("error", (error) => {
    sendUpdaterEvent({
      type: "error",
      message: error?.message || "Unknown updater error",
    });
  });
}

function createTearOffWindow({ routePath, title, width, height }) {
  const popoutWindow = new BrowserWindow({
    width: width || 800,
    height: height || 600,
    title: title || 'Bauplan Buddy',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  popoutWindow.setMenuBarVisibility(false);
  const fullUrl = buildTearOffUrl(routePath);
  tearOffWindows.add(popoutWindow);
  popoutWindow.on("closed", () => tearOffWindows.delete(popoutWindow));

  popoutWindow.loadURL(fullUrl);
  return {
    windowId: popoutWindow.id,
    url: fullUrl,
  };
}

ipcMain.handle(IPC_CHANNELS.PING, () => ({
  ok: true,
  platform: process.platform,
  appVersion: app.getVersion(),
}));

ipcMain.handle(IPC_CHANNELS.OPEN_TEAR_OFF, (_event, payload) => {
  const { path: routePath, title, width, height } = payload || {};
  return createTearOffWindow({ routePath, title, width, height });
});

ipcMain.handle(IPC_CHANNELS.NOTIFY, (_event, payload) => {
  const { title, body } = payload || {};
  if (!Notification.isSupported()) {
    return { ok: false, reason: "unsupported" };
  }

  const notification = new Notification({
    title: title || "Bauplan Buddy",
    body: body || "",
  });
  notification.show();
  return { ok: true };
});

ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL, (_event, targetUrl) => {
  if (typeof targetUrl !== "string" || !/^https?:\/\//i.test(targetUrl)) {
    return { ok: false, reason: "invalid_url" };
  }

  void shell.openExternal(targetUrl);
  return { ok: true };
});

ipcMain.handle(IPC_CHANNELS.OPEN_FILE_DIALOG, async (_event, payload) => {
  const options = payload || {};
  const result = await dialog.showOpenDialog({
    properties: Array.isArray(options.properties) && options.properties.length
      ? options.properties
      : ["openFile"],
    filters: Array.isArray(options.filters) ? options.filters : undefined,
    title: typeof options.title === "string" ? options.title : "Select file",
  });

  return {
    canceled: result.canceled,
    filePaths: result.filePaths,
  };
});

ipcMain.handle(IPC_CHANNELS.READ_FILE, async (_event, targetPath) => {
  if (!isValidAbsoluteFilePath(targetPath)) {
    return { ok: false, reason: "invalid_path" };
  }

  try {
    const data = await fs.readFile(targetPath);
    return {
      ok: true,
      path: targetPath,
      name: path.basename(targetPath),
      mimeType: getMimeType(targetPath),
      size: data.byteLength,
      dataBase64: data.toString("base64"),
    };
  } catch (error) {
    return {
      ok: false,
      reason: "read_failed",
      message: error?.message || "Could not read file",
    };
  }
});

ipcMain.handle(IPC_CHANNELS.WRITE_FILE, async (_event, payload) => {
  const { filename, dataBase64, directory } = payload || {};
  if (typeof filename !== "string" || !filename.trim()) {
    return { ok: false, reason: "invalid_filename" };
  }
  if (typeof dataBase64 !== "string" || !dataBase64.trim()) {
    return { ok: false, reason: "invalid_data" };
  }

  const safeName = path.basename(filename);
  const targetDirectory =
    typeof directory === "string" && isValidAbsoluteFilePath(directory)
      ? directory
      : path.join(app.getPath("documents"), "Bauplan Buddy");
  const targetPath = path.join(targetDirectory, safeName);

  try {
    await fs.mkdir(targetDirectory, { recursive: true });
    await fs.writeFile(targetPath, Buffer.from(dataBase64, "base64"));
    return {
      ok: true,
      path: targetPath,
      name: safeName,
      mimeType: getMimeType(targetPath),
    };
  } catch (error) {
    return {
      ok: false,
      reason: "write_failed",
      message: error?.message || "Could not write file",
    };
  }
});

ipcMain.handle(IPC_CHANNELS.FILE_EXISTS, async (_event, targetPath) => {
  if (!isValidAbsoluteFilePath(targetPath)) {
    return { ok: false, reason: "invalid_path" };
  }

  try {
    await fs.access(targetPath);
    return { ok: true, exists: true };
  } catch {
    return { ok: true, exists: false };
  }
});

ipcMain.handle(IPC_CHANNELS.CHECK_FOR_UPDATES, async () => {
  if (isDev()) {
    return { ok: false, reason: "dev_mode" };
  }
  if (!autoUpdater) {
    return { ok: false, reason: "updater_unavailable" };
  }

  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      ok: true,
      updateInfo: result?.updateInfo || null,
      updateReadyToInstall,
    };
  } catch (error) {
    return {
      ok: false,
      reason: "check_failed",
      message: error?.message || "Failed to check for updates",
    };
  }
});

ipcMain.handle(IPC_CHANNELS.DOWNLOAD_UPDATE, async () => {
  if (isDev()) {
    return { ok: false, reason: "dev_mode" };
  }
  if (!autoUpdater) {
    return { ok: false, reason: "updater_unavailable" };
  }

  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "download_failed",
      message: error?.message || "Failed to download update",
    };
  }
});

ipcMain.handle(IPC_CHANNELS.INSTALL_UPDATE, async () => {
  if (isDev()) {
    return { ok: false, reason: "dev_mode" };
  }
  if (!autoUpdater) {
    return { ok: false, reason: "updater_unavailable" };
  }
  if (!updateReadyToInstall) {
    return { ok: false, reason: "no_downloaded_update" };
  }

  setImmediate(() => {
    autoUpdater.quitAndInstall(false, true);
  });
  return { ok: true };
});

ipcMain.handle(IPC_CHANNELS.GET_DIAGNOSTICS, async () => {
  return {
    ok: true,
    platform: process.platform,
    appVersion: app.getVersion(),
    startupLogPath: STARTUP_LOG_PATH,
    startupLogTail: await readStartupLogTail(),
    currentUrl:
      mainWindow && !mainWindow.isDestroyed()
        ? mainWindow.webContents.getURL()
        : null,
    updateReadyToInstall,
    isDev: isDev(),
  };
});

// Backward-compatible one-way IPC for existing renderer calls.
ipcMain.on("open-tear-off", (_event, payload) => {
  const { path: routePath, title, width, height } = payload || {};
  createTearOffWindow({ routePath, title, width, height });
});

app.on('ready', () => {
  writeStartupLog("app:ready");
  void (async () => {
    try {
      await ensureRendererServer();
      await createWindow();
      createTray();
      setupAutoUpdater();
      writeStartupLog("app:startup-complete");
    } catch (error) {
      writeStartupLog("app:startup-error", error?.stack || error?.message || String(error));
      throw error;
    }
  })();
});

app.on('window-all-closed', () => {
  writeStartupLog("app:window-all-closed", process.platform);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  writeStartupLog("app:activate");
  if (mainWindow === null) {
    void createWindow();
    createTray();
  }
});

app.on("will-quit", () => {
  writeStartupLog("app:will-quit");
  if (rendererServer) {
    rendererServer.close();
    rendererServer = null;
    rendererServerPromise = null;
    rendererBaseUrl = null;
  }
});

process.on("uncaughtException", (error) => {
  writeStartupLog("process:uncaught-exception", error?.stack || error?.message || String(error));
});

process.on("unhandledRejection", (reason) => {
  writeStartupLog("process:unhandled-rejection", reason?.stack || reason?.message || String(reason));
});
