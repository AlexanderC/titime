import db from 'diskdb';
import fs from 'fs-extra';
import path from 'path';
import Logger from './logger';

export default class DB {
  constructor(dbPath, collections = [], defaultCollection = null, backupOnStart = false) {
    this.path = dbPath;
    this.collections = collections;
    this.db = null;
    this.currentCollection = defaultCollection;
    this.backupOnStart = backupOnStart;
  }

  async archiveByYear(collection, resetKey) {
    const year = new Date().getFullYear();
    const systemDb = this.get('system');
    const settings = systemDb.findOne({ module: this.constructor.name }) || {
      module: this.constructor.name,
      lastArchiveYear: year,
    };

    if (!settings._id) { // eslint-disable-line no-underscore-dangle
      systemDb.save(settings);
    } else if (year > settings.lastArchiveYear) {
      const dbFile = path.join(this.path, `${collection}.json`);
      const dbExists = await fs.pathExists(dbFile);

      Logger.debug(`Lookup for database collection: ${collection}`);

      if (dbExists) {
        Logger.debug(`Archive database collection: ${collection}`);

        const dbArchiveFile = path.join(
          this.path,
          `${collection}.${year - 1}.archive.json`,
        );

        await fs.copy(dbFile, dbArchiveFile);

        const collectionDb = this.get(collection);
        const toUpdate = {};
        toUpdate[resetKey] = null;

        const items = collectionDb.find();

        for (const item of items) { // eslint-disable-line
          const { _id } = item;

          collectionDb.update({ _id }, toUpdate);
        }
      }

      settings.lastArchiveYear = year;
      systemDb.update({ _id: settings._id }, settings); // eslint-disable-line
    }
  }

  get(name = null) {
    return this.db[name || this.getCurrentCollection()];
  }

  setCurrentCollection(name) {
    this.currentCollection = name;

    return this;
  }

  getCurrentCollection() {
    return this.currentCollection;
  }

  isConnected() {
    return !!this.db;
  }

  async connect() {
    Logger.debug(`Connect to database: ${this.path}`);

    await fs.ensureDir(this.path);

    if (this.backupOnStart) {
      this.collections.forEach(async (collection) => {
        const dbFile = path.join(this.path, `${collection}.json`);

        const dbExists = await fs.pathExists(dbFile);

        if (dbExists) {
          Logger.debug(`Backup database collection: ${collection}`);

          const dbBackupFile = path.join(
            this.path,
            `${collection}.bck.json`,
          );

          await fs.copy(dbFile, dbBackupFile);
        }
      });
    }

    this.db = db.connect(this.path, this.collections);

    return this;
  }

  static fromRegistry(registry) {
    const repository = registry.repository('db');

    return new this(
      repository.read('path'),
      repository.read('collections'),
      repository.read('defaultCollection'),
      repository.read('backupOnStart'),
    );
  }

  /** Proxy methods */

  save(...args) {
    return this.get().save(...args);
  }

  find(...args) {
    return this.get().find(...args);
  }

  findOne(...args) {
    return this.get().findOne(...args);
  }

  update(...args) {
    return this.get().update(...args);
  }

  remove(...args) {
    return this.get().remove(...args);
  }

  count(...args) {
    return this.get().count(...args);
  }
}
