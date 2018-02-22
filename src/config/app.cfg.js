import path from 'path';
import Env from '../env';

export default {
  logOptions: {
    filename: path.join(Env.homeDir(), '.titime', 'log'),
    prepend: true,
    level: 'info',
    maxDays: 30,
  },
  remoteSyncCron: 10 * 60 * 1000, // Cron to run remote sync every 10 minutes (e.g. Redmine)
  archiveByYear: true, // Archive previous year entries
  archiveResetKey: 'timeSegments', // Reset loged time after a year
  maxIdleBeforeAsk: 60 * 5, // 5 minutes idle time allowed
  minLogTime: 0.05, // Log at least 5 minutes
  position: 'topRight',
  availablePositions: [
    'trayLeft', 'trayBottomLeft', 'trayRight',
    'trayBottomRight', 'trayCenter', 'trayCenter',
    'topLeft', 'topRight', 'bottomLeft', 'bottomRight',
    'topCenter', 'topCenter', 'center',
  ],
  sampleProjects: [
    {
      name: 'TiTime (Sample)',
      link: 'https://github.com/AlexanderC/titime',
    },
  ],
  appMenu: [
    {
      label: 'Application',
      submenu: [{
        label: 'About Application',
        selector: 'orderFrontStandardAboutPanel:',
      }],
    }, {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          selector: 'undo:',
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          selector: 'redo:',
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          selector: 'cut:',
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          selector: 'copy:',
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          selector: 'paste:',
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          selector: 'selectAll:',
        },
      ],
    },
  ],
};
