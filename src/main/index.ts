import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipc/index';
import { closeDatabase } from '@database/connection';
import { buildMenuTemplate } from './menu';

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
  // 菜单模板见 ./menu.ts：不含 role: 'close' 项（Cmd+W/Ctrl+W 与复制粘贴键位相邻，误触会关闭整个窗口）
  const menu = Menu.buildFromTemplate(
    buildMenuTemplate(isMac, app.name, () => mainWindow?.webContents.send('navigate', '/'))
  );
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 仅在应用真正退出时关闭数据库连接。
// 此前在 window-all-closed 中无条件关闭数据库，macOS 上关闭窗口后应用仍存活，
// 点击 Dock 重新打开窗口时数据库已关闭，表现为「闪退」后系统不可用。
app.on('before-quit', async (event) => {
  event.preventDefault();
  try {
    await closeDatabase();
  } catch (e: unknown) {
    console.error('关闭数据库连接失败：', e);
  }
  app.exit(0);
});
