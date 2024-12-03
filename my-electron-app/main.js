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

// Check for user uploads.
function checkForUploads() {
  const uploadDir = path.join(__dirname, 'user_uploads')

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log("user_uploads directory created.")
  }

  const files = fs.readdirSync(uploadDir)
  
  // If there are no files, return "Zero", otherwise return the files.
  if(files.length == 0) {
    return "Zero"
  }
  else {
    return files
  }
}

// Upload files to user_uploads directory.
function uploadFile(file) {
  if (!file || !file.name || !file.data) {
    throw new TypeError("Invalid file object. The file, file.name, and file.data must be defined.");
  }

  const uploadDir = path.join(__dirname, 'user_uploads');
  const filePath = path.join(uploadDir, file.name);

  fs.writeFileSync(filePath, file.data);
  console.log("Uploaded file " + file.name + " successfully.");
  return "Success";
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

ipcMain.handle('check-uploads', () => {
  return checkForUploads()
})

ipcMain.handle('upload-file', async (event, file) => {
  try {
    const result = await uploadFile(file);
    return result;
  } 
  catch (error) {
    console.error("Error uploading file:", error.message);
    return error.message;
  }
});

app.whenReady().then(() => {
  createWindow()
  checkForUploads()

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