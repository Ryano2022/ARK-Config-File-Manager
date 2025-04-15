const { app, BrowserWindow, Menu, globalShortcut, ipcMain, dialog } = require("electron/main");
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = require("firebase/auth");
const {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
} = require("firebase/firestore");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

//------------------------------------------------------------------------------
// Configuration
//------------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  appId: process.env.FIREBASE_APP_ID,
};

const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY,
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const gemini = new GoogleGenerativeAI(geminiConfig.apiKey);
const tooltipQueue = [];
let isProcessingQueue = false;

const isDev = !app.isPackaged;
const isMac = process.platform === "darwin";
const appWidth = 1200;
const appHeight = 800;
const userFileDir = path.join(app.getPath("appData"), "ARK Config File Manager");

//------------------------------------------------------------------------------
// File System Functions
//------------------------------------------------------------------------------

// Ensure the directory for AppData exists.
function ensureAppDataExists() {
  if (!fs.existsSync(userFileDir)) {
    fs.mkdirSync(userFileDir, { recursive: true });
    console.info("Created AppData directory at: " + userFileDir);
    return false;
  }
  return true;
}

// Check for files in AppData directory.
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

// Read files from AppData directory.
function readFile(filename) {
  const filePath = path.join(userFileDir, filename);

  if (checkForAddedFiles() == "Zero") {
    console.error("Error reading file: No files found in directory. ");
    throw new Error("No files found.");
  } else {
    console.info('Reading file: "' + filename + '" from ' + userFileDir);
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

//------------------------------------------------------------------------------
// Authentication Functions
//------------------------------------------------------------------------------

// Convert Firebase user to simplified format.
function serialiseUser(firebaseUser) {
  if (!firebaseUser) return null;

  return {
    email: firebaseUser.email,
    uid: firebaseUser.uid,
  };
}

//------------------------------------------------------------------------------
// Window Management
//------------------------------------------------------------------------------

// Create and configure the main application window.
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

  // Ensure the directory exists on startup.
  ensureAppDataExists();
};

//------------------------------------------------------------------------------
// IPC Handlers - File Operations
//------------------------------------------------------------------------------
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

//------------------------------------------------------------------------------
// IPC Handlers - Dialog
//------------------------------------------------------------------------------
ipcMain.handle("dialog:showDirectoryPicker", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled) {
    return null;
  }
  return result.filePaths[0];
});

//------------------------------------------------------------------------------
// IPC Handlers - Authentication
//------------------------------------------------------------------------------
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

//------------------------------------------------------------------------------
// IPC Handlers - Firestore Operations
//------------------------------------------------------------------------------
ipcMain.handle("firestore-add-file", async (event, file) => {
  try {
    console.log("[Firestore] Attempting to add file: ", file.name);
    const docRef = await addDoc(collection(db, "configFiles"), {
      name: file.name,
      descriptionShort: file.descriptionShort,
      descriptionLong: file.descriptionLong,
      content: file.content,
      uploadedBy: file.uploadedBy,
      uploadedAt: file.uploadedAt,
    });
    console.log("[Firestore] Successfully added file with ID: ", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("[Firestore] Error adding file: ", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("firestore-remove-file", async (event, fileId) => {
  try {
    console.log("[Firestore] Attempting to remove file: ", fileId);
    await deleteDoc(doc(db, "configFiles", fileId));
    console.log("[Firestore] Successfully removed file. ");
    return { success: true };
  } catch (error) {
    console.error("[Firestore] Error removing file: ", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("firestore-retrieve-files", async (event, userFilter) => {
  try {
    console.log("[Firestore] Retrieving files with filter: ", userFilter);
    let filesQuery;

    if (userFilter && userFilter.id) {
      // If we have a file ID, get that specific file.
      const docRef = doc(db, "configFiles", userFilter.id);
      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists()) {
        return [
          {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          },
        ];
      }
      return [];
    } else if (userFilter && userFilter.uid) {
      // Filter by user UID instead of email.
      filesQuery = query(collection(db, "configFiles"), where("uploadedBy.uid", "==", userFilter.uid));
    } else {
      // No filter, get all files.
      filesQuery = collection(db, "configFiles");
    }

    const querySnapshot = await getDocs(filesQuery);
    const files = [];
    querySnapshot.forEach((doc) => {
      files.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    console.log("[Firestore] Retrieved files count: ", files.length);
    return files;
  } catch (error) {
    console.error("[Firestore] Error retrieving files: ", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("firestore-download-file", async (event, fileId) => {
  try {
    console.log("[Firestore] Attempting to download file with ID: ", fileId);

    const docRef = doc(db, "configFiles", fileId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      throw new Error("[Firestore] File not found in Firestore. ");
    }

    const fileData = docSnapshot.data();

    const result = await addFile({
      name: fileData.name,
      data: fileData.content,
    });

    console.log("[Firestore] Successfully downloaded file to local storage: ", fileData.name);
    return { success: true, result, fileName: fileData.name };
  } catch (error) {
    console.error("[Firestore] Error downloading file: ", error);
    return { success: false, error: error.message };
  }
});

//------------------------------------------------------------------------------
// IPC Handlers - Gemini AI
//------------------------------------------------------------------------------

async function processTooltipQueue() {
  if (isProcessingQueue || tooltipQueue.length == 0) return;

  isProcessingQueue = true;

  const { key, resolve, reject } = tooltipQueue.shift();

  try {
    if (!geminiConfig.apiKey) {
      console.error("[Gemini] No API key available.");
      resolve(null);
      return;
    }

    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Prefix this with "[AI generated description may be inaccurate.]".
      
      Create a short, helpful tooltip (1-2 sentences) explaining this ARK: Survival Evolved or ARK: Survival Ascended game setting: "${key}"
      
      The tooltip should clearly explain what the setting controls in the game and how changing it affects gameplay.
      
      Be concise but informative. Do not include phrases like "This setting" - just provide the direct explanation.
      
      If the setting name contains stat indices (e.g., StatsMultiplier_Player[0]), reference what that stat index means (e.g., Health).
    `;

    const result = await model.generateContent(prompt);
    const tooltip = result.response.text().trim();

    const truncatedTooltip = tooltip.length > 30 ? `${tooltip.substring(0, 30)}...` : tooltip;
    console.log(`Generated tooltip for "${key}": ${truncatedTooltip}`);
    resolve(tooltip);
  } catch (error) {
    console.error(`Error generating tooltip with Gemini for ${key}:`, error);
    resolve(null); // Resolve with null to not break the queue.
  } finally {
    isProcessingQueue = false;

    // Wait before processing next request - adjust delay as needed based on API limits.
    setTimeout(() => {
      processTooltipQueue();
    }, 3000); // 3 second delay between requests.
  }
}

const tooltipRequestTracker = {};

ipcMain.handle("generate-ai-tooltip", async (event, key) => {
  try {
    // Update request counts and determine if this is a repeat request.
    tooltipRequestTracker[key] = (tooltipRequestTracker[key] || 0) + 1;
    const requestCount = tooltipRequestTracker[key];
    const isRepeatRequest = requestCount > 1;

    if (isRepeatRequest) {
      process.stdout.write(`\r${requestCount - 1} more requests for above tooltip.`);
    } else {
      console.log(`\nRequesting tooltip for: "${key}"`);
    }

    // First, check if this tooltip is in Firestore.
    const tooltipsRef = collection(db, "tooltips");
    const q = query(tooltipsRef, where("key", "==", key));
    const querySnapshot = await getDocs(q);

    // If tooltip exists in Firestore, return it immediately.
    if (!querySnapshot.empty) {
      const tooltipDoc = querySnapshot.docs[0].data();

      if (isRepeatRequest) {
        process.stdout.write(`\r${requestCount - 1} more requests for above tooltip.`);
      } else {
        console.log(`\nRetrieved from cache: "${key}"`);
      }

      return tooltipDoc.content;
    }

    // If not in Firestore, generate with Gemini and store result.
    return new Promise((resolve, reject) => {
      tooltipQueue.push({
        key,
        resolve: async (tooltip) => {
          // If we successfully generated a tooltip, store it in Firestore.
          if (tooltip) {
            try {
              await addDoc(collection(db, "tooltips"), {
                key: key,
                content: tooltip,
                createdAt: new Date().toISOString(),
              });
            } catch (error) {
              console.error(`Error storing tooltip for ${key}:`, error);
            }
          }
          // Still resolve with the tooltip even if storage fails.
          resolve(tooltip);
        },
        reject,
      });

      // Start processing if not already running
      if (!isProcessingQueue) {
        processTooltipQueue();
      }
    });
  } catch (error) {
    console.error(`Error retrieving/generating tooltip for ${key}:`, error);
    return null;
  }
});

//------------------------------------------------------------------------------
// App Lifecycle
//------------------------------------------------------------------------------
app.whenReady().then(() => {
  createWindow();
  checkForAddedFiles();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});
