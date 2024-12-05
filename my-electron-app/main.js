// Imports.
const { app, BrowserWindow, Menu, globalShortcut, ipcMain } = require('electron/main')
const path = require('path');
const fs = require('fs');

// Checking if you're a dev or on macOS.
const isDev = !app.isPackaged
const isMac = process.platform === 'darwin'

// App dimensions.
const appWidth = 800
const appHeight = 600

// Check for user added files.
function checkForAddedFiles() {
  const userFileDir = path.join(__dirname, 'user_files')

  if (!fs.existsSync(userFileDir)) {
    fs.mkdirSync(userFileDir);
    console.log("user_files directory created.")
  }

  const files = fs.readdirSync(userFileDir)
  
  // If there are no files, return "Zero", otherwise return the files.
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

  const userFileDir = path.join(__dirname, 'user_files');
  const filePath = path.join(userFileDir, file.name);

  fs.writeFileSync(filePath, file.data);
  console.log("Added file " + file.name + " successfully.");
  return "Success";
}

function readFile(filename) {
  const userFileDir = path.join(__dirname, 'user_files');
  const filePath = path.join(userFileDir, filename);
  return fs.readFileSync(filePath, 'utf8');
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: appWidth,
    height: appHeight,
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