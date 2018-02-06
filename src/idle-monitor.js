import { powerMonitor } from 'electron';
import desktopIdle from 'desktop-idle';
import { clearInterval } from 'timers';
import moment from 'moment';
import Logger from './logger';

export default class IdleMonitor {
  constructor(emitter = null, maxIdleBeforeEmit = 0) {
    this.emitter = emitter;
    this.maxIdleBeforeEmit = maxIdleBeforeEmit;
    this.ticker = null;
    this.suspendTime = null;
    this.idleTime = 0;
  }

  emitIdle(time = null) {
    if (this.emitter) {
      Logger.debug(`Report idle time ${time || this.idleTime}`);

      this.emitter.emit('idle', time || this.idleTime);
    }

    return this;
  }

  start() {
    Logger.debug('Start monitoring idle time');

    this.ticker = setInterval(() => {
      const idle = desktopIdle.getIdleTime();

      if (this.idleTime > idle && this.idleTime > this.maxIdleBeforeEmit) {
        this.emitIdle();
      }

      this.idleTime = idle;
    }, 500);

    powerMonitor.on('suspend', () => {
      Logger.debug('Suspend event received');

      this.suspendTime = moment().unix();
    });

    powerMonitor.on('resume', () => {
      Logger.debug('Resume event received');

      if (this.suspendTime) {
        this.idleTime = moment().unix() - this.suspendTime;

        Logger.debug(`Idle time while suspended: ${this.idleTime} seconds`);

        this.suspendTime = null;
      }
    });

    return this;
  }

  stop() {
    Logger.debug('Stop monitoring idle time');

    if (this.ticker) {
      clearInterval(this.ticker);
    }

    this.ticker = null;
    this.suspendTime = null;
    this.idleTime = 0;

    return this;
  }
}
