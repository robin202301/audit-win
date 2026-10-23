/**
 * 测试：审计取证单模板占位符渲染（真实 docxtemplater 管线）
 * 验证「审计事项摘要」内容能渲染到模板「审计（调查）事项摘要」栏，
 * 摘要为空时不残留占位符、版式结构不破坏。
 * 注：摘要栏原有固定说明文字（"1.对已有明确定性的问题…"）已在 WPS 编辑中
 * 被移除，模板摘要栏现仅含 {matterSummary} 占位符。
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

const TEMPLATE_PATH = path.join(process.cwd(), 'resources/templates/14审计取证单.docx');

function renderTemplate(data: Record<string, string>): string {
  const content = fs.readFileSync(TEMPLATE_PATH, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  const outBuf = doc.getZip().generate({ type: 'nodebuffer' });
  const tmpFile = path.join(os.tmpdir(), `evidence-test-${Date.now()}.docx`);
  fs.writeFileSync(tmpFile, outBuf as Buffer);

  // 读取渲染结果纯文本
  const outZip = new PizZip(fs.readFileSync(tmpFile));
  const xml = outZip
    .file('word/document.xml')!
    .asText();
  const plain = xml.replace(/<[^>]+>/g, '');
  fs.unlinkSync(tmpFile);
  return plain;
}

describe('审计取证单模板渲染', () => {
  const baseData = {
    projectName: '测试项目',
    auditedUnit: '测试单位',
    auditedItems: '1. 测试事项',
  };

  it('摘要内容应渲染到摘要栏', () => {
    const plain = renderTemplate({ ...baseData, matterSummary: '本次审计事项摘要内容' });
    expect(plain).toContain('本次审计事项摘要内容');
  });

  it('摘要为空时不残留 {matterSummary} 占位符', () => {
    const plain = renderTemplate({ ...baseData, matterSummary: '' });
    expect(plain).not.toContain('{matterSummary}');
  });

  it('编号应渲染到编号栏，为空时不残留占位符', () => {
    const plain = renderTemplate({ ...baseData, matterSummary: '摘要', serialNumber: 'AQ-2026-001' });
    expect(plain).toContain('AQ-2026-001');

    const empty = renderTemplate({ ...baseData, matterSummary: '摘要', serialNumber: '' });
    expect(empty).not.toContain('{serialNumber}');
  });

  it('其他占位符（事项列表、项目名称、被审计单位）渲染正常', () => {
    const plain = renderTemplate({ ...baseData, matterSummary: '摘要' });
    expect(plain).toContain('测试项目');
    expect(plain).toContain('测试单位');
    expect(plain).toContain('1. 测试事项');
  });
});
