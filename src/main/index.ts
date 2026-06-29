import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipc/index';
import { closeDatabase } from '@database/connection';

// electron-squirrel-startup 处理 Windows 安装/卸载事件
if (require('electron-squirrel-startup')) app.quit();

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: '基层审计机关审计辅助系统',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function buildMenu(): void {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { label: '关于本系统', role: 'about' as const },
        { type: 'separator' as const },
        { label: '服务', role: 'services' as const },
        { type: 'separator' as const },
        { label: '隐藏', role: 'hide' as const },
        { label: '隐藏其他', role: 'hideOthers' as const },
        { label: '全部显示', role: 'unhide' as const },
        { type: 'separator' as const },
        { label: '退出', role: 'quit' as const },
      ],
    }] : []),
    {
      label: '文件',
      submenu: [
        { label: '返回首页', accelerator: 'CmdOrCtrl+H', click: () => mainWindow?.webContents.send('navigate', '/') },
        { type: 'separator' },
        isMac ? { label: '关闭窗口', role: 'close' as const } : { label: '退出', role: 'quit' as const },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' as const },
        { label: '重做', role: 'redo' as const },
        { type: 'separator' as const },
        { label: '剪切', role: 'cut' as const },
        { label: '复制', role: 'copy' as const },
        { label: '粘贴', role: 'paste' as const },
        { label: '全选', role: 'selectAll' as const },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', role: 'reload' as const },
        { label: '强制重新加载', role: 'forceReload' as const },
        { label: '开发者工具', role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { label: '放大', role: 'zoomIn' as const },
        { label: '缩小', role: 'zoomOut' as const },
        { label: '实际大小', role: 'resetZoom' as const },
        { type: 'separator' as const },
        { label: '全屏', role: 'togglefullscreen' as const },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' as const },
        { label: '缩放', role: 'zoom' as const },
        ...(isMac ? [
          { type: 'separator' as const },
          { label: '前置全部窗口', role: 'front' as const },
        ] : [
          { label: '关闭', role: 'close' as const },
        ]),
      ],
    },
    {
      label: '帮助',
      submenu: [
        { label: '关于', role: 'about' as const },
        { label: '切换开发者工具', role: 'toggleDevTools' as const },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  await setupIpcHandlers();
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  await closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
