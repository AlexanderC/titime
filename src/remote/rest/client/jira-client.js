import RestClient from './rest-client';

/**
 * @callback ApiMethod
 *   @param {Object=} payload
 *   @returns {Promise<{status: Number, headers: Object, data: Object}>}
 */

/**
 * @typedef {RestClient} JiraRestClient
 *
 * @property {ApiMethod} getIssue
 * @property {ApiMethod} search
 *
 * @type {JiraRestClient}
 */
const JiraClient = new RestClient({
  getIssue: {
    method: 'GET',
    path: 'rest/api/2/issue/{issueId}',
  },
  search: {
    method: 'GET',
    path: '/rest/api/2/search',
  },
});

export default JiraClient;
