export default class Repository {
  constructor(name) {
    this.name = name;
    this.config = this.readConfig();
  }

  keys() {
    return Object.keys(this.config);
  }

  read(key, defaultValue = null) {
    return this.has(key) ? this.config[key] : defaultValue;
  }

  has(key) {
    return this.config[key] !== undefined;
  }

  readConfig() {
    return module.require(`./${this.name}.cfg.js`).default;
  }
}
