<template>
  <md-app>
    <md-app-toolbar class="md-primary md-layout control-offset">
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
    </md-app-toolbar>

    <md-app-content>
      <Projects :tracking="tracking"></Projects>
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
    Projects
  },
  data () {
    return {
      tracking: false,
      startTime: moment(),
      timer: 'N/A',
      project: false,
    };
  },
  created () {
    this.$ticker = setInterval(() => {
      if (this.tracking) {
        this.timer = this._countdown();
        this.$registry.get('setBadge')(this.timer);
      }
    }, 200);

    const EVENTS = this.$registry.get('EVENTS');
    const events = this.$registry.get('events');

    events.on(Projects.PROJECT_SELECTED, (project) => {
      this.project = project;
    });

    events.on(EVENTS.SLEEP, () => {
      if (this.tracking) {
        this.logTimeSegment();
        this.tracking = false;
      }
    });

    events.on(EVENTS.WAKEUP, () => {
      this.$registry.get('notify')(
        'TiTime - Stoped Tracking Time.',
        'Please click "Start" in order to track your activity.'
      );
    });

    events.on(EVENTS.IDLE, (time) => {
      if (this.tracking) {
        time = Math.ceil(time); // round up!

        const newStartTime = moment();
        const endTime = moment.unix(moment().unix() - time);
        const idleTime = this._humanize(time);

        this.$registry.get('notify')(
          'TiTime - You\'re idle!',
          `Do you want us to keep the time you were idle? (${idleTime})`,
          [ 'Keep', 'Discard' ],
          (response) => {
            if (response === 1) {
              this.logTimeSegment(endTime);
              this.startTime = newStartTime;

              this.$registry.get('notify')(
                'TiTime - Idle Time Discarded.',
                `Idle time of ${idleTime} has been discarded.`
              );
            }
          }
        );
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

    const EVENTS = this.$registry.get('EVENTS');
    const events = this.$registry.get('events');

    events.removeListener(Projects.PROJECT_SELECTED);
    events.removeListener(EVENTS.SLEEP);
    events.removeListener(EVENTS.WAKEUP);
    events.removeListener(EVENTS.IDLE);
  },
  computed: {
    $registry () {
      return this.$electron.remote.getGlobal('$registry');
    },
  },
  methods: {
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

      const timeSegments = project.timeSegments || [];
      
      timeSegments.push({
        start: this.startTime.unix(),
        end: ((endTime && moment(endTime)) || moment()).unix(),
      });

      db.update({ _id }, { timeSegments });
    },
  },
  watch: {
    tracking (val) {
      // If timer restarted
      if (val) {
        this.startTime = moment();
      } else {
        this.logTimeSegment();
      }
    },
  }
};
</script>
