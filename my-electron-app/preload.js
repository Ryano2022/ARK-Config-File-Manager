const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  checkForAddedFiles: () => ipcRenderer.invoke("check-added-files"),
  addFile: (file) => ipcRenderer.invoke("add-file", file),
  readFile: (filename) => ipcRenderer.invoke("read-file", filename),
  removeFile: (filename) => ipcRenderer.invoke("remove-file", filename),
  saveFile: (filename, content) =>
    ipcRenderer.invoke("save-file", filename, content),
});
