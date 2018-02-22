import Logger from './logger';

export default class Cron {
  constructor() {
    this.jobs = {};
  }

  list() {
    return Object.keys(this.jobs);
  }

  exists(name) {
    return !!this.jobs[name];
  }

  get(name) {
    return this.jobs[name] || null;
  }

  async add(name, interval, job, start = false) {
    if (this.exists(name)) {
      throw new Error(`Cron job "${name}" already exists`);
    }

    Logger.debug(`Add cron job "${name}" with pattern "${interval}"`);

    const instance = {
      clock: null,
      running() {
        return !!this.clock;
      },
      async start() {
        if (this.running()) {
          return;
        }

        this.clock = setInterval(async () => {
          Logger.info(`Run "${name}" cron job`);
          await job();
        }, interval);

        await job();
      },
      stop() {
        if (!this.running()) {
          return;
        }

        clearInterval(this.clock);
        this.clock = null;
      },
    };

    if (start) {
      await instance.start();
    }

    this.jobs[name] = instance;

    return instance;
  }

  start() {
    Logger.debug(`Start cron jobs (${this.list().length})`);

    this.list().forEach((name) => {
      const job = this.get(name);

      if (!job.running()) {
        job.start();
      }
    });

    return this;
  }

  stop() {
    Logger.debug(`Stop cron jobs (${this.list().length})`);

    this.list().forEach((name) => {
      const job = this.get(name);

      if (job.running()) {
        job.stop();
      }
    });

    return this;
  }

  cleanup() {
    this.stop();

    this.jobs = [];

    return this;
  }
}
