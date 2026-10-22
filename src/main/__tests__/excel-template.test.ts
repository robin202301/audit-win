/**
 * 测试：Excel 模板渲染纯函数
 * 覆盖占位符替换、行循环展开、空数据/缺少结束标记等边界，
 * 以及审计底稿汇总表、任务清单两个真实模板的映射结果。
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as XLSX from 'xlsx';
import {
  replaceExcelPlaceholders,
  renderExcelWorksheet,
  applyTaskListCellMapping,
  applyTaskListCompletionCellMapping,
  sanitizeWorkbookForWrite,
} from '../services/excelTemplate';

const TEMPLATE_DIR = path.join(process.cwd(), 'resources/templates');

function readFirstSheet(fileName: string): XLSX.WorkSheet {
  const wb = XLSX.readFile(path.join(TEMPLATE_DIR, fileName));
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error('测试模板缺少工作表');
  return ws;
}

function toRows(ws: XLSX.WorkSheet): string[][] {
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false }) as string[][];
}

describe('replaceExcelPlaceholders 普通占位符替换', () => {
  it('替换存在的字段，缺失字段渲染为空串', () => {
    expect(replaceExcelPlaceholders('项目：{projectName}，单位：{auditedUnit}', {
      projectName: '测试项目',
    })).toBe('项目：测试项目，单位：');
  });

  it('undefined/null 均渲染为空串', () => {
    expect(replaceExcelPlaceholders('{a}|{b}|{c}', { a: null, b: undefined })).toBe('||');
  });

  it('同一字段多次出现全部替换', () => {
    expect(replaceExcelPlaceholders('{name}-{name}', { name: '张三' })).toBe('张三-张三');
  });

  it('不匹配非单词字符的占位符保持原样', () => {
    expect(replaceExcelPlaceholders('{项目名称}', { 项目名称: 'X' })).toBe('{项目名称}');
  });
});

describe('renderExcelWorksheet 行循环展开', () => {
  function buildSheet(): XLSX.WorkSheet {
    return XLSX.utils.aoa_to_sheet([
      ['审计底稿汇总表'],
      ['项目：{projectName}'],
      ['序号', '索引号', '审计事项'],
      ['{#items}', '', ''],
      ['{seq}', '{indexNumber}', '{auditMatter}'],
      ['{/items}', '', ''],
      ['共 {count} 份'],
    ]);
  }

  it('按条目数量复制模板行，并替换循环内占位符', () => {
    const ws = buildSheet();
    const expanded = renderExcelWorksheet(ws, {
      projectName: '测试项目',
      count: '2',
      items: [
        { seq: '1', indexNumber: '1', auditMatter: '事项一' },
        { seq: '2', indexNumber: '2', auditMatter: '事项二' },
      ],
    });
    expect(expanded).toBe(true);
    const rows = toRows(ws);
    expect(rows[1][0]).toBe('项目：测试项目');
    expect(rows[3]).toEqual(['1', '1', '事项一']);
    expect(rows[4]).toEqual(['2', '2', '事项二']);
    expect(rows[5][0]).toBe('共 2 份');
    const allText = rows.flat().join('|');
    expect(allText).not.toContain('{#items}');
    expect(allText).not.toContain('{/items}');
    expect(allText).not.toContain('{seq}');
  });

  it('条目为空时移除循环区间，后续行上移', () => {
    const ws = buildSheet();
    const expanded = renderExcelWorksheet(ws, {
      projectName: '空项目',
      count: '0',
      items: [],
    });
    expect(expanded).toBe(true);
    const rows = toRows(ws);
    expect(rows[2]).toEqual(['序号', '索引号', '审计事项']);
    expect(rows[3][0]).toBe('共 0 份');
    const allText = rows.flat().join('|');
    expect(allText).not.toContain('{#items}');
    expect(allText).not.toContain('{/items}');
  });

  it('循环起始标记缺少结束标记时抛出中文错误', () => {
    const ws = XLSX.utils.aoa_to_sheet([['{#items}'], ['{seq}']]);
    expect(() => renderExcelWorksheet(ws, { items: [] })).toThrow('Excel 模板循环标记缺少结束标记：{/items}');
  });

  it('无循环标记的普通模板仅替换占位符', () => {
    const ws = XLSX.utils.aoa_to_sheet([['项目：{projectName}'], ['单位：{auditedUnit}']]);
    const expanded = renderExcelWorksheet(ws, { projectName: '项目A', auditedUnit: '单位B' });
    expect(expanded).toBe(false);
    expect(toRows(ws)).toEqual([['项目：项目A'], ['单位：单位B']]);
  });
});

describe('29审计底稿汇总表 真实模板渲染', () => {
  it('渲染项目信息、底稿行与合计，且不残留占位符', () => {
    const ws = readFirstSheet('29审计底稿汇总表.xlsx');
    const expanded = renderExcelWorksheet(ws, {
      projectName: '测试项目',
      auditedUnit: '测试单位',
      compileDate: '2026年10月22日',
      totalCount: '2',
      workingPapers: [
        {
          seq: '1',
          indexNumber: '1',
          auditMatter: '审计事项一',
          auditorName: '张三',
          compileDate: '2026年1月5日',
          factSummary: '事实摘要一',
          auditConclusion: '结论一',
          reviewerOpinion: '予以认可',
          reviewerName: '李四',
          reviewDate: '2026年1月8日',
        },
        {
          seq: '2',
          indexNumber: '2',
          auditMatter: '审计事项二',
          auditorName: '王五',
          compileDate: '2026年1月6日',
          factSummary: '事实摘要二',
          auditConclusion: '结论二',
          reviewerOpinion: '',
          reviewerName: '',
          reviewDate: '',
        },
      ],
    });
    expect(expanded).toBe(true);
    const rows = toRows(ws);
    const allText = rows.flat().join('|');
    expect(allText).toContain('项目名称：测试项目');
    expect(allText).toContain('被审计单位：测试单位');
    expect(allText).toContain('底稿份数：2');
    expect(rows.filter(r => r[2] === '审计事项一')).toHaveLength(1);
    expect(rows.find(r => r[0] === '2')?.[1]).toBe('2');
    expect(allText).not.toContain('{#workingPapers}');
    expect(allText).not.toContain('{/workingPapers}');
    expect(allText).not.toMatch(/\{\w+\}/);
  });
});

describe('12任务清单 单元格映射', () => {
  it('将项目名称、编制日期、审计组信息、任务内容写入既有单元格', () => {
    const ws = readFirstSheet('12任务清单.xls');
    applyTaskListCellMapping(ws, {
      projectName: '测试项目',
      compileDate: '2026年10月22日',
      teamLeader: '张三',
      chiefAuditor: '李四',
      teamMembers: '王五、赵六',
      taskListContent: '1. 审计事项一\n2. 审计事项二',
    });
    expect(ws['A2']?.v).toBe('项目名称：测试项目        编制日期：2026年10月22日');
    expect(ws['A3']?.v).toBe('审计组：');
    expect(ws['B3']?.v).toBe('组长：张三   主审：李四  成员：王五、赵六');
    expect(ws['B6']?.v).toBe('1. 审计事项一\n2. 审计事项二');
  });

  it('空数据不写入 undefined，标签仍保留', () => {
    const ws = readFirstSheet('12任务清单.xls');
    applyTaskListCellMapping(ws, {});
    expect(ws['A2']?.v).toBe('项目名称：');
    expect(ws['B3']?.v).toBe('组长：   主审：  成员：');
    expect(ws['B6']?.v).toBe('');
  });

  it('写回 .xls 前清理文档属性后仍可正常读写', () => {
    const ws = readFirstSheet('12任务清单.xls');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    applyTaskListCellMapping(ws, { projectName: '导出项目', taskListContent: '任务内容' });
    sanitizeWorkbookForWrite(wb);
    const tmpFile = path.join(os.tmpdir(), `task-list-test-${Date.now()}.xls`);
    try {
      XLSX.writeFile(wb, tmpFile);
      const readBack = XLSX.readFile(tmpFile);
      const outWs = readBack.Sheets[readBack.SheetNames[0]];
      expect(outWs['A2']?.v).toBe('项目名称：导出项目');
      expect(outWs['B6']?.v).toBe('任务内容');
      expect(readBack.SheetNames).toEqual(['Sheet1']);
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });
});

describe('19任务清单完成情况 单元格映射', () => {
  it('将项目名称、填报日期、总体情况写入既有单元格，表头保持不变', () => {
    const ws = readFirstSheet('19任务清单完成情况.xls');
    applyTaskListCompletionCellMapping(ws, {
      projectName: '测试项目',
      completionContent: '各审计事项均已完成，问题已整改。',
      compileDate: '2026年10月22日',
    });
    expect(ws['A4']?.v).toBe('项目名称：测试项目        填报日期：2026年10月22日');
    expect(ws['A5']?.v).toBe('总体情况：各审计事项均已完成，问题已整改。');
    expect(ws['A1']?.v).toBe('附件3');
    expect(ws['A2']?.v).toBe('审计任务清单完成情况');
    expect(ws['A6']?.v).toBe('序号');
  });

  it('空数据不写入 undefined，标签仍保留', () => {
    const ws = readFirstSheet('19任务清单完成情况.xls');
    applyTaskListCompletionCellMapping(ws, {});
    expect(ws['A4']?.v).toBe('项目名称：');
    expect(ws['A5']?.v).toBe('总体情况：');
  });

  it('仅有填报日期时不拼接空项目名后的多余空格', () => {
    const ws = readFirstSheet('19任务清单完成情况.xls');
    applyTaskListCompletionCellMapping(ws, { compileDate: '2026年10月22日' });
    expect(ws['A4']?.v).toBe('项目名称：        填报日期：2026年10月22日');
  });

  it('写回 .xls 后可读回映射结果', () => {
    const ws = readFirstSheet('19任务清单完成情况.xls');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    applyTaskListCompletionCellMapping(ws, {
      projectName: '导出项目',
      completionContent: '完成情况内容',
      compileDate: '2026年10月22日',
    });
    sanitizeWorkbookForWrite(wb);
    const tmpFile = path.join(os.tmpdir(), `task-list-completion-test-${Date.now()}.xls`);
    try {
      XLSX.writeFile(wb, tmpFile);
      const readBack = XLSX.readFile(tmpFile);
      const outWs = readBack.Sheets[readBack.SheetNames[0]];
      expect(outWs['A4']?.v).toBe('项目名称：导出项目        填报日期：2026年10月22日');
      expect(outWs['A5']?.v).toBe('总体情况：完成情况内容');
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });
});
