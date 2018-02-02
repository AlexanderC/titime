export default class AbstractProvider {
  constructor(db, options) {
    this.db = db;
    this.options = options;
  }

  async synchronize() {
    throw Error('Not Implemented');
  }

  async report() {
    throw Error('Not Implemented');
  }
}
