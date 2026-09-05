/**
 * 测试：阶段表单纯函数工具
 * 1. pickImportableFields —— 前序步骤导入（含 exclude 排除与 importMap 键名映射）
 * 2. composeDeliveryReceiptFields —— 送达回证文书名称与编号拼接
 * 3. mergeImportChainData —— 导出时补充模板专属占位符数据
 */
import { describe, it, expect } from 'vitest';
import { pickImportableFields, composeDeliveryReceiptFields, mergeImportChainData, computeMergeExcludedKeys } from '../formDataUtils';

describe('pickImportableFields 前序数据导入', () => {
  it('导入目标存在且为空的同名字段', () => {
    const parsed = { auditedLeaderName: '张三', auditStartDate: '2026-01-01' };
    const target = { auditedLeaderName: '', auditStartDate: '', projectName: '项目A' };
    const picked = pickImportableFields(parsed, target);
    expect(picked).toEqual({ auditedLeaderName: '张三', auditStartDate: '2026-01-01' });
  });

  it('跳过目标已填写的字段（不覆盖用户输入）', () => {
    const parsed = { auditedLeaderName: '张三' };
    const target = { auditedLeaderName: '李四' };
    expect(pickImportableFields(parsed, target)).toEqual({});
  });

  it('跳过源值为空的字段', () => {
    const parsed = { auditedLeaderName: '', auditStartDate: '2026-01-01' };
    const target = { auditedLeaderName: '', auditStartDate: '' };
    expect(pickImportableFields(parsed, target)).toEqual({ auditStartDate: '2026-01-01' });
  });

  it('跳过目标不存在的字段', () => {
    const parsed = { documentNumber: 'X号', ccUnit: '抄送单位' };
    const target = { documentNo: '' };
    expect(pickImportableFields(parsed, target)).toEqual({});
  });

  it('exclude 中的字段一律不导入（通知书 text 不得串入公示 text）', () => {
    const parsed = {
      auditedLeaderName: '张三',
      text: '单位财务负责人或联络人姓名',
      auditStartDate: '2026-01-01',
    };
    const target = { auditedLeaderName: '', text: '', auditStartDate: '' };
    const picked = pickImportableFields(parsed, target, ['text']);
    expect(picked).toEqual({ auditedLeaderName: '张三', auditStartDate: '2026-01-01' });
    expect(picked.text).toBeUndefined();
  });

  it('exclude 为空数组时行为与原逻辑一致', () => {
    const parsed = { text: '配合联系人' };
    const target = { text: '' };
    expect(pickImportableFields(parsed, target)).toEqual({ text: '配合联系人' });
  });
});

describe('composeDeliveryReceiptFields 送达回证字段拼接', () => {
  it('名称+编号 → 编号以（编号）拼接，放在 documentNumber 占位符中', () => {
    const result = composeDeliveryReceiptFields('审计通知书', '审（委）办经责通〔2024〕1号');
    expect(result).toEqual({
      documentName: '审计通知书',
      documentNumber: '（审（委）办经责通〔2024〕1号）',
    });
  });

  it('仅有名称 → 编号为空', () => {
    const result = composeDeliveryReceiptFields('审计通知书', '');
    expect(result).toEqual({ documentName: '审计通知书', documentNumber: '' });
  });

  it('仅有编号 → 编号直接显示', () => {
    const result = composeDeliveryReceiptFields('', '审（委）办经责通〔2024〕1号');
    expect(result).toEqual({ documentName: '', documentNumber: '审（委）办经责通〔2024〕1号' });
  });

  it('均为空 → 全部为空', () => {
    const result = composeDeliveryReceiptFields('', '');
    expect(result).toEqual({ documentName: '', documentNumber: '' });
  });

  it('去除首尾空白后再拼接', () => {
    const result = composeDeliveryReceiptFields('  审计通知书  ', ' 审（委）办经责通〔2024〕1号 ');
    expect(result).toEqual({
      documentName: '审计通知书',
      documentNumber: '（审（委）办经责通〔2024〕1号）',
    });
  });
});

describe('pickImportableFields 键名映射（importMap）', () => {
  it('映射导入不同键名字段（方案开始日期 ← 通知书审计开始日期）', () => {
    const parsed = { auditStartDate: '2026-01-05' };
    const target = { startDate: '', teamLeader: '王五' };
    const picked = pickImportableFields(parsed, target, [], { startDate: 'auditStartDate' });
    expect(picked).toEqual({ startDate: '2026-01-05' });
  });

  it('映射字段目标已填写时不覆盖', () => {
    const parsed = { auditStartDate: '2026-01-05' };
    const target = { startDate: '2026-02-01' };
    expect(pickImportableFields(parsed, target, [], { startDate: 'auditStartDate' })).toEqual({});
  });

  it('映射与同名导入并存（同名优先于映射写入结果）', () => {
    const parsed = { auditStartDate: '2026-01-05', startDate: '2026-03-03' };
    const target = { startDate: '' };
    const picked = pickImportableFields(parsed, target, [], { startDate: 'auditStartDate' });
    // 同名 startDate 存在时覆盖映射结果
    expect(picked).toEqual({ startDate: '2026-03-03' });
  });

  it('映射目标键在 exclude 中时跳过', () => {
    const parsed = { documentNumber: '通〔2024〕1号' };
    const target = { documentNumber: '' };
    expect(pickImportableFields(parsed, target, ['documentNumber'], {})).toEqual({});
  });
});

describe('mergeImportChainData 导出数据补充', () => {
  it('仅填充导出数据中不存在的键', () => {
    const exportData: Record<string, string> = { projectName: '项目A', auditedUnit: '' };
    const parsed = { auditOrg: '科右前旗审计局', auditStartDate: '2026年1月5日', projectName: '通知书项目名' };
    mergeImportChainData(exportData, parsed);
    expect(exportData.auditOrg).toBe('科右前旗审计局');
    expect(exportData.auditStartDate).toBe('2026年1月5日');
    // 已有键（即使为空串）不被覆盖
    expect(exportData.projectName).toBe('项目A');
    expect(exportData.auditedUnit).toBe('');
  });

  it('excludedKeys 中的键不参与合并（其余照常补入）', () => {
    const exportData: Record<string, string> = {};
    const parsed = { documentNumber: '报〔2026〕3号', auditOrg: '科右前旗审计局' };
    mergeImportChainData(exportData, parsed, ['documentNumber']);
    expect(exportData.documentNumber).toBeUndefined();
    expect(exportData.auditOrg).toBe('科右前旗审计局');
  });
});

describe('computeMergeExcludedKeys 文号来源防抢先', () => {
  it('征求意见书：非通知书来源排除 documentNumber（报告"报"字号不得抢先）', () => {
    expect(computeMergeExcludedKeys('report_consultation', 'report')).toEqual(['documentNumber']);
    expect(computeMergeExcludedKeys('report_consultation', 'external_report')).toEqual(['documentNumber']);
  });

  it('征求意见书：通知书来源不排除（"通"字号为准）', () => {
    expect(computeMergeExcludedKeys('report_consultation', 'notice')).toEqual([]);
  });

  it('其他步骤不排除任何键', () => {
    expect(computeMergeExcludedKeys('audit_opinion', 'report_consultation')).toEqual([]);
    expect(computeMergeExcludedKeys('report', 'notice')).toEqual([]);
  });
});
