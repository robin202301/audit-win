/**
 * 测试：P2-4 / P2-7 Word 模板占位符与真实渲染
 * 使用真实 docxtemplater 管线验证表单编辑内容能落盘，
 * 且空值不残留占位符、静态标题/落款不被破坏。
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

const TEMPLATE_DIR = path.join(process.cwd(), 'resources/templates');

function readDocumentXml(templateName: string): string {
  const content = fs.readFileSync(path.join(TEMPLATE_DIR, `${templateName}.docx`));
  const zip = new PizZip(content);
  const file = zip.file('word/document.xml');
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
  return Array.from(set);
}

function renderTemplate(templateName: string, data: Record<string, unknown>): string {
  const content = fs.readFileSync(path.join(TEMPLATE_DIR, `${templateName}.docx`), 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  const outBuf = doc.getZip().generate({ type: 'nodebuffer' });
  const outZip = new PizZip(outBuf as Buffer);
  return outZip.file('word/document.xml')!.asText().replace(/<[^>]+>/g, '');
}

function expectNoPlaceholder(plain: string): void {
  expect(plain).not.toMatch(/\{\w+\}/);
}

describe('P2-4 模板型步骤导出占位符', () => {
  const cases = [
    { template: '04通知附件八不准', title: '审计“八不准”工作纪律', staticText: '举报电话：0482-8399314' },
    { template: '07被审计单位承诺书', title: '被审计单位承诺书', staticText: '单位负责人（签字）：' },
    { template: '09评估被审计单位存在问题可能性', title: '评估被审计单位存在重要问题的可能性', staticText: '编制人：' },
    { template: '10确定审计事项和审计应对措施', title: '确定审计事项和审计应对措施', staticText: '编制人：' },
  ];

  it.each(cases)('$template 只包含 {content} 占位符，静态标题与落款保留', ({ template, title, staticText }) => {
    expect(extractPlaceholders(template)).toEqual(['content']);
    const plain = readDocumentXml(template).replace(/<[^>]+>/g, '');
    expect(plain).toContain(title);
    expect(plain).toContain(staticText);
  });

  it.each(cases)('$template 将编辑内容渲染到文档，且不残留占位符', ({ template, title }) => {
    const plain = renderTemplate(template, { content: '本步骤用户编辑后的正文内容' });
    expect(plain).toContain('本步骤用户编辑后的正文内容');
    expect(plain).toContain(title);
    expectNoPlaceholder(plain);
  });

  it.each(cases)('$template 内容为空时占位符不残留', ({ template }) => {
    const plain = renderTemplate(template, { content: '' });
    expect(plain).not.toContain('{content}');
    expectNoPlaceholder(plain);
  });
});

describe('P2-7 述职报告提纲 26 个字段全部可渲染', () => {
  const template = '15述职报告提纲';
  const expectedKeys = [
    'reporterName',
    'tenureStartYear',
    'tenureStartMonth',
    'tenureEndYear',
    'tenureEndMonth',
    'unitName',
    'positionTitle',
    'divisionOfLabor',
    'budgetExecution',
    'financialStatus',
    'institutionalRules',
    'authenticityLegality',
    'socialOrganizations',
    'majorInvestments',
    'unfinishedProjects',
    'subordinateSupervision',
    'publicPropertySettlement',
    'majorDecisions',
    'economicAchievements',
    'personalEconomic',
    'otherViolations',
    'lawCompliance',
    'selfEvaluation',
    'achievementsAndShortcomings',
    'reporterSignature',
    'reportDate',
  ];

  const data = {
    reporterName: '张三',
    tenureStartYear: '2020',
    tenureStartMonth: '1',
    tenureEndYear: '2024',
    tenureEndMonth: '12',
    unitName: '测试单位',
    positionTitle: '局长',
    divisionOfLabor: '主持全面工作',
    budgetExecution: '预算执行情况内容',
    financialStatus: '财务收支情况内容',
    institutionalRules: '规章制度内容',
    authenticityLegality: '真实合法效益内容',
    socialOrganizations: '社会团体内容',
    majorInvestments: '投资项目建设内容',
    unfinishedProjects: '未了工程项目内容',
    subordinateSupervision: '下属单位监督内容',
    publicPropertySettlement: '公物公款结清内容',
    majorDecisions: '重大决策内容',
    economicAchievements: '经济管理业绩内容',
    personalEconomic: '个人经济行为内容',
    otherViolations: '其他廉洁问题内容',
    lawCompliance: '遵守法律法规内容',
    selfEvaluation: '自我评价内容',
    achievementsAndShortcomings: '成绩和不足内容',
    reporterSignature: '签名值',
    reportDate: '2026年10月22日',
  };

  it('模板占位符与 26 个表单字段完全一致', () => {
    expect(extractPlaceholders(template).sort()).toEqual(expectedKeys.slice().sort());
  });

  it('全部字段值渲染到导出文本', () => {
    const plain = renderTemplate(template, data);
    for (const value of Object.values(data)) {
      expect(plain).toContain(value);
    }
    expect(plain).toContain('一、本人于2020年1月至2024年12月任测试单位局长；主持全面工作。');
    expectNoPlaceholder(plain);
  });

  it('字段为空时占位符不残留', () => {
    const emptyData: Record<string, string> = {};
    for (const key of expectedKeys) emptyData[key] = '';
    const plain = renderTemplate(template, emptyData);
    expectNoPlaceholder(plain);
  });
});
