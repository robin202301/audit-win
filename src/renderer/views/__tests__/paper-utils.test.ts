/**
 * 测试：底稿索引号递增 + 取证单摘要解析（纯函数）
 */
import { describe, it, expect } from 'vitest';
import { computeNextIndexNumber, parseSummaryItems } from '../paperUtils';

describe('computeNextIndexNumber', () => {
  it('空项目从 1 开始', () => {
    expect(computeNextIndexNumber([])).toBe('1');
  });

  it('取现有数字索引最大值 +1', () => {
    expect(computeNextIndexNumber(['1', '2', '3'])).toBe('4');
    expect(computeNextIndexNumber(['5', '3'])).toBe('6');
    expect(computeNextIndexNumber(['9'])).toBe('10');
  });

  it('非数字索引不参与计算（空串、字母、小数均忽略）', () => {
    expect(computeNextIndexNumber([''])).toBe('1');
    expect(computeNextIndexNumber(['A-1', ''])).toBe('1');
    expect(computeNextIndexNumber(['1.5'])).toBe('1');
    expect(computeNextIndexNumber(['甲', '2'])).toBe('3');
  });

  it('不同项目独立计数（调用方按项目过滤后传入，即各自从 1 递增）', () => {
    // 模拟项目 A 已有 1、2、3；项目 B 只有 1
    expect(computeNextIndexNumber(['1', '2', '3'])).toBe('4');
    expect(computeNextIndexNumber(['1'])).toBe('2');
  });
});

describe('parseSummaryItems', () => {
  it('解析新版本 JSON 数组（{content} 对象与纯字符串混合）', () => {
    expect(parseSummaryItems('[{"content":"摘要一"},{"content":"摘要二"}]')).toEqual(['摘要一', '摘要二']);
    expect(parseSummaryItems('["甲","乙"]')).toEqual(['甲', '乙']);
    expect(parseSummaryItems('[{"content":"有内容"},{"content":""}]')).toEqual(['有内容']);
  });

  it('兼容旧版纯文本数据（整体作为单条摘要）', () => {
    expect(parseSummaryItems('这是旧版纯文本摘要')).toEqual(['这是旧版纯文本摘要']);
  });

  it('空值与空数组返回空列表', () => {
    expect(parseSummaryItems('')).toEqual([]);
    expect(parseSummaryItems('[]')).toEqual([]);
    expect(parseSummaryItems('   ')).toEqual([]);
  });

  it('过滤空白条目', () => {
    expect(parseSummaryItems('[{"content":"  "},{"content":"有效"}]')).toEqual(['有效']);
  });
});
