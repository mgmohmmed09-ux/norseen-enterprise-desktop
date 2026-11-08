const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('node:path');

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'نظام نورسين للإدارة المؤسسية',
    icon: path.join(__dirname, '..', 'assets', 'ICO.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
};

app.whenReady().then(() => {
  createWindow();

  if (app.isPackaged) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.checkForUpdatesAndNotify().catch((error) => {
      console.warn('Automatic update check failed:', error.message);
    });

    autoUpdater.on('update-downloaded', () => {
      dialog
        .showMessageBox({
          type: 'info',
          title: 'تحديث Norseen جاهز',
          message: 'تم تحميل تحديث جديد. سيتم تثبيته عند إغلاق البرنامج.',
          buttons: ['موافق'],
        })
        .catch(() => {});
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
