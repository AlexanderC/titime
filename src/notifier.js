import { dialog, Notification } from 'electron';
import Logger from './logger';

export default class Notifier {

  // @ref https://electronjs.org/docs/api/dialog#dialogshowmessageboxbrowserwindow-options-callback
  static notify(title, message, buttons = [], cb = null) {
    if ((!buttons || buttons.length <= 0) && Notification.isSupported()) {
      Logger.debug(`Show native notification: ${title}`);

      new Notification({ title, body: message }).show();
    } else {
      Logger.debug(`Show notification with${(buttons && buttons.length) > 0 ? '' : 'out'} prompt: ${title}`);

      dialog.showMessageBox({
        title,
        message,
        buttons,
      }, cb || (() => {}));
    }
  }
}
