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

// 🔹 Function to Toggle Minimal Mode
function toggleMinimalFloater() {
  if (!mainWindow) return;

  if (!isMinimal) {
    // ✅ Switch to Minimal Mode
    isMinimal = true;
    mainWindow.setBounds({
      width: 200,
      height: 200,
      x: require('electron').screen.getPrimaryDisplay().workAreaSize.width - 210, // Right corner
      y: require('electron').screen.getPrimaryDisplay().workAreaSize.height - 210, // Bottom
    });

    mainWindow.setAlwaysOnTop(true, 'floating');
    mainWindow.setMenuBarVisibility(false); // Hide menu bar
    mainWindow.setTitle(''); // Remove title bar

    // ✅ Send JavaScript to Modify UI in the Renderer
    mainWindow.webContents.executeJavaScript(`
      document.getElementById('header').style.display = 'none';
      document.getElementById('top-left-buttons').style.display = 'none';
      document.getElementById('time-controller').style.display = 'none';
      document.getElementById('bottom-left-buttons').style.display = 'none';
      document.getElementById('registration-footer').style.display = 'none';
      document.getElementById('main-clock').style.display = 'block';

      // Make the whole window clickable to restore
      document.body.style.cursor = 'pointer';
      document.body.onclick = () => {
        window.electronAPI.restoreEarthcal();
      };
    `);

  } else {
    // ✅ Restore Full Size Mode
    isMinimal = false;
    mainWindow.setBounds({ width: 1028, height: 769 });
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setMenuBarVisibility(true); // Restore menu bar
    mainWindow.setTitle('EarthCal'); // Restore title

    mainWindow.webContents.executeJavaScript(`
      document.getElementById('header').style.display = 'block';
      document.getElementById('top-left-buttons').style.display = 'block';
      document.getElementById('time-controller').style.display = 'block';
      document.getElementById('buttom-left-buttons').style.display = 'block';
      document.getElementById('registration-footer').style.display = 'block';
      document.getElementById('main-clock').style.display = 'none';

      // Restore normal click behavior
      document.body.style.cursor = 'default';
      document.body.onclick = null;
    `);
  }
}

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





app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});











