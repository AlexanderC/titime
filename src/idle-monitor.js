import { powerMonitor } from 'electron';
import desktopIdle from 'desktop-idle';
import { clearInterval, setTimeout } from 'timers';
import moment from 'moment';

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
      this.emitter.emit('idle', time || this.idleTime);
    }

    return this;
  }

  start() {
    this.ticker = setInterval(() => {
      const idle = desktopIdle.getIdleTime();

      if (this.idleTime > idle && this.idleTime > this.maxIdleBeforeEmit) {
        this.emitIdle();
      }

      this.idleTime = idle;
    }, 500);

    powerMonitor.on('suspend', () => {
      this.suspendTime = moment().unix();
    });

    powerMonitor.on('resume', () => {
      if (this.suspendTime) {
        this.idleTime = moment().unix() - this.suspendTime;
        this.suspendTime = null;
      }
    });

    return this;
  }

  stop() {
    if (this.ticker) {
      clearInterval(this.ticker);
    }

    this.ticker = null;
    this.suspendTime = null;
    this.idleTime = 0;

    return this;
  }
}
