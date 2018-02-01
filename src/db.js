import db from 'diskdb';

export default class DB {
  constructor(path, collections = [], defaultCollection = null) {
    this.path = path;
    this.collections = collections;
    this.db = null;
    this.currentCollection = defaultCollection;
  }

  get(name = null) {
    return this.db[name || this.currentCollection()];
  }

  setCurrentCollection(name) {
    this.currentCollection = name;

    return this;
  }

  currentCollection() {
    return this.currentCollection;
  }

  isConnected() {
    return !!this.db;
  }

  connect() {
    this.db = db.connect(this.path, this.collections);

    return this;
  }

  static fromRegistry(registry) {
    const repository = registry.repository('db');

    return new this(
      repository.read('path'),
      repository.read('collections'),
      repository.read('defaultCollection'),
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
