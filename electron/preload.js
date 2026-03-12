const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

const desktopApi = {
  isDesktop: true,
  ping: () => invoke("desktop:ping"),
  openTearOff: (path, title, width, height) =>
    invoke("desktop:open-tear-off", { path, title, width, height }),
  notify: (title, body) => invoke("desktop:notify", { title, body }),
  openExternal: (url) => invoke("desktop:open-external", url),
  openFileDialog: (filters, properties, title) =>
    invoke("desktop:file:open-dialog", { filters, properties, title }),
  readFile: (targetPath) => invoke("desktop:file:read", targetPath),
  writeFile: (filename, dataBase64, directory) =>
    invoke("desktop:file:write", { filename, dataBase64, directory }),
  fileExists: (targetPath) => invoke("desktop:file:exists", targetPath),
  checkForUpdates: () => invoke("desktop:updater:check"),
  downloadUpdate: () => invoke("desktop:updater:download"),
  installUpdate: () => invoke("desktop:updater:install"),
  onUpdaterEvent: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on("desktop:updater:event", listener);
    return () => ipcRenderer.removeListener("desktop:updater:event", listener);
  },
};

contextBridge.exposeInMainWorld("desktop", desktopApi);

contextBridge.exposeInMainWorld('electron', {
  // Legacy alias kept for compatibility with existing UI calls.
  openTearOffDialog: (path, title, width, height) => {
    ipcRenderer.send("open-tear-off", { path, title, width, height });
  },
});
