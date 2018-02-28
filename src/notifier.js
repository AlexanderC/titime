import { dialog, Notification } from 'electron';
import Logger from './logger';

export default class Notifier {

  // @ref https://electronjs.org/docs/api/dialog#dialogshowmessageboxbrowserwindow-options-callback
  static notify(title, message) {
    Logger.debug(`Show ${Notification.isSupported() ? 'native ' : ''}notification: ${title}`);

    let control = { close() {} };

    if (Notification.isSupported()) {
      const notification = new Notification({ title, body: message }).show();

      control = {
        close() {
          try {
            notification.close();
          } catch (error) {
            // do nothing...
          }
        },
      };
    } else {
      dialog.showMessageBox({ title, message });
    }

    return control;
  }
}
