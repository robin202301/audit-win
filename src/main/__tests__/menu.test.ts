/**
 * 测试：应用菜单模板 —— 防止弹窗「闪退」回归
 *
 * 背景：新建项目弹窗偶发闪退，根因是 role: 'close' 菜单项注册了
 * Cmd+W / Ctrl+W（与复制粘贴 C/V 键位相邻），误触即关闭整个窗口。
 */
import { describe, it, expect } from 'vitest';
import { buildMenuTemplate } from '../menu';
import type { MenuItemConstructorOptions } from 'electron';

function flattenItems(items: MenuItemConstructorOptions[]): MenuItemConstructorOptions[] {
  const result: MenuItemConstructorOptions[] = [];
  for (const item of items) {
    result.push(item);
    if (item.submenu && Array.isArray(item.submenu)) {
      result.push(...flattenItems(item.submenu as MenuItemConstructorOptions[]));
    }
  }
  return result;
}

describe('菜单模板（Windows）', () => {
  const items = flattenItems(buildMenuTemplate(false, '审计系统', () => undefined));

  it('不得包含 role: close 菜单项（防止 Ctrl+W 误触关闭整个应用）', () => {
    const closes = items.filter(i => i.role === 'close');
    expect(closes).toEqual([]);
  });

  it('编辑菜单保留复制/粘贴/剪切角色（保证快捷键可用）', () => {
    const roles = items.map(i => i.role).filter(Boolean);
    expect(roles).toContain('copy');
    expect(roles).toContain('paste');
    expect(roles).toContain('cut');
  });

  it('返回首页使用 CmdOrCtrl+Shift+H，不与常规复制粘贴键位相邻', () => {
    const home = items.find(i => i.label === '返回首页');
    expect(home?.accelerator).toBe('CmdOrCtrl+Shift+H');
  });

  it('文件菜单保留「退出」', () => {
    const fileMenu = buildMenuTemplate(false, '审计系统', () => undefined)
      .find(i => i.label === '文件');
    const labels = (fileMenu?.submenu as MenuItemConstructorOptions[]).map(i => i.label);
    expect(labels).toContain('退出');
  });
});

describe('菜单模板（macOS）', () => {
  const template = buildMenuTemplate(true, '审计系统', () => undefined);
  const items = flattenItems(template);

  it('不得包含 role: close 菜单项（防止 Cmd+W 误触关闭窗口）', () => {
    const closes = items.filter(i => i.role === 'close');
    expect(closes).toEqual([]);
  });

  it('应用菜单保留 hide/about/services 角色', () => {
    const roles = items.map(i => i.role).filter(Boolean);
    expect(roles).toContain('hide');
    expect(roles).toContain('about');
    expect(roles).toContain('services');
  });

  it('返回首页不与 macOS 隐藏快捷键 Cmd+H 冲突', () => {
    const home = items.find(i => i.label === '返回首页');
    expect(home?.accelerator).not.toBe('CmdOrCtrl+H');
  });

  it('编辑菜单保留复制/粘贴角色（保证快捷键可用）', () => {
    const roles = items.map(i => i.role).filter(Boolean);
    expect(roles).toContain('copy');
    expect(roles).toContain('paste');
  });
});
