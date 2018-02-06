import { BrowserWindow } from 'electron';
import path from 'path';
import Positioner from 'electron-positioner';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import Logger from './logger';
import Env from './env';

export default class Window {
  constructor(view, options = {}) {
    this.view = view;
    this.options = options;
    this.window = null;
  }

  position() {
    return new Positioner(this.window);
  }

  isCreated() {
    return !!this.getWindow();
  }

  getWindow() {
    return this.window;
  }

  ensureCreated(position = null) {
    if (this.isCreated()) {
      if (position) {
        this.position().move(position);
      }

      return this;
    }

    return this.create(position);
  }

  async create(position = null) {
    Logger.debug('Create a window');

    // Create the browser window.
    this.window = new BrowserWindow(this.options);

    // and load the index.html of the app.
    this.window.loadURL(this.viewPath());

    if (Env.isDebug()) {
      Logger.debug('Open development tools');

      // Add vue debug tools.
      await installExtension(VUEJS_DEVTOOLS);
      // Open the DevTools.
      this.window.webContents.openDevTools({ mode: 'detach' });
    }

    // Emitted when the window is closed.
    this.window.on('closed', () => {
      Logger.debug('Window closed');

      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      this.window = null;
    });

    if (position) {
      this.position().move(position);
    }

    return this;
  }

  viewPath() {
    let basename = path.basename(this.view, '.html');
    basename += '.html';

    return path.join('file://', __dirname, 'view', basename);
  }

  static fromRegistry(registry, name) {
    const { view, options } = registry.repository('view').read(name);

    return new this(view, options);
  }
}
