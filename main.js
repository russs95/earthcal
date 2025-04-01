const { app, BrowserWindow, Menu, shell, dialog, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let isMinimal = false;

app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');
app.commandLine.appendSwitch('disable-features', 'RendererCodeIntegrity');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1028,
    height: 769,
    icon: path.join(__dirname, 'icons', 'earthcal.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
    },
  });

  mainWindow.loadFile('index.html');

  const template = [
    {
      label: 'File',
      submenu: [{ label: 'Exit', role: 'quit' }],
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
        { type: 'separator' },
        { label: 'Minimal Mode', click: () => toggleMinimalFloater() },
      ],
    },
    {
      label: 'Events',
      submenu: [
        { label: 'Import Datecycle', click: () => importMenuDatecycles() },
        { label: 'Export Datecycles', click: () => exportMenuDatecycles() },
        { type: 'separator' },
        { label: 'Clear All Datecycles', click: () => deleteAllDatecycles() },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'EarthCal Online', click: () => shell.openExternal('https://cycles.earthen.io') },
        { label: 'Calendar Guide Wiki', click: () => shell.openExternal('https://guide.earthen.io/') },
        { label: 'Guided Tour', click: () => guidedTour() },
      ],
    },
    {
      label: 'About',
      submenu: [
        { label: 'Created by Earthen.io', click: () => shell.openExternal('https://earthen.io') },
        { label: 'License', click: () => showLicenseDialog() },
        { type: 'separator' },
        { label: 'About Earthcal', click: () => showAboutDialog() },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

const { screen } = require('electron');


function toggleMinimalFloater() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  if (!isMinimal) {
    isMinimal = true;

    mainWindow.setBounds({
      width: 220,
      height: 240,
      x: screen.getPrimaryDisplay().workAreaSize.width - 210,
      y: screen.getPrimaryDisplay().workAreaSize.height - 210,
    });

    mainWindow.setAlwaysOnTop(true, 'floating');
    mainWindow.setResizable(true);
    mainWindow.setSkipTaskbar(true);
    mainWindow.setFocusable(false);
    mainWindow.setMovable(true);
    mainWindow.setTitle('');

    // ✅ Remove menu bar completely, but keep functionality
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAutoHideMenuBar(true);

    // ✅ Transparent floating effect
    mainWindow.setBackgroundColor('#00000000');
    mainWindow.setHasShadow(false);

    // ✅ Enable full window dragging
    mainWindow.webContents.executeJavaScript(`
      document.body.style.webkitAppRegion = 'drag';
      document.body.style.cursor = 'grab';
    `);

    // ✅ Add a simple right-click context menu with "Maximize"
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Maximize",
        click: () => toggleMinimalFloater()
      }
    ]);

    mainWindow.webContents.on("context-menu", (e) => {
      contextMenu.popup();
    });

  } else {
    isMinimal = false;
    mainWindow.setBounds({ width: 1028, height: 769 });
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setResizable(true);
    mainWindow.setSkipTaskbar(false);
    mainWindow.setFocusable(true);
    mainWindow.setMovable(true);

    mainWindow.setMenuBarVisibility(true);
    mainWindow.setAutoHideMenuBar(false);
    mainWindow.setTitle('EarthCal');

    mainWindow.setBackgroundColor('#FFFFFF');
    mainWindow.setHasShadow(true);

    // ✅ Disable dragging when maximized
    mainWindow.webContents.executeJavaScript(`
      document.body.style.webkitAppRegion = 'no-drag';
      document.body.style.cursor = 'default';
    `);
  }
}

// 🔹 Ensure IPC Event Listener Works
ipcMain.on('restore-earthcal', () => {
  toggleMinimalFloater();
});



// 🔹 Show About Dialog (Fixed Syntax)
function showAboutDialog() {
  const packagePath = path.join(__dirname, 'package.json');

  // Use SNAP environment variable for icon path
  const iconPath = path.join(process.env.SNAP || __dirname, 'meta/gui/earthcal.png');

  if (fs.existsSync(packagePath)) {
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageData = JSON.parse(packageContent);

    dialog.showMessageBox({
      type: 'info',
      title: `About`, // ✅ Fixed syntax
      message: `EarthCal ${packageData.version}`, // ✅ Fixed syntax

      detail: `Sync your moments with Earth's cycles.`,
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
// Use SNAP environment variable for icon path
  const iconPath = path.join(process.env.SNAP || __dirname, 'meta/gui/earthcal.png');
  dialog.showMessageBox({
    type: 'info',
    title: 'Earthcal License',

    detail: `The EarthCal concept and code are licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) License.`,
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







function exportMenuDatecycles() {
  const { dialog } = require('electron');
  const fs = require('fs');

  dialog.showMessageBox({
    type: 'info',
    title: 'Export My Calendar DateCycles',
    message: 'Use this feature to export all your personal dateCycles (from your My Calendar). You can then import the file on another account or share them to be published as a public calendar.',
    buttons: ['Cancel', 'Save Datecycles...'],
    defaultId: 1,
    cancelId: 0
  }).then(response => {
    if (response.response === 1) {  // User clicked "Save Datecycles..."
      mainWindow.webContents.executeJavaScript(`
        (async () => {
          try {
            let exportedData = [];

            // Loop through localStorage keys
            for (let i = 0; i < localStorage.length; i++) {
              let key = localStorage.key(i);

              // Ensure it's a calendar key
              if (key.startsWith('calendar_')) {
                let rawData = localStorage.getItem(key);

                // Handle stringified JSON issue
                let parsedData;
                try {
                  parsedData = JSON.parse(rawData);
                } catch (e) {
                  console.error('Error parsing stored JSON for', key, e);
                  continue;
                }

                if (Array.isArray(parsedData)) {
                  // Filter only My Calendar & non-public (public: 0)
                  let myCalendarData = parsedData.filter(event =>
                    event.cal_name === 'My Calendar' && event.public === 0
                  );

                  exportedData = exportedData.concat(myCalendarData);
                }
              }
            }

            if (exportedData.length === 0) {
              require('electron').dialog.showMessageBox({
                type: 'info',
                title: 'No Personal DateCycles',
                message: 'No private DateCycles found in your My Calendar to export.',
                buttons: ['OK']
              });
              return;
            }

            // Send parsed data back to main process for file saving
            require('electron').ipcRenderer.send('save-datecycles', JSON.stringify(exportedData, null, 2));
          } catch (error) {
            console.error('Export error:', error);
            require('electron').dialog.showMessageBox({
              type: 'error',
              title: 'Export Failed',
              message: 'An error occurred while exporting your DateCycles.',
              buttons: ['OK']
            });
          }
        })();
      `);
    }
  });
}




ipcMain.on('save-datecycles', (event, data) => {
  dialog.showSaveDialog({
    title: 'Save DateCycles File',
    defaultPath: 'EarthCal_DateCycles.json',
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs.writeFile(result.filePath, data, 'utf8', (err) => {
        if (err) {
          dialog.showMessageBox({
            type: 'error',
            title: 'Save Failed',
            message: 'Could not save the DateCycles file.',
            buttons: ['OK']
          });
        } else {
          dialog.showMessageBox({
            type: 'info',
            title: 'Export Successful',
            message: 'Your My Calendar DateCycles were successfully saved!',
            buttons: ['OK']
          });
        }
      });
    }
  });
});



// 🔹 Function to Import Datecycles
function importMenuDatecycles() {
  dialog.showOpenDialog({
    title: 'Select Datecycle JSON File',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  }).then(result => {
    if (result.canceled || result.filePaths.length === 0) {
      return;
    }

    const filePath = result.filePaths[0];

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        dialog.showMessageBox({ type: 'error', title: 'Import Failed', message: 'Error reading file.', buttons: ['OK'] });
        return;
      }

      try {
        const importedDatecycles = JSON.parse(data);
        if (!Array.isArray(importedDatecycles) || importedDatecycles.length === 0) throw new Error('Invalid format.');
        mainWindow.webContents.send('import-datecycles', importedDatecycles);
      } catch (error) {
        dialog.showMessageBox({ type: 'error', title: 'Import Error', message: 'Invalid JSON format.', buttons: ['OK'] });
      }
    });
  });
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
