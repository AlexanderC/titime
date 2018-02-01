export default class Env {
  static homeDir() {
    return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
  }

  static isDebug() {
    return this.hasVar('debug');
  }

  static readVar(name, defaultValue = null) {
    return this.hasVar(name) ? process.env[this.envKey(name)] : defaultValue;
  }

  static hasVar(name) {
    return process.env[this.envKey(name)] !== undefined;
  }

  static envKey(name) {
    return `TITIME_${name.toUpperCase()}`;
  }
}
