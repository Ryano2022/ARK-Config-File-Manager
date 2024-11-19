const { app, BrowserWindow, Menu, globalShortcut } = require('electron/main')
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'assets', 'favicon.ico')
  })

  win.loadFile('index.html')

  // Get rid of the default menu.
  Menu.setApplicationMenu(null)

  // Keyboard shortcut to the dev tools.
  globalShortcut.register("Ctrl+Shift+I", () => {
    win.webContents.toggleDevTools();
  });
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})