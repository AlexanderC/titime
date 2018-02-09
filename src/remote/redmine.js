import Redmine from 'node-redmine';
import path from 'path';
import pify from 'pify';
import moment from 'moment';
import AbstractProvider from './abstract-provider';
import Logger from '../logger';

export default class RedmineProvider extends AbstractProvider {
  createClient() {
    Logger.debug(`Connect to Redmine on ${this.options.host}`);

    return new Redmine(
      this.options.host,
      { apiKey: this.options.apiKey },
    );
  }

  generateName(issue) { // eslint-disable-line class-methods-use-this
    let project = issue.project && issue.project.name;
    project = project.length > 15 ? `${project.substr(0, 15)}...` : project;

    return project ? `[${project.trim()}] ${issue.subject}` : issue.subject;
  }

  generateLink(issue) {
    return path.join(this.options.host, `issues/${issue.id}`);
  }

  // @todo add pagination
  async synchronize() {
    Logger.debug('Synchronize with Redmine');

    const redmine = this.createClient();
    const { issues } = await pify(redmine.issues.bind(redmine))({
      limit: 9999,
      assigned_to_id: 'me',
    });

    const itemsToLookup = issues.map((issue) => {
      return {
        projectId: issue.project.id,
        issueId: issue.id,
        name: this.generateName(issue),
        link: this.generateLink(issue),
      };
    });

    itemsToLookup.forEach((item) => {
      const { issueId } = item;

      const existingItem = this.db.findOne({ issueId });

      if (!existingItem) {
        Logger.info(`Add new Redmine issue: ${item.name} #${issueId}`);

        this.db.save(item);
      }
      /* else {
        Logger.info(`Update Redmine issue: ${item.name} #${issueId}`);

        const { projectId, name } = item;
        const { _id } = existingItem;

        this.db.update({ _id }, { projectId, name });
      } */
    });
  }

  // @todo Implement: https://github.com/zanran/node-redmine/blob/master/example/redmine-time-entry.js#L52
  async report(minLogTime = 0) {
    const db = this.db.get('system');
    const settings = db.findOne({ module: this.constructor.name }) || {
      module: this.constructor.name,
      lastReportTime: null,
    };

    settings.lastReportTime = settings.lastReportTime || null;

    if (this.shouldReport(settings.lastReportTime)) {
      Logger.debug('Report time to Redmine');

      const timeToLog = [];
      const projects = this.db.find()
        .filter(project => (project.timeSegments || []).length > 0);

      for (const project of projects) { // eslint-disable-line
        let timeSegments = project.timeSegments
          .filter((segment) => { // eslint-disable-line
            return this.timeSegmentValid(
              settings.lastReportTime,
              segment,
            );
          });

        timeSegments = this.normalizeSegments(timeSegments);

        const totals = this.totals(timeSegments);

        for (const date in totals) { // eslint-disable-line
          const hours = Number((totals[date] / 60 / 60).toFixed(2));

          if (hours > minLogTime) {
            const payload = {
              time_entry: {
                issue_id: project.issueId,
                hours: hours.toString(),
                spent_on: moment(date).format('YYYY-MM-DD'),
              },
            };

            timeToLog.push(payload);
          }
        }
      }

      if (timeToLog.length > 0) {
        const redmine = this.createClient();

        await Promise.all(timeToLog.map((payload) => { // eslint-disable-line
          const { hours, issue_id, spent_on } = payload.time_entry;

          Logger.info(
            `Log ${hours} hours spent on issue ` +
            `#${issue_id} on ${spent_on} to Redmine`, // eslint-disable-line
          );

          return pify(redmine.create_time_entry.bind(redmine))(payload);
        }));

        settings.lastReportTime = moment().unix();

        if (!settings._id) { // eslint-disable-line no-underscore-dangle
          db.save(settings);
        } else {
          const { _id } = settings;

          db.update({ _id }, settings);
        }
      }
    }
  }

  totals(timeSegments) { // eslint-disable-line class-methods-use-this
    const result = {};

    timeSegments.forEach((segment) => {
      const key = moment.unix(segment.start).startOf('day').toISOString();
      result[key] = result[key] || 0;
      result[key] += segment.end - segment.start;
    });

    return result;
  }

  normalizeSegments(timeSegments) { // eslint-disable-line class-methods-use-this
    const segments = [];

    timeSegments.forEach((segment) => {
      const start = moment.unix(segment.start);
      const end = moment.unix(segment.end);

      if (start.isSame(end, 'day')) {
        segments.push(Object.assign({}, segment));
      } else {
        segments.push({
          start: start.unix(),
          end: start.clone().endOf('day').unix(),
        });
        segments.push({
          start: end.clone().startOf('day').unix(),
          end: end.unix(),
        });
      }
    });

    return segments;
  }

  timeSegmentValid(lastReportTime, segment) { // eslint-disable-line class-methods-use-this
    if (!lastReportTime) {
      return true;
    } else if (moment.unix(segment.start).isSameOrAfter(moment.unix(lastReportTime))) {
      return true;
    }

    return false;
  }

  shouldReport(lastReportTime) { // eslint-disable-line class-methods-use-this
    if (!lastReportTime) {
      return true;
    } else if (moment().isAfter(moment.unix(lastReportTime), 'day')) {
      return true;
    }

    return false;
  }
}
