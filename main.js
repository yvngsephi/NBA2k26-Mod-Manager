const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { createApp } = require('./server/app');

let serverInstance = null;
let mainWindow = null;

function startServer() {
  const expressApp = createApp();
  const PORT = 3200;
  return new Promise((resolve) => {
    serverInstance = expressApp.listen(PORT, '127.0.0.1', () => {
      console.log(`NBA 2K26 Court Mod Manager server listening on http://127.0.0.1:${PORT}`);
      resolve(PORT);
    });
  });
}

async function createWindow() {
  await startServer();

  mainWindow = new BrowserWindow({
    width: 1120,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    title: 'NBA 2K26 Court Manager',
    backgroundColor: '#121316',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL('http://127.0.0.1:3200');

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serverInstance) {
      serverInstance.close();
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
