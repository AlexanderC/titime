<template>
  <md-app md-waterfall md-mode="fixed">
    <md-app-toolbar class="md-primary">
      <span class="md-title"><b>{{ project.name }}</b> {{  }}</span>
    </md-app-toolbar>

    <md-app-drawer md-permanent="full" class="side-menu">
      <md-toolbar class="md-transparent" md-elevation="0">
        Choose Report
      </md-toolbar>

      <md-list>
        <md-list-item @click="filter = FILTERS.TODAY">
          <md-avatar :class="['md-avatar-icon', 'md-small', { 'md-accent': filter === FILTERS.TODAY }]">T</md-avatar>
          <span class="md-list-item-text">Today</span>
        </md-list-item>
        <md-list-item @click="filter = FILTERS.THIS_WEEK">
          <md-avatar :class="['md-avatar-icon', 'md-small', { 'md-accent': filter === FILTERS.THIS_WEEK }]">W</md-avatar>
          <span class="md-list-item-text">This Week</span>
        </md-list-item>
        <md-list-item @click="filter = FILTERS.THIS_MONTH">
          <md-avatar :class="['md-avatar-icon', 'md-small', { 'md-accent': filter === FILTERS.THIS_MONTH }]">M</md-avatar>
          <span class="md-list-item-text">This Month</span>
        </md-list-item>
        <md-list-item @click="filter = FILTERS.THIS_YEAR">
          <md-avatar :class="['md-avatar-icon', 'md-small', { 'md-accent': filter === FILTERS.THIS_YEAR }]">Y</md-avatar>
          <span class="md-list-item-text">This Year</span>
        </md-list-item>
      </md-list>
    </md-app-drawer>

    <md-app-content>
      <div class="md-layout">
        <div class="md-layout-item">Total Time Spent: {{ total }}</div>
      </div>
      
      <md-divider></md-divider>

      <TimelineChart class="md-layout-item" :timeSegments="timeSegments" :filter="filter"></TimelineChart>
    </md-app-content>
  </md-app>
</template>

<script>
import moment from 'moment';
import humanizeDuration from 'humanize-duration';
import TimelineChart from './timeline.chart';

const TRIGGER_UPDATE = 'trigger-update';
const FILTERS = { TODAY: 'today', THIS_WEEK: 'this_week', THIS_MONTH: 'this_month', THIS_YEAR: 'this_year' };

export default {
  FILTERS,
  TRIGGER_UPDATE,
  name: 'report',
  components: {
    TimelineChart
  },
  data () {
    return {
      filter: 'today',
      FILTERS,
    };
  },
  watch: {
    filter () {
      this.$registry.get('events').emit(TRIGGER_UPDATE);
    },
  },
  computed: {
    $registry () {
      return this.$electron.remote.getGlobal('$registry');
    },
    project () {
      const { _id } = this;

      return this.$registry.get('db').findOne({ _id });
    },
    total () {
      const seconds = this.timeSegments.reduce((acc, segment) => {
        return acc + (segment.end - segment.start);
      }, 0);

      return this._humanize(seconds);
    },
    timeSegments () {
      return (this.project.timeSegments || [])
        .filter(segment => {
          const start = moment.unix(segment.start);
          const end = moment.unix(segment.end);

          return start.isBetween(...this._betweenTimePair)
            && end.isBetween(...this._betweenTimePair);
        })
        .sort((a, b) => a.start - b.start);
    },
    _betweenTimePair () {
      let pair = [];

      switch (this.filter) {
        case this.FILTERS.TODAY:
          pair = [moment().startOf('day'), moment().endOf('day')];
          break;
        case this.FILTERS.THIS_WEEK:
          pair = [moment().startOf('week'), moment().endOf('week')];
          break;
        case this.FILTERS.THIS_MONTH:
          pair = [moment().startOf('month'), moment().endOf('month')];
          break;
        case this.FILTERS.THIS_YEAR:
          pair = [moment().startOf('year'), moment().endOf('year')];
          break;
      }

      return pair;
    },
    _id () {
      return this.$registry.config().get('lastReportProjectId');
    },
  },
  methods: {
    _humanize (time) {
      return humanizeDuration(time * 1000, { units: ['h', 'm', 's'] });
    },
  },
};
</script>
