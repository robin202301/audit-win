/**
 * 测试：P3-16 ~ P3-21 导出链路模板补全
 *
 * 使用真实 docx 模板与 docxtemplater 管线，验证：
 * 1. 实施方案、工作底稿正文/签名/日期占位符可渲染；
 * 2. 审核/复核/审理意见书、代拟稿封皮、审理会议纪要字段完整；
 * 3. 公示审计期间、通知书条件段落、对外报告用户正文；
 * 4. 空值不残留占位符，模板原有版式样式不被改写。
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { buildWorkingPaperExportData } from '../../renderer/views/paperUtils';

const TEMPLATE_DIR = path.join(process.cwd(), 'resources/templates');

function readDocumentXml(templateName: string): string {
  const zip = new PizZip(fs.readFileSync(path.join(TEMPLATE_DIR, `${templateName}.docx`)));
  const file = zip.file('word/document.xml');
  if (!file) throw new Error(`模板缺少 word/document.xml：${templateName}`);
  return file.asText();
}

function extractPlaceholders(templateName: string): string[] {
  const plain = readDocumentXml(templateName).replace(/<[^>]+>/g, '');
  const set = new Set<string>();
  for (const match of plain.matchAll(/\{([^{}]+)\}/g)) {
    const key = match[1].trim();
    if (key && !key.startsWith('#') && !key.startsWith('/') && !key.startsWith('^')) {
      set.add(key);
    }
  }
  return Array.from(set).sort();
}

interface RenderedDocument {
  xml: string;
  plain: string;
  paragraphs: Array<{ id: string; text: string }>;
}

function paragraphText(paragraph: string): string {
  return (paragraph.match(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>/g) || [])
    .map(text => text.replace(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/, '$1'))
    .join('');
}

function renderTemplate(
  templateName: string,
  data: Record<string, unknown>
): RenderedDocument {
  const zip = new PizZip(fs.readFileSync(path.join(TEMPLATE_DIR, `${templateName}.docx`)));
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  const xml = doc
    .getZip()
    .file('word/document.xml')!
    .asText();
  return {
    xml,
    plain: xml.replace(/<[^>]+>/g, ''),
    paragraphs: (xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []).map(paragraph => ({
      id: (paragraph.match(/w14:paraId="([^"]+)"/) || [])[1] || '',
      text: paragraphText(paragraph),
    })),
  };
}

function emptyData(keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.map(key => [key, '']));
}

function expectNoPlaceholder(plain: string): void {
  expect(plain).not.toMatch(/\{\w+\}/);
}

describe('P3-16 审计实施方案正文占位符', () => {
  const template = '11审计实施方案';
  const expectedKeys = [
    'auditFocus', 'auditMethod', 'auditScope', 'auditedUnit', 'endDate',
    'projectName', 'schedule', 'startDate', 'teamLeader', 'teamMembers',
  ];

  it('模板包含审计范围和时间安排占位符，且均为单 run 完整文本', () => {
    expect(extractPlaceholders(template)).toEqual(expectedKeys.slice().sort());
    const xml = readDocumentXml(template);
    expect(xml).toContain('<w:t xml:space="preserve">{auditScope}</w:t>');
    expect(xml).toContain('<w:t xml:space="preserve">时间安排：{schedule}</w:t>');
  });

  it('保持原段落缩进与对齐样式，不引入未定义样式', () => {
    const xml = readDocumentXml(template);
    const scopeIndex = xml.indexOf('{auditScope}');
    const scopeParagraph = xml.slice(xml.lastIndexOf('<w:p ', scopeIndex), xml.indexOf('</w:p>', scopeIndex));
    expect(scopeParagraph).toContain('<w:jc w:val="both"/>');

    const scheduleIndex = xml.indexOf('时间安排：{schedule}');
    const scheduleParagraph = xml.slice(
      xml.lastIndexOf('<w:p ', scheduleIndex),
      xml.indexOf('</w:p>', scheduleIndex)
    );
    expect(scheduleParagraph).toContain('w:left="1560"');
    expect(scheduleParagraph).toContain('<w:sz w:val="24"/>');
  });

  it('审计范围与时间安排渲染到正文，空值不残留占位符', () => {
    const data: Record<string, string> = {};
    for (const key of expectedKeys) data[key] = `测试${key}`;
    data.auditScope = '2025年度预算执行情况';
    data.schedule = '2026年1月至2月';

    const rendered = renderTemplate(template, data);
    expect(rendered.plain).toContain('2025年度预算执行情况');
    expect(rendered.plain).toContain('时间安排：2026年1月至2月');
    expectNoPlaceholder(rendered.plain);

    const empty = renderTemplate(template, emptyData(expectedKeys));
    expect(empty.plain).toContain('审计范围、内容和重点：');
    expect(empty.plain).toContain('预计审计工作起讫日期');
    expectNoPlaceholder(empty.plain);
  });
});

describe('P3-17 审计工作底稿正文与签名占位符', () => {
  const template = '16审计工作底稿';
  const expectedKeys = [
    'attachmentCount', 'auditConclusion', 'auditMatter', 'auditProcess',
    'auditedUnit', 'auditorName', 'compileDate', 'factSummary', 'indexNumber',
    'projectName', 'reviewDate', 'reviewerName', 'reviewerOpinion',
  ];

  it('模板占位符与底稿导出字段完全一致', () => {
    expect(extractPlaceholders(template)).toEqual(expectedKeys.slice().sort());
  });

  it('正文、结论、审核意见、签名与附件页数全部渲染', () => {
    const exportData = buildWorkingPaperExportData(
      {
        indexNumber: '1',
        projectName: '预算执行审计',
        auditMatter: '预算编制与执行',
        auditorName: '张三',
        compileDate: '2026-10-22',
        auditProcess: '查阅账簿并访谈',
        factSummary: '发现预算执行率偏低。',
        auditConclusion: '问题属实。',
        reviewerOpinion: '予以认可。',
        reviewerName: '李四',
        reviewDate: '2026-10-23',
        attachmentCount: 3,
      },
      { auditedUnit: '某单位' }
    );
    const rendered = renderTemplate(template, exportData);
    expect(rendered.plain).toMatch(/索引号：\s*1/);
    expect(rendered.plain).toContain('预算编制与执行');
    expect(rendered.plain).toContain('张三');
    expect(rendered.plain).toContain('2026年10月22日');
    expect(rendered.plain).toContain('查阅账簿并访谈');
    expect(rendered.plain).toContain('发现预算执行率偏低。');
    expect(rendered.plain).toContain('审计结论：问题属实。');
    expect(rendered.plain).toContain('予以认可。');
    expect(rendered.plain).toContain('李四');
    expect(rendered.plain).toContain('2026年10月23日');
    expect(rendered.plain).toContain('附件：3');
    expect(rendered.plain).toContain('某单位');
    expectNoPlaceholder(rendered.plain);
  });

  it('空值渲染后标签与表格结构保留，占位符不残留', () => {
    const empty = renderTemplate(template, emptyData(expectedKeys));
    expect(empty.plain).toContain('项目名称');
    expect(empty.plain).toContain('审计（调查）事项');
    expect(empty.plain).toContain('审计人员');
    expect(empty.plain).toContain('审核人员');
    expect(empty.plain).toContain('附件：');
    expectNoPlaceholder(empty.plain);

    const xml = readDocumentXml(template);
    expect((xml.match(/<w:tbl>/g) || []).length).toBe(1);
    expect(xml).toContain('索引号：');
    expect(xml).toContain('附件：{attachmentCount}');
  });
});

describe('P3-18 审核、复核、审理、封皮与会议纪要占位符', () => {
  const cases: Array<{
    template: string;
    keys: string[];
    data: Record<string, string>;
    expected: string[];
  }> = [
    {
      template: '22审核意见书',
      keys: ['auditUnit', 'projectName', 'reviewDate', 'reviewOpinion', 'reviewerName'],
      data: {
        projectName: '项目甲', auditUnit: '单位甲', reviewOpinion: '审核通过。',
        reviewerName: '王五', reviewDate: '2026年10月22日',
      },
      expected: ['项目甲', '单位甲', '审核通过。', '签名：王五', '2026年10月22日'],
    },
    {
      template: '23复核意见书',
      keys: ['auditUnit', 'projectName', 'reviewDate', 'reviewOpinion', 'reviewerName'],
      data: {
        projectName: '项目甲', auditUnit: '单位甲', reviewOpinion: '复核通过。',
        reviewerName: '赵六', reviewDate: '2026年10月22日',
      },
      expected: ['复核通过。', '复核人员签名：赵六', '2026年10月22日'],
    },
    {
      template: '24审理意见书',
      keys: ['adjudicationDate', 'adjudicationOpinion', 'adjudicatorName', 'auditedUnit', 'projectName'],
      data: {
        projectName: '项目甲', auditedUnit: '单位甲', adjudicationOpinion: '审理同意。',
        adjudicatorName: '钱七', adjudicationDate: '2026年10月22日',
      },
      expected: ['审理同意。', '钱七', '2026年10月22日'],
    },
    {
      template: '25代拟稿封皮',
      keys: [
        'auditedUnit', 'authorName', 'draftDate', 'projectName',
        'remarks', 'reportTitle', 'reviewerName', 'version',
      ],
      data: {
        projectName: '项目甲', auditedUnit: '单位甲', reportTitle: '专项审计报告',
        authorName: '孙八', reviewerName: '周九', draftDate: '2026年10月22日',
        version: 'V1.0', remarks: '内部审阅',
      },
      expected: [
        '专项审计报告', '拟稿人：孙八', '审核人：周九',
        '拟稿日期：2026年10月22日', '版本号：V1.0', '备注：内部审阅',
      ],
    },
    {
      template: '26审理会议纪要',
      keys: [
        'attendees', 'auditedUnit', 'meetingConclusion', 'meetingContent',
        'meetingDate', 'meetingLocation', 'projectName', 'recorderName',
      ],
      data: {
        projectName: '项目甲', auditedUnit: '单位甲', meetingDate: '2026年10月22日',
        meetingLocation: '三楼会议室', attendees: '张三、李四',
        meetingContent: '听取汇报。', meetingConclusion: '原则通过。', recorderName: '王五',
      },
      expected: [
        '2026年10月22日', '三楼会议室', '项目甲', '单位甲', '张三、李四',
        '会议内容：听取汇报。', '会议结论：原则通过。', '王五',
      ],
    },
  ];

  it.each(cases)('$template 占位符与表单字段一致且渲染完整', ({ template, keys, data, expected }) => {
    expect(extractPlaceholders(template)).toEqual(keys.slice().sort());
    const rendered = renderTemplate(template, data);
    for (const text of expected) {
      expect(rendered.plain).toContain(text);
    }
    expectNoPlaceholder(rendered.plain);

    const empty = renderTemplate(template, emptyData(keys));
    expectNoPlaceholder(empty.plain);
  });

  it('审核意见位于“审 核 意 见”标题之后、“审 核 内 容”之前', () => {
    const rendered = renderTemplate('22审核意见书', cases[0].data);
    const header = rendered.plain.indexOf('审  核  意  见');
    const opinion = rendered.plain.indexOf('审核通过。');
    const content = rendered.plain.indexOf('审  核  内  容');
    expect(header).toBeGreaterThan(-1);
    expect(header).toBeLessThan(opinion);
    expect(opinion).toBeLessThan(content);
  });

  it('会议纪要项目名称不再占用主持人单元格，改为审计项目行', () => {
    const xml = readDocumentXml('26审理会议纪要');
    const hostIndex = xml.indexOf('w14:paraId="564B046C"');
    const hostEnd = xml.indexOf('</w:p>', hostIndex);
    expect(xml.slice(hostIndex, hostEnd)).not.toContain('{projectName}');

    const unitIndex = xml.indexOf('w14:paraId="77F31021"');
    const unitParagraph = xml.slice(unitIndex, xml.indexOf('</w:p>', unitIndex));
    expect(unitParagraph).toContain('{auditedUnit}');
    const unitStart = xml.lastIndexOf('<w:p ', unitIndex);
    const projectStart = xml.lastIndexOf('<w:p ', unitStart - 1);
    const projectParagraph = xml.slice(projectStart, unitStart);
    expect(projectParagraph).toContain('{projectName}');
    expect(projectParagraph).toContain('w:ascii="仿宋"');
    expect(projectParagraph).toContain('<w:b/>');
  });
});

describe('P3-19 经济责任审计公示审计期间', () => {
  const template = '05经济责任审计公示';
  const expectedKeys = [
    'announcementEndDate', 'announcementStartDate', 'auditPeriod', 'auditStartDate',
    'auditedLeaderName', 'auditedLeaderPosition', 'auditedLeaderUnit',
    'contactAddress', 'contactPhone', 'content', 'projectName', 'text',
  ];

  it('模板包含审计期间占位符，且与公示期间同段渲染', () => {
    expect(extractPlaceholders(template)).toEqual(expectedKeys.slice().sort());
    const xml = readDocumentXml(template);
    expect(xml).toContain('审计期间：{auditPeriod}');
  });

  it('审计期间渲染在公示期间之前，空值不残留占位符', () => {
    const data: Record<string, string> = {};
    for (const key of expectedKeys) data[key] = `测试${key}`;
    data.auditPeriod = '2023年至2025年';
    data.announcementStartDate = '2026年10月1日';
    data.announcementEndDate = '2026年10月15日';

    const rendered = renderTemplate(template, data);
    expect(rendered.plain).toContain('审计期间：2023年至2025年');
    expect(rendered.plain).toContain('公示期间：2026年10月1日至2026年10月15日');
    expect(rendered.plain.indexOf('审计期间：')).toBeLessThan(
      rendered.plain.indexOf('公示期间：')
    );
    expectNoPlaceholder(rendered.plain);

    const empty = renderTemplate(template, emptyData(expectedKeys));
    expect(empty.plain).toContain('审计期间：');
    expect(empty.plain).toContain('公示期间：');
    expectNoPlaceholder(empty.plain);
  });
});

describe('P3-20 通知书审计委员会办公室条件段落', () => {
  const template = '01经济责任审计通知书';
  const baseData: Record<string, string> = {
    documentNumber: '文号',
    auditedUnit: '单位甲',
    auditedLeaderUnit: '单位甲',
    auditedLeaderName: '张三',
    auditedLeaderPosition: '局长',
    auditStartDate: '2026年10月1日',
    teamLeader: '李四',
    teamDeputyLeader: '王五',
    teamMembers: '赵六',
    issueDate: '2026年10月22日',
    issuingOrg: '科右前旗审计局',
    ccUnit: '相关单位',
    content: '审计八不准',
    text: '正文',
    auditOrg: '科右前旗审计局',
  };

  it('条件标签跨段生效，落款段落样式保持 pStyle 5', () => {
    const xml = readDocumentXml(template);
    expect(xml).toContain('附件：{content}{#auditCommitteeOffice}</w:t>');
    expect(xml).toContain('{auditCommitteeOffice}</w:t>');
    expect(xml).toContain('{/auditCommitteeOffice}</w:t>');

    const officeIndex = xml.indexOf('<w:t>{auditCommitteeOffice}</w:t>');
    const paragraphStart = xml.lastIndexOf('<w:p ', officeIndex);
    const paragraph = xml.slice(paragraphStart, xml.indexOf('</w:p>', officeIndex));
    expect(paragraph).toContain('<w:pStyle w:val="5"/>');
    expect(paragraph).toContain('w:firstLine="5814"');
  });

  it('办公室为空时签名上方不再保留空段落', () => {
    const empty = renderTemplate(template, { ...baseData, auditCommitteeOffice: '' });
    expect(empty.plain).not.toContain('中共科右前旗审计委员会办公室');
    const orgIndex = empty.paragraphs.findIndex(p => p.id === '42294FBF');
    expect(orgIndex).toBeGreaterThan(0);
    expect(empty.paragraphs[orgIndex].text).toBe('科右前旗审计局');
    expect(empty.paragraphs[orgIndex - 1].text.trim()).toBe('附件：审计八不准');
    expectNoPlaceholder(empty.plain);
  });

  it('办公室有值时保留原有两个空行与办公室落款', () => {
    const filled = renderTemplate(template, {
      ...baseData,
      auditCommitteeOffice: '中共科右前旗审计委员会办公室',
    });
    const orgIndex = filled.paragraphs.findIndex(p => p.id === '42294FBF');
    expect(orgIndex).toBeGreaterThan(2);
    expect(filled.paragraphs[orgIndex - 1].text).toBe('中共科右前旗审计委员会办公室');
    expect(filled.paragraphs[orgIndex - 2].text.trim()).toBe('');
    expect(filled.paragraphs[orgIndex - 3].text.trim()).toBe('');

    const empty = renderTemplate(template, { ...baseData, auditCommitteeOffice: '' });
    // 有值时存在两个空行 + 办公室落款段；为空时这三个段落全部移除
    expect(filled.paragraphs.length - empty.paragraphs.length).toBe(3);
    expectNoPlaceholder(filled.plain);
  });
});

describe('P3-21 预算执行对外报告用户正文', () => {
  const template = '27预算执行对外报告';
  const expectedKeys = [
    'auditedUnit', 'issueOrg', 'issuerSignature', 'projectName',
    'reportContent', 'reportDate', 'reportNumber',
  ];

  it('模板删除静态掩码正文，仅保留元数据、用户正文与落款', () => {
    expect(extractPlaceholders(template)).toEqual(expectedKeys.slice().sort());
    const xml = readDocumentXml(template);
    expect(xml).not.toContain('**年**月');
    expect(xml).not.toContain('****');
    expect(xml).not.toContain('本次审计发现的问题中');
    expect(xml).not.toContain('请在收到本报告之日起');
    expect(xml).not.toContain('科右前旗审计局');
  });

  it('正文完全由表单内容生成，顺序为元数据、正文、落款', () => {
    const rendered = renderTemplate(template, {
      reportNumber: '审报〔2026〕1号',
      auditedUnit: '测试单位',
      projectName: '测试项目',
      reportContent: '一、基本情况\n用户撰写正文\n二、审计发现',
      issueOrg: '测试旗审计局',
      issuerSignature: '王五',
      reportDate: '2026年10月22日',
    });
    expect(rendered.plain).toContain('用户撰写正文');
    expect(rendered.plain).not.toContain('**');
    expect(rendered.plain).not.toContain('本次审计发现的问题中');
    expect(rendered.plain).not.toContain('请在收到本报告之日起');
    expect(rendered.plain.indexOf('测试项目')).toBeLessThan(
      rendered.plain.indexOf('用户撰写正文')
    );
    expect(rendered.plain.indexOf('用户撰写正文')).toBeLessThan(
      rendered.plain.indexOf('测试旗审计局')
    );
    expectNoPlaceholder(rendered.plain);
  });

  it('空值渲染保留标签与落款结构，不残留静态掩码或占位符', () => {
    const empty = renderTemplate(template, emptyData(expectedKeys));
    expect(empty.plain).toContain('被审计单位：');
    expect(empty.plain).toContain('审计项目：');
    expect(empty.plain).not.toContain('**');
    expect(empty.plain).not.toContain('本次审计发现的问题中');
    expectNoPlaceholder(empty.plain);
  });
});
