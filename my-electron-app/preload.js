const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  checkForUploads: () => ipcRenderer.invoke('check-uploads'),
  uploadFile: (file) => ipcRenderer.invoke('upload-file', file)
})