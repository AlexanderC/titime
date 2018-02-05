export default class AbstractProvider {
  constructor(db, options) {
    this.db = db;
    this.options = options;
  }

  async synchronize() { // eslint-disable-line class-methods-use-this
    throw Error('Not Implemented');
  }

  async report() { // eslint-disable-line class-methods-use-this
    throw Error('Not Implemented');
  }
}
