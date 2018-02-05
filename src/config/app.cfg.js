export default {
  maxIdleBeforeAsk: 60 * 5, // 5 minutes idle time allowed
  minLogTime: 0.05, // log at least 5 minutes
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
