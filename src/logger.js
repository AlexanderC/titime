import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export default class Logger {
  static setup(options) {
    const consoleHandler = new (winston.transports.Console)({ colorize: true });
    const fileHandler = new DailyRotateFile(options);

    this.logger = new winston.Logger({
      level: options.level || this.DEFAULT_LEVEL,
      transports: [consoleHandler, fileHandler],
    });

    this.logger.handleExceptions([consoleHandler, fileHandler]);

    return this;
  }

  static level(newLevel = null) {
    this.assertLoggerReady();

    if (newLevel) {
      this.logger.level = newLevel;
    }

    return this.logger.level;
  }

  static log(msg, metadata = {}) {
    this.assertLoggerReady();

    return this.logger.log(msg, metadata);
  }

  static info(msg, metadata = {}) {
    this.assertLoggerReady();

    return this.logger.info(msg, metadata);
  }

  static warn(msg, metadata = {}) {
    this.assertLoggerReady();

    return this.logger.warn(msg, metadata);
  }

  static error(msg, metadata = {}) {
    this.assertLoggerReady();

    return this.logger.error(msg, metadata);
  }

  static debug(msg, metadata = {}) {
    this.assertLoggerReady();

    return this.logger.debug(msg, metadata);
  }

  static assertLoggerReady() {
    if (!this.logger) {
      throw new Error('You must call setup() first');
    }
  }

  static DEFAULT_LEVEL() {
    return 'info';
  }
}
