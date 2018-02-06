import { app, Menu } from 'electron';
import { enableLiveReload } from 'electron-compile';
import EventEmitter from 'events';
import Window from './window';
import Registry from './registry';
import DB from './db';
import Env from './env';
import RedmineProvider from './remote/redmine';
import IdleMonitor from './idle-monitor';
import Notifier from './notifier';
import Cron from './cron';
import Logger from './logger';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// This is the global registry
const registry = Registry.create();
global.$registry = registry;

const logger = Logger.setup(registry.config().get('logOptions'));
const cron = new Cron();
const events = new EventEmitter();
const db = DB.fromRegistry(registry);
const idleMonitor = new IdleMonitor(
  events,
  registry.config().get('maxIdleBeforeAsk'),
);

if (Env.isDebug()) {
  logger.level('debug');
  logger.info('Debug mode enabled');

  enableLiveReload();

  registry.config().clear();
  registry._loadConfig(); // eslint-disable-line
}

// Small hook to call await
(async () => {
  await db.connect();

  if (registry.config().get('archiveByYear')) {
    await db.archiveByYear(
      db.currentCollection,
      registry.config().get('archiveResetKey'),
    );
  }
})();

registry
  .register('logger', logger)
  .register('events', events)
  .register('app', app)
  .register('db', db)
  .register('setBadge', async (text) => {
    if (app.dock && typeof app.dock.setBadge === 'function') {
      app.dock.setBadge(text);
    }
  })
  .register('synchronizeRedmine', async (host, apiKey) => {
    const redmine = new RedmineProvider(db, { host, apiKey });

    if (!cron.exists('redmine')) {
      cron.add(
        'redmine',
        registry.config().get('remoteSyncCron'),
        () => redmine.synchronize().then(() => redmine.report(registry.config().get('minLogTime'))),
        true,
      );
    }

    await redmine.synchronize();
    await redmine.report(registry.config().get('minLogTime'));
  })
  .register('notify', Notifier.notify)
  .register('openReport', async (projectId) => {
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

  Menu.setApplicationMenu(Menu.buildFromTemplate(
    registry.config().get('appMenu'),
  ));

  cron.start();
  idleMonitor.start();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  cron.stop();
  idleMonitor.stop();
  app.quit();
});
