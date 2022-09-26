import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { getImages, replaceImage } from './rcc';
import { Image } from '../types/Image';
import createMenu from './menu';
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow;

const createWindow = async () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    backgroundColor: '#222831',
    title: "Nekiro's Rcc Editor",
    show: false,
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate(createMenu(mainWindow)));

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // show when its ready
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const getPreparedImage = (image: Image) => ({
  ...image,
  data: Buffer.from(image.data).toString('base64'),
});

const getPreparedImages = () =>
  getImages().map((image) => getPreparedImage(image));

ipcMain.handle('list:images', () => getPreparedImages());

ipcMain.handle(
  'list:replace-image',
  async (event: Electron.IpcMainInvokeEvent, index: number, path: string) => {
    const image = await replaceImage(index, path);
    if (!image) return;
    mainWindow.webContents.send('list:image', index, getPreparedImage(image));
    return getPreparedImage(image);
  },
);
