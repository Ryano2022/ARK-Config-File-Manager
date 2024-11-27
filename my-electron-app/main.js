const { app, BrowserWindow, Menu, globalShortcut } = require('electron/main')
const path = require('path');

const isDev = !app.isPackaged
const isMac = process.platform === 'darwin'

const appWidth = 800
const appHeight = 600

const createWindow = () => {
  const win = new BrowserWindow({
    width: appWidth,
    height: appHeight,
    icon: path.join(__dirname, 'assets', 'favicon.ico')
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

app.whenReady().then(() => {
  createWindow()

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