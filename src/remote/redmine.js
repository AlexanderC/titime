import Redmine from 'node-redmine';
import path from 'path';
import pify from 'pify';
import AbstractProvider from './abstract-provider';

export default class RedmineProvider extends AbstractProvider {
  createClient() {
    return new Redmine(
      this.options.host,
      { apiKey: this.options.apiKey },
    );
  }

  generateId(issue) { // eslint-disable-line class-methods-use-this
    return `redmine-${issue.id}`;
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
    const redmine = this.createClient();
    const { issues } = await pify(redmine.issues.bind(redmine))({
      limit: 9999,
      assigned_to_id: 'me',
    });

    const itemsToLookup = issues.map((issue) => {
      return {
        redmineId: this.generateId(issue),
        name: this.generateName(issue),
        link: this.generateLink(issue),
      };
    });

    itemsToLookup.forEach((item) => {
      const { redmineId } = item;

      const existingItem = this.db.findOne({ redmineId });

      if (!existingItem) {
        this.db.save(item);
      }
    });
  }

  // @todo Implement: https://github.com/zanran/node-redmine/blob/master/example/redmine-time-entry.js#L52
  async report() { // eslint-disable-line class-methods-use-this
    throw Error('Not Implemented');
  }
}
