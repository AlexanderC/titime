'use strict';

import axios from 'axios';
import invariant from '../../../invariant';
import AnonProvider from '../auth/anon-provider';

export default class RestClient {
  constructor(methodsMap = {}, options = {}) {
    this.options = options;
    this.options.authProvider = Object.assign(RestClient.defaults, options);

    this.createApiMethods(methodsMap);
  }

  // @TODO: add options schema
  updateOptions(newOptions) {
    this.options = Object.assign(this.options, newOptions);
  }

  createApiMethods(methodsMap) {
    Object.keys(methodsMap).forEach((methodName) => {
      const methodDefinition = methodsMap[methodName];

      this[methodName] = this.createApiMethod(methodDefinition);
    });
  }

  createApiMethod(methodDefinition) {
    return (payload = {}, overrideOptions = {}) => {
      const options = this.options;
      const requestConfig = Object.assign({
        baseURL: options.baseURL,
        method: methodDefinition.method,
        adapter: methodDefinition.adapter,
        responseType: 'json',
        url: this.buildUrl(methodDefinition.path, payload),
        [this.getParametersSendType(methodDefinition)]: payload,
      }, overrideOptions);

      invariant(options.baseURL, 'You should configure API baseURL before making any api calls');
      invariant(options.authProvider, 'Missing authentication provider');

      const signedRequestConfig = this.options.authProvider.sign(requestConfig);

      return axios.request(signedRequestConfig);
    };
  }

  buildUrl(urlTemplate, params = {}) { // eslint-disable-line
    return urlTemplate.replace(/{\s*([^/]+)\s*}/g, (match, paramName) => {
      invariant(
        paramName in params,
        'Missing "%s" parameter. Cannot build "%s" url template',
        paramName,
        urlTemplate,
      );

      const paramValue = params[paramName];
      delete params[paramName]; // eslint-disable-line no-param-reassign

      return paramValue.toString();
    });
  }

  getParametersSendType(endpointDefinition) { // eslint-disable-line
    return ['GET', 'HEAD'].includes(endpointDefinition.method.toUpperCase()) ? 'params' : 'data';
  }

  static get defaults() {
    return {
      authProvider: new AnonProvider(),
    };
  }
}
