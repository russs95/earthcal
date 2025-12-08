// =========================
// MAIN PROCESS: IMPORTS & GLOBALS
// =========================
const { app, BrowserWindow, Menu, shell, dialog, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let mainWindow = null;
let httpServer = null;
let serverStarted = false;

const PORT = 3000;
// Where index.html, dash.html, service-worker.js, assets/ etc. live inside the bundle/snap
const PUBLIC_DIR = __dirname;

// Enable SharedArrayBuffer support (as you had before)
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');
app.commandLine.appendSwitch('disable-features', 'RendererCodeIntegrity');


// =========================
// LOCAL HTTP SERVER (STATIC FILES)
// =========================
function startLocalServer() {
    if (serverStarted) return;

    httpServer = http.createServer((req, res) => {
        try {
            // Strip query string
            const urlPath = (req.url || '/').split('?')[0];

            // Default to index.html for root
            let filePath = urlPath === '/' ? '/index.html' : urlPath;

            // Simple path traversal protection
            filePath = filePath.replace(/\.\./g, '');

            // Resolve directories to their index.html so /auth/callback works in the snap
            const initialPath = path.join(PUBLIC_DIR, filePath);

            const serveFile = (finalPath) => {
                fs.readFile(finalPath, (err, data) => {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Not found');
                        return;
                    }

                    // Basic MIME type handling
                    let contentType = 'text/plain';
                    if (finalPath.endsWith('.html')) contentType = 'text/html';
                    else if (finalPath.endsWith('.js')) contentType = 'application/javascript';
                    else if (finalPath.endsWith('.css')) contentType = 'text/css';
                    else if (finalPath.endsWith('.json')) contentType = 'application/json';
                    else if (finalPath.endsWith('.webmanifest')) contentType = 'application/manifest+json';
                    else if (finalPath.endsWith('.png')) contentType = 'image/png';
                    else if (finalPath.endsWith('.jpg') || finalPath.endsWith('.jpeg')) contentType = 'image/jpeg';
                    else if (finalPath.endsWith('.webp')) contentType = 'image/webp';
                    else if (finalPath.endsWith('.svg')) contentType = 'image/svg+xml';
                    else if (finalPath.endsWith('.ttf')) contentType = 'font/ttf';
                    else if (finalPath.endsWith('.ico')) contentType = 'image/x-icon';

                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(data);
                });
            };

            fs.stat(initialPath, (err, stats) => {
                if (!err && stats.isDirectory()) {
                    const indexPath = path.join(initialPath, 'index.html');
                    serveFile(indexPath);
                    return;
                }

                serveFile(initialPath);
            });
        } catch (e) {
            console.error('HTTP server error:', e);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal server error');
        }
    });

    httpServer.listen(PORT, '127.0.0.1', () => {
        serverStarted = true;
        createWindow(); // Only create the window once server is ready
    });

    httpServer.on('error', (err) => {
        console.error('Local HTTP server failed:', err);
        // Fallback to file:// if localhost fails for some reason
        createWindow(true);
    });
}


// =========================
// BROWSER WINDOW & MENU
// =========================
function createWindow(useFileFallback = false) {
    mainWindow = new BrowserWindow({
        width: 1028,
        height: 769,
        icon: path.join(__dirname, 'assets', 'earthcal.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false,
        },
    });

    const startURL = useFileFallback
        ? `file://${path.join(__dirname, 'index.html')}`
        : `http://127.0.0.1:${PORT}/index.html`;

    mainWindow.loadURL(startURL);

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
                // Minimal Mode is currently commented out (see section below)
                // { label: 'Minimal Mode', click: () => toggleMinimalFloater() },
            ],
        },
        {
            label: 'Help',
            submenu: [
                { label: 'EarthCal Online', click: () => shell.openExternal('https://cycles.earthen.io') },
                { label: 'Calendar Guide Wiki', click: () => shell.openExternal('https://guide.earthen.io/') },
                {
                    label: 'Guided Tour',
                    click: () => {
                        // Let the renderer handle the actual guided tour
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.webContents.send('start-guided-tour');
                        }
                    },
                },
            ],
        },
        {
            label: 'About',
            submenu: [
                {
                    label: 'Created by Earthen.io',
                    click: () => shell.openExternal('https://earthen.io/cycles/'),
                },
                { label: 'License', click: () => showLicenseDialog() },
                { type: 'separator' },
                { label: 'About Earthcal', click: () => showAboutDialog() },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}


// =========================
// ABOUT & LICENSE DIALOGS
// =========================
function showAboutDialog() {
    const packagePath = path.join(__dirname, 'package.json');

    // Use SNAP environment variable for icon path (if you decide to use it in the future)
    const iconPath = path.join(process.env.SNAP || __dirname, 'meta/gui/earthcal.png');

    if (fs.existsSync(packagePath)) {
        const packageContent = fs.readFileSync(packagePath, 'utf8');
        const packageData = JSON.parse(packageContent);

        dialog.showMessageBox({
            type: 'info',
            title: 'About',
            message: `EarthCal ${packageData.version}`,
            detail: 'Sync your moments with Earth\'s cycles.',
            buttons: ['OK'],
            icon: iconPath, // optional: comment out if you don’t want an icon
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
    const iconPath = path.join(process.env.SNAP || __dirname, 'meta/gui/earthcal.png');

    dialog.showMessageBox({
        type: 'info',
        title: 'EarthCal License',
        detail:
            'The EarthCal concept and code are licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) License.',
        buttons: ['OK'],
        icon: iconPath, // optional
    });
}


// =========================
// OPTIONAL: MINIMAL MODE (CURRENTLY DISABLED)
// =========================
/*
let isMinimal = false;

function toggleMinimalFloater() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  // NOTE: openClock and userTimeZone need to be defined or removed
  // openClock(userTimeZone);

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
    mainWindow.setFocusable(true);
    mainWindow.setMovable(true);
    mainWindow.setTitle('');

    mainWindow.setMenuBarVisibility(true);
    mainWindow.setAutoHideMenuBar(true);

    mainWindow.setBackgroundColor('#00000000');
    mainWindow.setHasShadow(true);

    mainWindow.webContents.executeJavaScript(`
      document.body.style.webkitAppRegion = 'drag';
      document.body.style.cursor = 'grab';
    `);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Maximize',
        click: () => toggleMinimalFloater(),
      },
    ]);

    mainWindow.webContents.on('context-menu', () => {
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

    mainWindow.webContents.executeJavaScript(`
      document.body.style.webkitAppRegion = 'no-drag';
      document.body.style.cursor = 'default';
    `);
  }
}

// If you want renderer to trigger restore/maximize:
// ipcMain.on('restore-earthcal', () => {
//   toggleMinimalFloater();
// });
*/


// =========================
// APP LIFECYCLE
// =========================
app.whenReady().then(() => {
    startLocalServer();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        if (serverStarted) {
            createWindow();
        } else {
            startLocalServer();
        }
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('quit', () => {
    if (httpServer) {
        httpServer.close();
    }
});
