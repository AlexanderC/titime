export default class BasicAuthProvider {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  sign(requestConfig) {
    const signedRequestConfig = Object.assign({}, requestConfig);

    signedRequestConfig.headers = Object.assign(signedRequestConfig.headers || {}, {
      Authorization: `Basic ${new Buffer(`${this.username}:${this.password}`).toString('base64')}`,
    });

    return signedRequestConfig;
  }
}
