/**
 * 测试：P3-9 / P3-10 导出链路模板占位符
 *
 * 使用真实模板与 docxtemplater / SheetJS 管线，验证：
 * 1. 通知书附件内容（content）与审计委员会办公室（auditCommitteeOffice）可渲染落盘；
 * 2. 被审计单位基本情况表表单字段与单元格占位符一一对应；
 * 3. 预算执行对外报告字段与模板占位符对齐，静态版式文本不被破坏；
 * 4. 占位符均为单 run 完整文本（docxtemplater 可识别），空值不残留。
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import * as XLSX from 'xlsx';
import { renderExcelWorksheet } from '../services/excelTemplate';

const TEMPLATE_DIR = path.join(process.cwd(), 'resources/templates');

function readDocxZip(templateName: string): PizZip {
  return new PizZip(fs.readFileSync(path.join(TEMPLATE_DIR, `${templateName}.docx`)));
}

function readDocumentXml(templateName: string): string {
  const file = readDocxZip(templateName).file('word/document.xml');
  if (!file) throw new Error(`模板缺少 word/document.xml：${templateName}`);
  return file.asText();
}

function extractPlaceholders(templateName: string): string[] {
  const plain = readDocumentXml(templateName).replace(/<[^>]+>/g, '');
  const set = new Set<string>();
  const regex = /\{([^{}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(plain)) !== null) {
    const key = match[1].trim();
    if (key && !key.startsWith('#') && !key.startsWith('/') && !key.startsWith('^')) {
      set.add(key);
    }
  }
  return Array.from(set).sort();
}

function renderTemplate(templateName: string, data: Record<string, unknown>): string {
  const content = fs.readFileSync(path.join(TEMPLATE_DIR, `${templateName}.docx`));
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  const outZip = new PizZip(doc.getZip().generate({ type: 'nodebuffer' }) as Buffer);
  return outZip.file('word/document.xml')!.asText().replace(/<[^>]+>/g, '');
}

function emptyData(keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.map(key => [key, '']));
}

function expectNoPlaceholder(plain: string): void {
  expect(plain).not.toMatch(/\{\w+\}/);
}

describe('P3-9 通知书附件内容与审计委员会办公室', () => {
  const noticeCases = [
    {
      template: '01经济责任审计通知书',
      keys: [
        'documentNumber', 'auditedLeaderUnit', 'auditedLeaderPosition',
        'auditedLeaderName', 'auditOrg', 'auditStartDate', 'text',
        'teamLeader', 'teamDeputyLeader', 'teamMembers', 'content',
        'auditCommitteeOffice', 'issueDate', 'ccUnit', 'issuingOrg',
      ],
      hasCommitteeOffice: true,
    },
    {
      template: '02预算执行通知书',
      keys: [
        'documentNumber', 'auditOrg', 'auditedUnit', 'auditStartDate',
        'auditYear', 'teamLeader', 'teamDeputyLeader', 'teamMembers',
        'content', 'issueDate', 'ccUnit', 'issuingOrg',
      ],
      hasCommitteeOffice: false,
    },
    {
      template: '03专项审计调查通知书',
      keys: [
        'documentNumber', 'auditedUnit', 'auditStartDate', 'auditProject',
        'auditOrg', 'teamLeader', 'teamDeputyLeader', 'teamMembers',
        'content', 'issueDate',
      ],
      hasCommitteeOffice: false,
    },
  ];

  it.each(noticeCases)('$template 的附件占位符为单 run 完整文本且保留原段落样式', ({ template }) => {
    const xml = readDocumentXml(template);
    // 经济责任通知书的附件段落末尾追加了办公室条件起始标签（P3-20）
    expect(xml).toContain('附件：{content}');
    const index = xml.indexOf('附件：{content}');
    const paragraphStart = xml.lastIndexOf('<w:p ', index);
    const paragraphEnd = xml.indexOf('</w:p>', index);
    const paragraph = xml.slice(paragraphStart, paragraphEnd);
    // 原模板的段落缩进/行距与 32 磅字号未被改写
    expect(paragraph).toContain('<w:ind');
    expect(paragraph).toContain('<w:sz w:val="32"/>');
    expect(paragraph).toContain('<w:spacing');
  });

  it.each(noticeCases)('$template 将附件内容渲染到文档，静态正文保留', ({ template, keys }) => {
    const data: Record<string, string> = {};
    for (const key of keys) data[key] = `测试${key}`;
    data.content = '审计“八不准”工作纪律';
    const plain = renderTemplate(template, data);
    expect(plain).toContain('附件：审计“八不准”工作纪律');
    expect(plain).toContain('根据《中华人民共和国审计法》');
    expect(plain).toContain('请予以配合');
    expectNoPlaceholder(plain);
  });

  it.each(noticeCases)('$template 附件内容为空时占位符不残留', ({ template, keys }) => {
    const warningSpy = console.warn;
    const errorSpy = console.error;
    console.warn = () => undefined;
    console.error = () => undefined;
    try {
      const plain = renderTemplate(template, emptyData(keys));
      expect(plain).not.toContain('{content}');
      expectNoPlaceholder(plain);
    } finally {
      console.warn = warningSpy;
      console.error = errorSpy;
    }
  });

  it('01 经济责任通知书落款同时渲染审计委员会办公室与审计机关', () => {
    const template = '01经济责任审计通知书';
    const keys = noticeCases[0].keys;
    const data: Record<string, string> = {};
    for (const key of keys) data[key] = `测试${key}`;
    data.content = '审计“八不准”工作纪律';
    data.auditCommitteeOffice = '中共测试旗审计委员会办公室';
    data.auditOrg = '测试旗审计局';

    const plain = renderTemplate(template, data);
    const tail = plain.slice(plain.indexOf('附件：审计“八不准”工作纪律'));
    expect(tail).toContain('中共测试旗审计委员会办公室');
    expect(tail).toContain('测试旗审计局');
    expect(tail.indexOf('中共测试旗审计委员会办公室')).toBeLessThan(
      tail.indexOf('测试旗审计局')
    );

    // 落款段落沿用原右缩进样式，未新增未定义样式
    const xml = readDocumentXml(template);
    const officeIndex = xml.indexOf('<w:t>{auditCommitteeOffice}</w:t>');
    expect(officeIndex).toBeGreaterThan(-1);
    const paragraphStart = xml.lastIndexOf('<w:p ', officeIndex);
    const paragraphEnd = xml.indexOf('</w:p>', officeIndex);
    const paragraph = xml.slice(paragraphStart, paragraphEnd);
    expect(paragraph).toContain('<w:pStyle w:val="5"/>');
    expect(paragraph).toContain('w:firstLine="5814"');
  });
});

describe('P3-10 被审计单位基本情况表字段与占位符对齐', () => {
  const template = '08调查了解记录基本情况表';
  const expectedKeys = [
    'unitName', 'unitNature', 'legalRepresentative', 'supervisingUnit',
    'staffQuota', 'currentStaffCount', 'orgStructure', 'responsibilityScope',
    'lawExecution', 'financialSystem', 'performanceIndicators', 'internalControl',
    'infoSystems', 'economicEnvironment', 'previousAudit', 'otherInfo',
    'fillerName', 'fillDate',
  ];

  function readTemplateSheet(): XLSX.WorkSheet {
    const wb = XLSX.readFile(path.join(TEMPLATE_DIR, `${template}.xlsx`), { cellStyles: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) throw new Error('测试模板缺少工作表');
    return ws;
  }

  function extractSheetPlaceholders(ws: XLSX.WorkSheet): string[] {
    const set = new Set<string>();
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const value = ws[XLSX.utils.encode_cell({ r: row, c: col })]?.v;
        if (typeof value !== 'string') continue;
        for (const match of value.matchAll(/\{([^{}]+)\}/g)) set.add(match[1]);
      }
    }
    return Array.from(set).sort();
  }

  it('模板占位符与 18 个表单字段完全一致', () => {
    expect(extractSheetPlaceholders(readTemplateSheet())).toEqual(expectedKeys.slice().sort());
  });

  it('表单内容写入对应单元格，合并区域与单元格样式保持不变', () => {
    const ws = readTemplateSheet();
    const mergesBefore = JSON.stringify(ws['!merges']);
    const styleBefore = JSON.stringify(ws['C6'].s);

    renderExcelWorksheet(ws, {
      unitName: '测试单位',
      unitNature: '行政机关',
      legalRepresentative: '张三',
      supervisingUnit: '主管局',
      staffQuota: '20',
      currentStaffCount: '18',
      orgStructure: '办公室、财务股',
      responsibilityScope: '负责财政收支管理',
      lawExecution: '依法行政',
      financialSystem: '财政财务管理制度',
      performanceIndicators: '预算执行率',
      internalControl: '内控基本健全',
      infoSystems: '预算管理一体化系统',
      economicEnvironment: '经济环境稳定',
      previousAudit: '上年度审计无重大问题',
      otherInfo: '其他情况',
      fillerName: '李四',
      fillDate: '2026年10月22日',
    });

    expect(ws['A5']?.v).toContain('单位名称：测试单位');
    expect(ws['C6']?.v).toBe('行政机关');
    expect(ws['G6']?.v).toBe('张三');
    expect(ws['N6']?.v).toBe('18');
    expect(ws['C36']?.v).toBe('其他情况');
    expect(ws['A37']?.v).toContain('填表人：李四');
    expect(ws['A37']?.v).toContain('2026年10月22日');
    expect(JSON.stringify(ws['!merges'])).toBe(mergesBefore);
    expect(JSON.stringify(ws['C6'].s)).toBe(styleBefore);

    const allText = Object.keys(ws)
      .filter(key => !key.startsWith('!'))
      .map(key => String(ws[key]?.v ?? ''))
      .join('|');
    expect(allText).not.toMatch(/\{\w+\}/);
  });

  it('空值渲染后占位符不残留，表头与标签文本保留', () => {
    const ws = readTemplateSheet();
    renderExcelWorksheet(ws, emptyData(expectedKeys));
    const allText = Object.keys(ws)
      .filter(key => !key.startsWith('!'))
      .map(key => String(ws[key]?.v ?? ''))
      .join('|');
    expect(allText).not.toMatch(/\{\w+\}/);
    expect(allText).toContain('单位名称：');
    expect(allText).toContain('填表人：');
  });
});

describe('P3-10 预算执行对外报告字段与占位符对齐', () => {
  const template = '27预算执行对外报告';
  const expectedKeys = [
    'reportNumber', 'auditedUnit', 'projectName', 'reportContent',
    'issueOrg', 'issuerSignature', 'reportDate',
  ];

  it('模板仅包含 7 个可填写占位符', () => {
    expect(extractPlaceholders(template)).toEqual(expectedKeys.slice().sort());
  });

  it('新增占位符均为单 run 完整文本', () => {
    const xml = readDocumentXml(template);
    expect(xml).toContain('<w:t>{reportNumber}</w:t>');
    expect(xml).toContain('<w:t xml:space="preserve">{reportContent}</w:t>');
    expect(xml).toContain('<w:t>                                {issuerSignature}　　{reportDate}</w:t>');
    expect(xml).toContain('<w:t>{issueOrg}</w:t>');
  });

  it('报告编号、正文、发文机关、签发人与日期全部渲染，静态掩码正文不再残留', () => {
    const plain = renderTemplate(template, {
      reportNumber: '审报〔2026〕1号',
      auditedUnit: '测试单位',
      projectName: '测试项目',
      reportContent: '本年度预算执行情况总体良好。',
      issueOrg: '测试旗审计局',
      issuerSignature: '王五',
      reportDate: '2026年10月22日',
    });
    expect(plain).toContain('审报〔2026〕1号');
    expect(plain).toContain('本年度预算执行情况总体良好。');
    expect(plain).toContain('测试旗审计局');
    expect(plain).toContain('王五');
    expect(plain).toContain('2026年10月22日');
    // P3-21：正文由表单内容生成，静态掩码、固定名称与整改说明不再随模板导出
    expect(plain).not.toContain('**年**月');
    expect(plain).not.toContain('****');
    expect(plain).not.toContain('本次审计发现的问题中');
    expect(plain).not.toContain('请在收到本报告之日起');
    expect(plain).not.toContain('旗审计局对');
    expectNoPlaceholder(plain);
  });

  it('空值渲染后占位符不残留，静态版式文本不被破坏', () => {
    const plain = renderTemplate(template, emptyData(expectedKeys));
    expect(plain).not.toContain('{reportContent}');
    expectNoPlaceholder(plain);
    expect(plain).toContain('被审计单位：');
    expect(plain).toContain('审计项目：');
  });

  it('正文占位符段落沿用导语段落字号，不引入未定义样式', () => {
    const xml = readDocumentXml(template);
    const index = xml.indexOf('{reportContent}');
    const paragraphStart = xml.lastIndexOf('<w:p ', index);
    const paragraphEnd = xml.indexOf('</w:p>', index);
    const paragraph = xml.slice(paragraphStart, paragraphEnd);
    expect(paragraph).toContain('<w:sz w:val="32"/>');
    expect(paragraph).toContain('w:eastAsia="仿宋_GB2312"');
  });
});
