<template>
  <md-app>
    <md-app-toolbar class="md-primary md-layout">
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
import 'moment-countdown';
import countdown from 'countdown';
import Projects from './projects';

countdown.setLabels(
	' ms| s| m| h| d| w| mo| y| dec| ce| mil',
	' ms| s| m| h| d| w| mo| y| dec| ce| mil',
	' / ',
	', ',
	'',
  (n) => n.toString()
);

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
        this.timer = this.startTime.countdown().toString();
      }
    }, 200);

    this.$registry.get('events').on(Projects.PROJECT_SELECTED, (project) => {
      this.project = project;
    });
  },
  destroyed () {
    if (this.$ticker) {
      clearInterval(this.$ticker);
      this.$ticker = undefined;
    }

    this.$registry.get('events').removeListener(Projects.PROJECT_SELECTED);
  },
  computed: {
    $registry () {
      return this.$electron.remote.getGlobal('$registry');
    },
  },
  methods: {
    logTimeSegment () {
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
        end: moment().unix(),
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
