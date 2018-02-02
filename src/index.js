import { app } from 'electron';
import { enableLiveReload } from 'electron-compile';
import EventEmitter from 'events';
import Window from './window';
import Registry from './registry';
import DB from './db';
import Env from './env';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// This is the global registry
const registry = Registry.create();
global.$registry = registry;

if (Env.isDebug()) {
  enableLiveReload();
  registry.config().clear();
  registry._loadConfig();
}

registry
  .register('events', new EventEmitter())
  .register('app', app)
  .register('db', DB.fromRegistry(registry).connect());

registry.register('openReport', async (projectId) => {
  registry.config().set('lastReportProjectId', projectId);

  const reportWindow = Window.fromRegistry(registry, 'report');

  await reportWindow.ensureCreated();
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const mainWindow = Window.fromRegistry(registry, 'main');

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  await mainWindow.ensureCreated(registry.config().get('position'));
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  await mainWindow.ensureCreated();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
