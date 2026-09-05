/**
 * 测试：阶段页签导航参数解析
 * 从阶段页返回项目时，仅 1-5 的整数阶段号生效，其余回落到默认阶段 1。
 */
import { describe, it, expect } from 'vitest';
import { parsePhaseQuery, PHASE_COUNT } from '../phaseNav';

describe('parsePhaseQuery', () => {
  it('字符串与数字的有效阶段号均可解析', () => {
    expect(parsePhaseQuery('2')).toBe(2);
    expect(parsePhaseQuery(3)).toBe(3);
    expect(parsePhaseQuery(String(PHASE_COUNT))).toBe(PHASE_COUNT);
  });

  it('非法输入返回 null（回落到默认阶段 1）', () => {
    expect(parsePhaseQuery(undefined)).toBeNull();
    expect(parsePhaseQuery(null)).toBeNull();
    expect(parsePhaseQuery('')).toBeNull();
    expect(parsePhaseQuery('abc')).toBeNull();
  });

  it('越界与小数阶段号返回 null', () => {
    expect(parsePhaseQuery('0')).toBeNull();
    expect(parsePhaseQuery('6')).toBeNull();
    expect(parsePhaseQuery('2.5')).toBeNull();
    expect(parsePhaseQuery(-1)).toBeNull();
  });

  it('阶段页签总数恒为 5（与 ProjectDetail phaseTabs 一致）', () => {
    expect(PHASE_COUNT).toBe(5);
  });
});
