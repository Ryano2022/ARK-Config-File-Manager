// Imports.
const { app, BrowserWindow, Menu, globalShortcut, ipcMain, dialog } = require("electron/main");
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = require("firebase/auth");
require("dotenv").config();

const path = require("path");
const fs = require("fs");

// Firebase configuration.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  appId: process.env.FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// Checking if you're a dev or on macOS.
const isDev = !app.isPackaged;
const isMac = process.platform === "darwin";

// App dimensions.
const appWidth = 1200;
const appHeight = 800;

// User files directory (in AppData).
const userFileDir = path.join(app.getPath("appData"), "ARK Config Manager");

// Ensure AppData directory exists.
function ensureAppDataExists() {
  if (!fs.existsSync(userFileDir)) {
    fs.mkdirSync(userFileDir, { recursive: true });
    console.info("Created AppData directory at: " + userFileDir);
    return false;
  }
  return true;
}

// Check for user added files.
function checkForAddedFiles() {
  ensureAppDataExists();
  const files = fs.readdirSync(userFileDir);

  // Return zero if no files are found.
  if (files.length == 0) {
    return "Zero";
  } else {
    return files;
  }
}

// Add files to AppData directory.
function addFile(file) {
  if (!file || !file.name || !file.data) {
    console.error("Error adding file: Invalid file object provided. ");
    throw new TypeError("Invalid file object. The file, file.name, and file.data must be defined.");
  }

  ensureAppDataExists();
  const filePath = path.join(userFileDir, file.name);
  fs.writeFileSync(filePath, file.data);
  console.info("Added file " + file.name + " to " + userFileDir);
  return "Success";
}

function readFile(filename) {
  const filePath = path.join(userFileDir, filename);

  if (checkForAddedFiles() == "Zero") {
    console.error("Error reading file: No files found in directory. ");
    throw new Error("No files found.");
  } else {
    console.info('Reading file: "' + filename + '" ');
    return fs.readFileSync(filePath, "utf8");
  }
}

// Remove files from AppData directory.
function removeFile(filename) {
  const filePath = path.join(userFileDir, filename);
  fs.unlinkSync(filePath);
  console.info('Removed file "' + filename + '" from ' + userFileDir);
}

// Save changes to files.
function saveFile(filename, content, directory) {
  const filePath = directory ? path.join(directory, filename) : path.join(userFileDir, filename);
  fs.writeFileSync(filePath, content, "utf8");
  console.info('Saved file as: "' + filename + '" to ' + filePath);
  return "Success";
}

function serialiseUser(firebaseUser) {
  if (!firebaseUser) return null;

  return {
    email: firebaseUser.email,
    uid: firebaseUser.uid,
  };
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: appWidth,
    height: appHeight,
    // Favicon was taken from a wiki page found here: https://ark.wiki.gg/wiki/Creative_Mode
    icon: path.join(__dirname, "src", "assets", "icons", "favicon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.setMinimumSize(appWidth / 2, appHeight / 2);
  win.maximize();
  win.loadFile(path.join(__dirname, "src", "index.html"));

  // Get rid of the default menu.
  Menu.setApplicationMenu(null);

  // If I'm in development mode, I want to be able to open the dev tools.
  if (isDev) {
    globalShortcut.register("Ctrl+Shift+I", () => {
      win.webContents.toggleDevTools();
    });
  }

  // Ensure AppData directory exists
  ensureAppDataExists();
};

ipcMain.handle("check-added-files", () => {
  return checkForAddedFiles();
});

ipcMain.handle("add-file", async (event, file) => {
  try {
    const result = await addFile(file);
    return result;
  } catch (error) {
    console.error("Error adding file: " + error.message);
    return error.message;
  }
});

ipcMain.handle("read-file", async (event, filename) => {
  try {
    return readFile(filename);
  } catch (error) {
    console.error("Error reading file: " + error);
    return null;
  }
});

ipcMain.handle("remove-file", async (event, filename) => {
  try {
    removeFile(filename);
    return "Success";
  } catch (error) {
    console.error("Error removing file: " + error.message);
    return error.message;
  }
});

ipcMain.handle("save-file", async (event, filename, content, directory) => {
  try {
    const result = await saveFile(filename, content, directory);
    return result;
  } catch (error) {
    console.error("Error saving file: " + error.message);
    return error.message;
  }
});

ipcMain.handle("dialog:showDirectoryPicker", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle("auth-get-current-user", () => {
  return serialiseUser(auth.currentUser);
});

ipcMain.handle("auth-register", async (event, email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    return {
      success: true,
      user: serialiseUser(result.user),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("auth-sign-in", async (event, email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);

    return {
      success: true,
      user: serialiseUser(result.user),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("auth-sign-out", async () => {
  try {
    await signOut(auth);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  createWindow();
  checkForAddedFiles();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});
