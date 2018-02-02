<template>
  
  <div>
    <br/>
    <div class="md-layout">
      <div class="md-layout-item">
        <span class="md-title">{{ legend }}</span>
      </div>
    </div>
    
    <br/>
    <div class="md-layout">
      <div v-if="hasDataToShow()" class="md-layout-item chart-container"></div>
      <md-empty-state v-else
        md-icon="multiline_chart"
        md-label="There's nothing to show"
        md-description="Start tracking your time to see some graphics here.">
      </md-empty-state>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import { timelines } from 'd3-timelines';
import Report from './report';

export default {
  name: 'timelineChart',
  props: ['timeSegments', 'filter'],
  mounted () {
    this.$registry.get('events').on(Report.TRIGGER_UPDATE, () => {
      this.render(this.$el);
    });

    this.render(this.$el);
  },
  destroyed () {
    this.$registry.get('events').removeListener(Report.TRIGGER_UPDATE);
  },
  computed: {
    $registry () {
      return this.$electron.remote.getGlobal('$registry');
    },
    data () {
      return this.timeSegments.map(segment => {
        return {
          times: [
            {
              starting_time: segment.start * 1000,
              ending_time: segment.end * 1000,
            },
          ],
        };
      });
    },
    legend () {
      let legend = '';

      switch (this.filter) {
        case Report.FILTERS.TODAY:
          legend = 'Hours Timeline (00..24)';
          break;
        case Report.FILTERS.THIS_WEEK:
          legend = 'Weekdays Names (abbr.)';
          break;
        case Report.FILTERS.THIS_MONTH:
          legend = 'Days of Month (01..31)';
          break;
        case Report.FILTERS.THIS_YEAR:
          legend = 'Months Names (abbr.)';
          break;
      }

      return legend;
    },
    tickFormat () {
      let tickFormat = null;

      switch (this.filter) {
        case Report.FILTERS.TODAY:
          tickFormat = {
            format: d3.timeFormat("%H"),
            tickTime: d3.timeHours,
            tickInterval: 1,
            tickSize: 6,
          };
          break;
        case Report.FILTERS.THIS_WEEK:
          tickFormat = {
            format: d3.timeFormat("%a"),
            tickTime: d3.timeDays,
            tickInterval: 1,
            tickSize: 6,
          };
          break;
        case Report.FILTERS.THIS_MONTH:
          tickFormat = {
            format: d3.timeFormat("%d"),
            tickTime: d3.timeDays,
            tickInterval: 1,
            tickSize: 6,
          };
          break;
        case Report.FILTERS.THIS_YEAR:
          tickFormat = {
            format: d3.timeFormat("%b"),
            tickTime: d3.timeMonths,
            tickInterval: 1,
            tickSize: 6,
          };
          break;
      }

      return tickFormat;
    },
  },
  methods: {
    hasDataToShow() {
      if (this.timeSegments.length <= 0) {
        return false;
      } else if (this.timeSegments.length === 1
        && (this.timeSegments.end - this.timeSegments.start) < 1) {
        return false;
      }

      return true;
    },
    render (el) {
      if (!this.hasDataToShow()) {
        return;
      }

      const container = el.querySelector('.chart-container');
      
      const chart = timelines()
        .tickFormat(this.tickFormat)
        .showBorderLine()
        .showToday()
        .margin({ left: 0, right: 0, top: 0, bottom: 0 });

      container.innerHTML = '';
      
      d3.select(container)
        .append('svg')
        .style('width', '100%')
        .datum(this.data)
        .call(chart);
    },
  },
};
</script>
