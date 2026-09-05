import type { MenuItemConstructorOptions } from 'electron';

/**
 * 构建应用菜单模板（纯数据函数，便于单元测试）。
 *
 * 设计约束：
 * 1. 不提供「关闭窗口/关闭」菜单项 —— 单窗口应用中 role: 'close' 的默认快捷键
 *    Cmd+W / Ctrl+W 与复制粘贴（Cmd/Ctrl+C/V）键位相邻，误触会直接关闭整个
 *    应用窗口（Windows 上连带退出），表现为「新建项目弹窗闪退」。
 * 2. 「返回首页」使用 CmdOrCtrl+Shift+H —— 避免与 macOS 系统「隐藏」快捷键
 *    Cmd+H（role: 'hide'）冲突。
 */
export function buildMenuTemplate(
  isMac: boolean,
  appName: string,
  onNavigateHome: () => void
): MenuItemConstructorOptions[] {
  return [
    ...(isMac ? [{
      label: appName,
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
        { label: '返回首页', accelerator: 'CmdOrCtrl+Shift+H', click: onNavigateHome },
        ...(isMac ? [] : [
          { type: 'separator' as const },
          { label: '退出', role: 'quit' as const },
        ]),
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
        ] : []),
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
}
