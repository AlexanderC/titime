import Repository from './config/repository';
import Config from 'electron-config';

export default class Registry {
  constructor(...repositories) {
    this.repositories = repositories;
    this.registry = {};
    this._config = null;

    this._loadConfig();
  }

  config() {
    return this._config;
  }

  _loadConfig() {
    const repo = this.repository('app');
    const cfg = new Config();

    repo.keys().forEach((key) => {
      const value = cfg.get(key, repo.read(key));

      cfg.set(key, value);
    });

    this._config = cfg;
  }

  register(name, value) {
    this.registry[name] = value;

    return this;
  }

  get(name, defaultValue = null) {
    return this.has(name) ? this.registry[name] : defaultValue;
  }

  has(name) {
    return this.registry[name] !== undefined;
  }

  repository(name) {
    return this.repositories.filter(r => r.name === name)[0] || null;
  }

  static create(repositoriesNames = Registry.ALL_REPOSITORIES) {
    const repositories = repositoriesNames.map(name => new Repository(name));

    return new this(...repositories);
  }

  static get ALL_REPOSITORIES() {
    return ['view', 'db', 'app'];
  }
}
