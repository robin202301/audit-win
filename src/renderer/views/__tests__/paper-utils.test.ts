/**
 * 测试：底稿索引号递增 + 取证单摘要解析（纯函数）
 */
import { describe, it, expect } from 'vitest';
import {
  buildWorkingPaperExportData,
  computeNextIndexNumber,
  parseSummaryItems,
} from '../paperUtils';

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

describe('buildWorkingPaperExportData', () => {
  it('完整映射底稿正文、签名与中文日期', () => {
    const data = buildWorkingPaperExportData(
      {
        indexNumber: '1',
        projectName: '预算执行审计',
        auditMatter: '预算编制',
        auditorName: '张三',
        compileDate: '2026-10-22',
        auditProcess: '查阅账簿',
        factSummary: '发现预算执行率偏低。',
        auditConclusion: '问题属实。',
        reviewerOpinion: '予以认可。',
        reviewerName: '李四',
        reviewDate: '2026-10-23',
        attachmentCount: 3,
      },
      { auditedUnit: '某单位' }
    );

    expect(data).toEqual({
      indexNumber: '1',
      projectName: '预算执行审计',
      auditedUnit: '某单位',
      auditMatter: '预算编制',
      auditorName: '张三',
      compileDate: '2026年10月22日',
      auditProcess: '查阅账簿',
      factSummary: '发现预算执行率偏低。',
      auditConclusion: '问题属实。',
      reviewerOpinion: '予以认可。',
      reviewerName: '李四',
      reviewDate: '2026年10月23日',
      attachmentCount: '3',
    });
  });

  it('空字段输出空串，避免模板占位符残留 undefined', () => {
    const data = buildWorkingPaperExportData({});
    for (const value of Object.values(data)) {
      expect(value).toBe('');
    }
  });

  it('项目名称优先取底稿值，缺失时用通知书/项目信息兜底', () => {
    expect(
      buildWorkingPaperExportData(
        { projectName: '底稿项目名称' },
        { projectName: '兜底项目名称', auditedUnit: '某单位' }
      ).projectName
    ).toBe('底稿项目名称');
    expect(
      buildWorkingPaperExportData({}, { projectName: '兜底项目名称', auditedUnit: '某单位' })
        .projectName
    ).toBe('兜底项目名称');
    expect(buildWorkingPaperExportData({}, { auditedUnit: '某单位' }).auditedUnit).toBe('某单位');
  });

  it('附件页数区分 0、未填写与有效值', () => {
    expect(buildWorkingPaperExportData({ attachmentCount: 0 }).attachmentCount).toBe('0');
    expect(buildWorkingPaperExportData({ attachmentCount: null }).attachmentCount).toBe('');
    expect(buildWorkingPaperExportData({}).attachmentCount).toBe('');
    expect(buildWorkingPaperExportData({ attachmentCount: 12 }).attachmentCount).toBe('12');
  });

  it('非法日期保留原值，不丢失用户输入', () => {
    expect(buildWorkingPaperExportData({ compileDate: '时间待定' }).compileDate).toBe('时间待定');
  });
});
