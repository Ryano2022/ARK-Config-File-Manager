const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  checkForAddedFiles: () => ipcRenderer.invoke('check-added-files'),
  addFile: (file) => ipcRenderer.invoke('add-file', file),
  readFile: (filename) => ipcRenderer.invoke('read-file', filename)
})