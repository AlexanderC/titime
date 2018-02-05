import { app, Menu, powerMonitor, dialog, Notification } from 'electron';
import { enableLiveReload } from 'electron-compile';
import EventEmitter from 'events';
import { clearInterval } from 'timers';
import desktopIdle from 'desktop-idle';
import Window from './window';
import Registry from './registry';
import DB from './db';
import Env from './env';
import RedmineProvider from './remote/redmine';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// This is the global registry
const registry = Registry.create();
global.$registry = registry;

if (Env.isDebug()) {
  enableLiveReload();
  // registry.config().clear();
  // registry._loadConfig();
}

const EVENTS = {
  SLEEP: 'sleep',
  WAKEUP: 'wakeup',
  IDLE: 'idle',
};

const db = DB.fromRegistry(registry);

// Small hook to call await
(async () => {
  await db.connect();
})();

registry
  .register('EVENTS', EVENTS)
  .register('events', new EventEmitter())
  .register('app', app)
  .register('db', db);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const mainWindow = Window.fromRegistry(registry, 'main');

registry.register('setBadge', async (text) => {
  if (app.dock && typeof app.dock.setBadge === 'function') {
    app.dock.setBadge(text);
  }
});

registry.register('synchronizeRedmine', async (host, apiKey) => {
  const redmine = new RedmineProvider(db, { host, apiKey });

  await redmine.synchronize();
});

// @ref https://electronjs.org/docs/api/dialog#dialogshowmessageboxbrowserwindow-options-callback
registry.register('notify', async (title, message, buttons = [], cb = null) => {
  if ((!buttons || buttons.length <= 0) && Notification.isSupported()) {
    new Notification({ title, body: message }).show();
    return;
  }

  dialog.showMessageBox({
    title,
    message,
    buttons,
  }, cb || (() => {}));
});

registry.register('openReport', async (projectId) => {
  registry.config().set('lastReportProjectId', projectId);

  const reportWindow = Window.fromRegistry(registry, 'report');

  await reportWindow.ensureCreated();
});

let idleTimer = 0;
const idleTicker = setInterval(() => {
  const maxIdleBeforeAsk = registry.config().get('maxIdleBeforeAsk');
  const idle = desktopIdle.getIdleTime();

  // Case the user woke up after being idle longer than maxIdleBeforeAsk
  if (idleTimer > idle && idleTimer > maxIdleBeforeAsk) {
    registry.get('events').emit(EVENTS.IDLE, idleTimer);
  }

  idleTimer = idle;
}, 500);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  await mainWindow.ensureCreated(registry.config().get('position'));

  Menu.setApplicationMenu(Menu.buildFromTemplate(
    registry.config().get('appMenu'),
  ));

  powerMonitor.on('suspend', () => {
    registry.get('events').emit(EVENTS.SLEEP);
  });

  powerMonitor.on('resume', () => {
    registry.get('events').emit(EVENTS.WAKEUP);
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }

  clearInterval(idleTicker);
});

app.on('activate', async () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  await mainWindow.ensureCreated();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
