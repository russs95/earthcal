const { app, BrowserWindow, Menu, shell, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');
app.commandLine.appendSwitch('disable-features', 'RendererCodeIntegrity');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1028,
    height: 769,
    icon: path.join(__dirname, 'icons', 'earthcal-app.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
    },
  });

  mainWindow.loadFile('index.html');

  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Exit', role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', role: 'reload' },
        { label: 'Toggle Developer Tools', role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', role: 'minimize' },
        { label: 'Maximize', role: 'maximize' },
        { label: 'Close', role: 'close' },
        { type: 'separator' }, // Separator for clarity
        {
          label: 'Minimal',
          click: () => minimalFloater()
        },
      ],
    },
    {
      label: 'Events',
      submenu: [
        {
          label: 'Import Datecycle',
          click: () => importMenuDatecycles(),
        },
        {
          label: 'Export Datecycles',
          click: () => exportMenuDatecycles(),
        },
        { type: 'separator' }, // Separator for clarity
        {
          label: 'Clear All Datecycles',
          click: () => deleteAllDatecycles(),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'EarthCal Online',
          click: () => shell.openExternal('https://cycles.earthen.io'),
        },
        {
          label: 'Calendar Guide Wiki',
          click: () => shell.openExternal('https://guide.earthen.io/'),
        },
        {
          label: 'Guided Tour',
          click: () => guidedTour(),
        },
      ],
    },
    {
      label: 'About',
      submenu: [
        {
          label: 'Created by Earthen.io',
          click: () => shell.openExternal('https://earthen.io'),
        },
        {
          label: 'License',
          click: () => showLicenseDialog(),
        },
        { type: 'separator' },
        {
          label: 'About Earthcal',
          click: () => showAboutDialog(),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 🔹 Function to Clear All Data (Browser Cache)
function deleteAllDatecycles() {
  dialog.showMessageBox({
    type: 'warning',
    title: 'Reset Earthcal',
    message: 'This will reset Earthcal. Are you sure you want to clear ALL your cycles, events, and personal preferences?',
    buttons: ['Cancel', 'OK'],
    defaultId: 1,
    cancelId: 0,
  }).then((response) => {
    if (response.response === 1) {  // User clicked OK
      session.defaultSession.clearStorageData({
        storages: ['appcache', 'cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers']
      }).then(() => {
        dialog.showMessageBox({
          type: 'info',
          title: 'Earthcal Reset',
          message: 'All Earthcal data has been cleared.',
          buttons: ['OK'],
        });
      });
    }
  });
}

// 🔹 Function to Minimize the Window to 200x200 and Move it to Bottom Right
function minimalFloater() {
  if (!mainWindow) return;

  // Get screen dimensions
  const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;

  // Set window to 200x200 and move to bottom-right corner
  mainWindow.setBounds({
    width: 200,
    height: 200,
    x: width - 210, // Adjusted slightly for padding
    y: height - 210
  });

  mainWindow.setAlwaysOnTop(true, 'floating'); // Keep it on top
}

// 🔹 Show About Dialog
function showAboutDialog() {
  const packagePath = path.join(__dirname, 'package.json');

  if (fs.existsSync(packagePath)) {
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageData = JSON.parse(packageContent);

    dialog.showMessageBox({
      type: 'info',
      title: packageData.description,
      detail: `Sync your moments with Earth's cycles.`,
      message: `${packageData.name} ${packageData.version}`,
      buttons: ['OK'],
    });
  } else {
    dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: 'Package.json file not found.',
      buttons: ['OK'],
    });
  }
}

// 🔹 Show License Dialog
function showLicenseDialog() {
  dialog.showMessageBox({
    type: 'info',
    title: 'Earthcal License',
    detail: `The EarthCal concept and code are licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) License found at https://creativecommons.org/licenses/by-nc-sa/4.0/ which allows for innovation but not commercialization, by allowing for derivatives of this concept that you may share with others and require you to attribute and/or link to cycles.earthen.io as the source of this concept and code.`,
    buttons: ['OK'],
  });
}

// 🔹 Placeholder Functions for Import/Export
function importMenuDatecycles() {
  dialog.showMessageBox({
    type: 'info',
    title: 'Import Datecycle',
    message: 'Sorry! This function to import your Earthcal events is still under development.',
    buttons: ['OK'],
  });
}

function exportMenuDatecycles() {
  dialog.showMessageBox({
    type: 'info',
    title: 'Export Datecycles',
    message: 'Sorry! This function to export your Earthcal events is still under development.',
    buttons: ['OK'],
  });
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
