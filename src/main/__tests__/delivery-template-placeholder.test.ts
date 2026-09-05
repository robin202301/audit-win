/**
 * 测试：审计文书送达回证模板占位符渲染（真实 docxtemplater 管线）
 * 验证模板中现有占位符（文书名称/编号/送达方式/受送达单位/送达日期）均正确渲染，
 * 可选字段为空时不残留 {xxx} 字样、版式固定文字保留。
 * 注：模板曾在 WPS 中被编辑移除了"备注"行，{address}/{postCode}/{content}
 * 占位符已不在模板中；表单仍收集这些字段，导出时由 docxtemplater 自动忽略。
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

const TEMPLATE_PATH = path.join(process.cwd(), 'resources/templates/06审计文书送达回证.docx');

function renderTemplate(data: Record<string, string>): string {
  const content = fs.readFileSync(TEMPLATE_PATH, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  const outBuf = doc.getZip().generate({ type: 'nodebuffer' });
  const tmpFile = path.join(os.tmpdir(), `delivery-test-${Date.now()}.docx`);
  fs.writeFileSync(tmpFile, outBuf as Buffer);

  const outZip = new PizZip(fs.readFileSync(tmpFile));
  const xml = outZip.file('word/document.xml')!.asText();
  const plain = xml.replace(/<[^>]+>/g, '');
  fs.unlinkSync(tmpFile);
  return plain;
}

describe('送达回证模板渲染', () => {
  // 与 GenericStageForm 导出逻辑一致：documentName/documentNumber 拼接后的数据；
  // 额外键（address/postCode/content/auditedUnit）为表单实际导出载荷，
  // 模板中已无对应占位符，docxtemplater 应忽略且不报错
  const fullData = {
    documentName: '审计通知书',
    documentNumber: '（审委办经责通〔2024〕1号）',
    auditedUnit: '科右前旗审计局',
    recipientUnit: '科右前旗财政局',
    deliveryMethod: '直接送达',
    deliveryDate: '2024年6月1日',
    address: '科右前旗党政综合楼',
    postCode: '137400',
    content: '备注内容测试文本',
  };

  it('模板现有占位符字段均渲染到对应位置', () => {
    const plain = renderTemplate(fullData);
    expect(plain).toContain('审计通知书');           // {documentName}
    expect(plain).toContain('（审委办经责通〔2024〕1号）'); // {documentNumber}
    expect(plain).toContain('科右前旗财政局');      // {recipientUnit}
    expect(plain).toContain('直接送达');            // {deliveryMethod}
    expect(plain).toContain('2024年6月1日');        // {deliveryDate}
  });

  it('可选字段为空时不残留占位符，版式固定文字保留', () => {
    const plain = renderTemplate({
      documentName: '',
      documentNumber: '',
      auditedUnit: '',
      recipientUnit: '',
      deliveryMethod: '',
      deliveryDate: '',
      address: '',
      postCode: '',
      content: '',
    });
    // 模板中存在的占位符在空值时不得残留 {xxx} 字样
    for (const key of ['documentName', 'documentNumber', 'recipientUnit', 'deliveryMethod', 'deliveryDate']) {
      expect(plain).not.toContain(`{${key}}`);
    }
    // 版式固定文字保留
    expect(plain).toContain('送达文书名称和文号');
    expect(plain).toContain('送件人及送件时间');
    expect(plain).toContain('受送达机关或者个人');
    expect(plain).toContain('送达方式');
    expect(plain).toContain('收件人及收件时间');
  });

  it('表单额外字段（模板已无占位符）不影响渲染，导出结果不含其内容', () => {
    // 送达地址/邮编/备注内容在模板"备注"行被移除后不再出现在导出文档中，
    // 渲染本身必须正常完成（不抛异常、不残留括号占位符）
    const plain = renderTemplate(fullData);
    expect(plain).not.toContain('科右前旗党政综合楼');
    expect(plain).not.toContain('137400');
    expect(plain).not.toContain('备注内容测试文本');
  });
});
