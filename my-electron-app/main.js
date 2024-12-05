// Imports.
const { app, BrowserWindow, Menu, globalShortcut, ipcMain } = require('electron/main')
const path = require('path');
const fs = require('fs');

// Checking if you're a dev or on macOS.
const isDev = !app.isPackaged
const isMac = process.platform === 'darwin'

// App dimensions.
const appWidth = 1200
const appHeight = 800

// User files directory.
const userFileDir = path.join(__dirname, 'user_files')

// Check for user added files.
function checkForAddedFiles() {
  const files = fs.readdirSync(userFileDir)
  
  // Return zero if no files are found.
  if(files.length == 0) {
    return "Zero"
  }
  else {
    return files
  }
}

// Add files to user_files directory.
function addFile(file) {
  if (!file || !file.name || !file.data) {
    throw new TypeError("Invalid file object. The file, file.name, and file.data must be defined.");
  }

  const filePath = path.join(userFileDir, file.name);

  fs.writeFileSync(filePath, file.data);
  console.log("Added file " + file.name + " successfully.");
  return "Success";
}

function readFile(filename) {
  const filePath = path.join(userFileDir, filename);
  
  if (checkForAddedFiles() == "Zero") {
    throw new Error("No files found.");
  }
  else {
    return fs.readFileSync(filePath, 'utf8');
  }
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: appWidth,
    height: appHeight,
    // Favicon was taken from a wiki page found here: https://ark.wiki.gg/wiki/Creative_Mode
    icon: path.join(__dirname, 'assets', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.setMinimumSize(appWidth / 2, appHeight / 2)
  win.loadFile('index.html')

  // Get rid of the default menu.
  Menu.setApplicationMenu(null)

  // If I'm in development mode, I want to be able to open the dev tools.
  if(isDev) {
    globalShortcut.register("Ctrl+Shift+I", () => {
      win.webContents.toggleDevTools();
    });
  }

  // Create the user_files directory if it doesn't exist.
  if (!fs.existsSync(userFileDir)) {
    fs.mkdirSync(userFileDir);
    console.log("user_files directory created.")
  }
}

ipcMain.handle('check-added-files', () => {
  return checkForAddedFiles()
})

ipcMain.handle('add-file', async (event, file) => {
  try {
    const result = await addFile(file);
    return result;
  } 
  catch (error) {
    console.error("Error adding file:", error.message);
    return error.message;
  }
});

ipcMain.handle('read-file', async (event, filename) => {
  try {
    return readFile(filename);
  } 
  catch (error) {
    console.error("Error reading file:", error);
    return null;
  }
});

app.whenReady().then(() => {
  createWindow()
  checkForAddedFiles()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. 
app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit()
  }
})