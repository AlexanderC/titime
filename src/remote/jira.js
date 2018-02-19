import url from 'url';
import AbstractProvider from './abstract-provider';
import Logger from '../logger';
import JiraClient from './rest/client/jira-client';
import BasicAuthProvider from './rest/auth/basic-auth-provider';

export default class JiraProvider extends AbstractProvider {
  setupClient() {
    Logger.debug(`Connect to Jira on ${this.options.host}`);

    JiraClient.updateOptions({
      authProvider: new BasicAuthProvider(
        this.options.username,
        this.options.password,
      ),
      baseURL: this.options.host,
    });
  }

  generateId(issue) { // eslint-disable-line
    return `JIRA-${issue.id}`;
  }

  generateLink(issue) { // eslint-disable-line
    return url.resolve(this.options.host, `/browse/${issue.key}`);
  }

  generateName(issue) { // eslint-disable-line
    return `[${issue.key}] ${issue.fields.summary}`;
  }

  async synchronize() {
    this.setupClient();

    const response = await JiraClient.search({
      jql: 'assignee=currentuser() AND status!=closed',
    });

    const itemsToLookup = response.data.issues.map(issue => ({
      projectId: issue.key,
      name: this.generateName(issue),
      issueId: this.generateId(issue),
      link: this.generateLink(issue),
    }));

    itemsToLookup.forEach((item) => {
      const { issueId } = item;

      const existingItem = this.db.findOne({ issueId });

      if (!existingItem) {
        Logger.info(`Add new Jira issue: ${item.name} #${issueId}`);

        this.db.save(item);
      }
    });
  }

  async report(minLogTime = 0) { // eslint-disable-line
    Logger.info(`JiraProvider::report(${minLogTime})`);

    return Promise.resolve();
  }
}
