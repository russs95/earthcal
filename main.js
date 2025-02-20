const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const jsyaml = require('js-yaml');

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
        {
          label: 'Exit',
          role: 'quit',
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          role: 'reload',
        },
        {
          label: 'Toggle Developer Tools',
          role: 'toggleDevTools',
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          role: 'minimize',
        },
        {
          label: 'Maximize',
          role: 'maximize',
        },
        {
          label: 'Close',
          role: 'close',
        },
      ],
    },
    {
      label: 'Events',
      submenu: [
        {
          label: 'Import Events & Cycles',
          click: () => uploadDateCycles(),
        },
        {
          label: 'Export Events & Cycles',
          click: () => downloadDateCycles(),
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
          click: () => guidedTour(),        },
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
        {
          type: 'separator', // This adds a separator
        },
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




function showLicenseDialog() {
  const snapcraftPath = path.join(__dirname, 'snap', `snapcraft.yaml`);

  if (fs.existsSync(snapcraftPath)) {
    const snapcraftContent = fs.readFileSync(snapcraftPath, 'utf8');
    const snapcraftData = jsyaml.load(snapcraftContent);

    dialog.showMessageBox({
      type: 'info',
      title: `${snapcraftData.name} ${snapcraftData.version}`,
      detail: `The EarthCal concept and code are licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) License found at https://creativecommons.org/licenses/by-nc-sa/4.0/ which allows for innovation but not commercialization, by allowing for derivatives of this concept that you may share with others and require you to attribute and/or link to cycles.earthen.io as the source of this concept and code.
      `,

      buttons: ['OK'],
    });
  } else {
    dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: 'Snapcraft.yaml file not found.',
      buttons: ['OK'],
    });
  }
}






app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});






// npx electron-packager . earthcal --platform=linux --arch=x64 --overwrite
// snapcraft
// sudo snap install --dangerous ./earthcal_0.4.0_amd64.snap
// snapcraft login
// snapcraft push earthcal_0.4.15_amd64.snap
//sudo snap refresh earthcal --edge
////// npx electron-builder --linux snap
//sudo snap install --dangerous dist/earthcal_0.9.0_amd64.snap
//snapcraft login
//snapcraft upload dist/earthcal_0.9.0_amd64.snap
//snapcraft release earthcal 68 edge
//ulimit -n 4096




