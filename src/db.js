import db from 'diskdb';
import fs from 'fs-extra';
import path from 'path';

export default class DB {
  constructor(dbPath, collections = [], defaultCollection = null, backupOnStart = false) {
    this.path = dbPath;
    this.collections = collections;
    this.db = null;
    this.currentCollection = defaultCollection;
    this.backupOnStart = backupOnStart;
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
    await fs.ensureDir(this.path);

    if (this.backupOnStart) {
      this.collections.forEach(async (collection) => {
        const dbFile = path.join(this.path, `${collection}.json`);

        const dbExists = await fs.pathExists(dbFile);

        if (dbExists) {
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
