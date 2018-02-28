<template>
  <md-app md-waterfall md-mode="fixed">
    <md-app-toolbar class="md-primary md-dense">
      <div class="md-toolbar-row">
        <div class="md-layout-item heading-item">
          <md-button @click="tracking = true" :disabled="tracking || !project" :class="[ 'md-raised', { 'md-accent': !tracking } ]">
            <md-icon>alarm_add</md-icon>
            Start
          </md-button>
        </div>
        <div class="md-layout-item heading-item">
          {{ timer }}
        </div>
        <div class="md-layout-item heading-item">
          <md-button @click="tracking = false" :disabled="!tracking || !project" :class="[ 'md-raised', { 'md-accent': tracking } ]">
            <md-icon>alarm_off</md-icon>
            Stop
          </md-button>
        </div>
      </div>
    </md-app-toolbar>

    <md-app-content>
      <Projects :tracking="tracking"></Projects>

      <md-dialog-confirm
        v-if="isIdle()"
        md-active
        md-title="You're idle."
        :md-content="'Do you want us to keep idle time of <b>' + humanizedIdleTime() + '</b>?'"
        md-confirm-text="Keep"
        md-cancel-text="Discard"
        @md-cancel="discardIdle"
        @md-confirm="keepIdle" />
    </md-app-content>
  </md-app>
</template>

<script>
import moment from 'moment';
import humanizeDuration from 'humanize-duration';
import Projects from './projects';

// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
if (!String.prototype.padStart) {
  String.prototype.padStart = function padStart(targetLength, padString) {

    //truncate if number or convert non-number to 0;
    targetLength = targetLength >> 0;
    padString = String((typeof padString !== 'undefined' ? padString : ' '));

    if (this.length > targetLength) {
      return String(this);
    } else {
      targetLength = targetLength-this.length;

      if (targetLength > padString.length) {

        //append to original to ensure we are longer than needed
        padString += padString.repeat(targetLength / padString.length);
      }

      return padString.slice(0,targetLength) + String(this);
    }
  };
}

export default {
  name: 'app',
  components: {
    Projects,
  },
  data () {
    return {
      tracking: false,
      startTime: moment(),
      timer: 'N/A',
      project: false,
      state: {
        idleTime: 0,
        idleStart: null,
      },
    };
  },
  created () {
    this.$ticker = setInterval(() => {
      if (this.tracking) {        
        this.timer = this._countdown();
        this.$registry.get('setBadge')(this.timer);
      }
    }, 200);

    const events = this.$registry.get('events');

    events.on(Projects.PROJECT_SELECTED, (project) => {
      if (project) {
        this.$registry.get('logger').debug(`Project "${project.name}" selected`);
      }

      this.project = project;
    });

    events.on('idle', (time) => {
      if (this.tracking) {
        time = Math.ceil(time); // round up!

        if (this.isIdle()) {
          this.increaseIdle(time);
        } else {
          this.startIdle(time);
        }
      }
    });
  },
  destroyed () {
    if (this.tracking) {
      this.logTimeSegment();
    }

    if (this.$ticker) {
      clearInterval(this.$ticker);
      this.$ticker = undefined;
    }
    
    const events = this.$registry.get('events');

    events.removeListener(Projects.PROJECT_SELECTED);
    events.removeListener('idle');
  },
  computed: {
    $registry () {
      return this.$electron.remote.getGlobal('$registry');
    },
  },
  methods: {
    discardIdle() {
      this.$registry.get('notify')(
        'TiTime.',
        `Idle time of ${this.humanizedIdleTime()} has been discarded.`
      );

      // log segment and reset timer
      this.logTimeSegment(this.state.idleStart);
      this.startTime = moment();

      this.resetIdle();
    },
    keepIdle() {
      this.$registry.get('notify')(
        'TiTime',
        `Keep idle time of ${this.humanizedIdleTime()}`
      );

      this.resetIdle();
    },
    increaseIdle(time) {
      this.state.idleTime += time;
    },
    isIdle() {
      return !!this.state.idleStart;
    },
    startIdle(time) {
      this.$registry.get('notify')('TiTime', 'You\'re now idle');

      this.state.idleTime += time;
      this.state.idleStart = moment.unix(moment().unix() - time);
    },
    resetIdle() {
      this.state.idleStart = null;
      this.state.idleTime = 0;
    },
    humanizedIdleTime() {
      return this._humanize(this.state.idleTime);
    },
    _countdown () {
      const duration = moment.duration(moment().diff(this.startTime));
      const hours = Math.floor(duration.asHours()).toString().padStart(2, '0');
      const minutes = duration.minutes().toString().padStart(2, '0');
      const seconds = duration.seconds().toString().padStart(2, '0');

      return `${hours}:${minutes}:${seconds}`;
    },
    _humanize (time) {
      return humanizeDuration(time * 1000, { units: ['h', 'm', 's'] });
    },
    logTimeSegment (endTime = null) {
      const { _id } = this.project;
      const db = this.$registry.get('db');

      const project = db.findOne({ _id });

      if (!project) {
        this.project = false;
        return;
      }

      const start = this.startTime.unix();
      const end = ((endTime && moment(endTime)) || moment()).unix();

      if (end <= start) {
        const diff = end - start;

        this.$registry.get('logger')
          .warn(`Attempt to log zero or negative time segment of ${ diff } seconds for "${this.project.name}"`);
        return;
      }

      const timeSegment = { start, end };
      const timeSegments = project.timeSegments || [];
      
      timeSegments.push(timeSegment);

      this.$registry.get('logger')
        .info(`Log ${timeSegment.end - timeSegment.start} seconds spent on "${this.project.name}"`);

      db.update({ _id }, { timeSegments });
    },
  },
  watch: {
    tracking (val) {
      // If timer restarted
      if (val) {
        this.$registry.get('logger').info(`Start logging time for "${this.project.name}"`);

        this.startTime = moment();
      } else {
        this.$registry.get('logger').info(`Stop logging time for "${this.project.name}"`);

        this.logTimeSegment();
      }
    },
  }
};
</script>
