/**
 * 测试：审计底稿汇总表导出数据构建
 * 覆盖排序、通知书优先、日期格式化、缺失字段、空列表等边界。
 */
import { describe, it, expect } from 'vitest';
import { buildWorkingPaperSummaryData, formatLocalDateToChinese } from '../paperSummary';

const now = new Date(2026, 9, 22);

describe('buildWorkingPaperSummaryData 底稿汇总表数据', () => {
  it('空底稿列表：汇总行为空，份数为 0，不抛错', () => {
    const result = buildWorkingPaperSummaryData([], { name: '项目A', auditedTarget: '单位A' }, {}, now);
    expect(result.workingPapers).toEqual([]);
    expect(result.totalCount).toBe('0');
    expect(result.projectName).toBe('项目A');
    expect(result.auditedUnit).toBe('单位A');
    expect(result.compileDate).toBe('2026年10月22日');
  });

  it('通知书中的项目名称、被审计单位优先于项目初始信息', () => {
    const result = buildWorkingPaperSummaryData(
      [],
      { name: '项目初始名', auditedTarget: '单位初始名' },
      { name: '通知书项目名', auditedTarget: '通知书单位名' },
      now
    );
    expect(result.projectName).toBe('通知书项目名');
    expect(result.auditedUnit).toBe('通知书单位名');
  });

  it('通知书未提供时回退项目信息', () => {
    const result = buildWorkingPaperSummaryData(
      [],
      { name: '项目初始名', auditedTarget: '单位初始名' },
      { name: '', auditedTarget: '' },
      now
    );
    expect(result.projectName).toBe('项目初始名');
    expect(result.auditedUnit).toBe('单位初始名');
  });

  it('按索引号数值升序排序（1、2、10，而非字典序 1、10、2）', () => {
    const result = buildWorkingPaperSummaryData(
      [
        { indexNumber: '10', auditMatter: '事项十' },
        { indexNumber: '2', auditMatter: '事项二' },
        { indexNumber: '1', auditMatter: '事项一' },
      ],
      {},
      {},
      now
    );
    expect(result.workingPapers.map(p => p.indexNumber)).toEqual(['1', '2', '10']);
    expect(result.workingPapers.map(p => p.seq)).toEqual(['1', '2', '3']);
  });

  it('非数字索引排在数字索引之后，并保持原有相对顺序', () => {
    const result = buildWorkingPaperSummaryData(
      [
        { indexNumber: '附A', auditMatter: '附A' },
        { indexNumber: '2', auditMatter: '二' },
        { indexNumber: '', auditMatter: '空索引' },
        { indexNumber: '1', auditMatter: '一' },
      ],
      {},
      {},
      now
    );
    expect(result.workingPapers.map(p => p.indexNumber)).toEqual(['1', '2', '附A', '']);
  });

  it('日期字段转换为中文格式，缺失字段渲染为空串', () => {
    const result = buildWorkingPaperSummaryData(
      [
        {
          indexNumber: '1',
          compileDate: '2026-01-05',
          reviewDate: '2026-02-06',
        },
      ],
      {},
      {},
      now
    );
    const row = result.workingPapers[0];
    expect(row.compileDate).toBe('2026年1月5日');
    expect(row.reviewDate).toBe('2026年2月6日');
    expect(row.auditMatter).toBe('');
    expect(row.auditorName).toBe('');
    expect(row.factSummary).toBe('');
    expect(row.auditConclusion).toBe('');
    expect(row.reviewerOpinion).toBe('');
    expect(row.reviewerName).toBe('');
  });

  it('空日期不产生非法日期文本', () => {
    const result = buildWorkingPaperSummaryData([{ indexNumber: '1', compileDate: '' }], {}, {}, now);
    expect(result.workingPapers[0].compileDate).toBe('');
  });

  it('不修改传入的底稿数组顺序', () => {
    const papers = [{ indexNumber: '2' }, { indexNumber: '1' }];
    buildWorkingPaperSummaryData(papers, {}, {}, now);
    expect(papers.map(p => p.indexNumber)).toEqual(['2', '1']);
  });
});

describe('formatLocalDateToChinese 本地日期格式化', () => {
  it('使用本地年月日，避免 UTC 跨日偏差', () => {
    expect(formatLocalDateToChinese(new Date(2026, 0, 1, 23, 30))).toBe('2026年1月1日');
  });
});
