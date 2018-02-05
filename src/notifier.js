import { dialog, Notification } from 'electron';

export default class Notifier {

  // @ref https://electronjs.org/docs/api/dialog#dialogshowmessageboxbrowserwindow-options-callback
  static notify(title, message, buttons = [], cb = null) {
    if ((!buttons || buttons.length <= 0) && Notification.isSupported()) {
      new Notification({ title, body: message }).show();
    } else {
      dialog.showMessageBox({
        title,
        message,
        buttons,
      }, cb || (() => {}));
    }
  }
}
