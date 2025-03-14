const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  checkForAddedFiles: () => ipcRenderer.invoke("check-added-files"),
  addFile: (file) => ipcRenderer.invoke("add-file", file),
  readFile: (filename) => ipcRenderer.invoke("read-file", filename),
  removeFile: (filename) => ipcRenderer.invoke("remove-file", filename),
  saveFile: (filename, content, directory) => ipcRenderer.invoke("save-file", filename, content, directory),
  showDirectoryPicker: () => ipcRenderer.invoke("dialog:showDirectoryPicker"),

  // Firebase Auth
  signInWithEmail: async (email, password) => {
    const result = await ipcRenderer.invoke("auth-sign-in", email, password);
    console.log("signInWithEmail result:", result);
    if (result.success) {
      return result.user;
    } else {
      throw new Error(result.error);
    }
  },
  signOut: () => ipcRenderer.invoke("auth-sign-out"),
  getCurrentUser: () => ipcRenderer.invoke("auth-get-current-user"),
  registerWithEmail: async (email, password) => {
    const result = await ipcRenderer.invoke("auth-register", email, password);
    console.log("registerWithEmail result:", result);
    if (result.success) {
      return result.user;
    } else {
      throw new Error(result.error);
    }
  },

  // Firestore Operations
  addFileToFirestore: (file) => ipcRenderer.invoke("firestore-add-file", file),
  removeFileFromFirestore: (fileId) => ipcRenderer.invoke("firestore-remove-file", fileId),
  retrieveFilesFromFirestore: (userFilter) => ipcRenderer.invoke("firestore-retrieve-files", userFilter),
  downloadFileFromFirestore: (fileId) => ipcRenderer.invoke("firestore-download-file", fileId),
});
