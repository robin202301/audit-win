/**
 * 测试：阶段表单纯函数工具
 * 1. pickImportableFields —— 前序步骤导入（含 exclude 排除与 importMap 键名映射）
 * 2. composeDeliveryReceiptFields —— 送达回证文书名称与编号拼接
 * 3. mergeImportChainData —— 导出时补充模板专属占位符数据
 */
import { describe, it, expect, vi } from 'vitest';
import {
  pickImportableFields,
  composeDeliveryReceiptFields,
  mergeImportChainData,
  computeMergeExcludedKeys,
  resolveEditorInitialContent,
  formatDateToChinese,
  getExportButtonState,
  importTabDataFromStages,
} from '../formDataUtils';

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

describe('resolveEditorInitialContent 模板型步骤初始内容', () => {
  it('配置了默认正文时优先使用默认正文，不显示模板静态标题', () => {
    const result = resolveEditorInitialContent('标题\n{content}\n落款', '默认正文');
    expect(result).toBe('默认正文');
  });

  it('默认正文为空白串时回退模板文本', () => {
    const result = resolveEditorInitialContent('标题\n{content}\n落款', '   ');
    expect(result).toBe('标题\n\n落款');
  });

  it('未配置默认正文时回退模板文本，并移除 {content} 占位符本身', () => {
    const result = resolveEditorInitialContent('标题\n{content}\n落款');
    expect(result).toBe('标题\n\n落款');
    expect(result).not.toContain('{content}');
  });

  it('模板为空且无默认正文时返回空串', () => {
    expect(resolveEditorInitialContent('')).toBe('');
  });

  it('模板文本为空串时不会残留占位符', () => {
    expect(resolveEditorInitialContent('{content}', '')).toBe('');
  });
});

describe('getExportButtonState 导出按钮状态', () => {
  it('有模板时按钮可用且无提示', () => {
    expect(getExportButtonState('15述职报告提纲')).toEqual({ disabled: false, hint: '' });
  });

  it('无模板时按钮置灰并给出中文说明', () => {
    const state = getExportButtonState(undefined, '该步骤');
    expect(state.disabled).toBe(true);
    expect(state.hint).toContain('该步骤暂无导出模板');
    expect(state.hint).toContain('仅在本系统中保存');
  });

  it('空白模板名按无模板处理', () => {
    expect(getExportButtonState('   ').disabled).toBe(true);
    expect(getExportButtonState(null).disabled).toBe(true);
  });

  it('支持自定义作用域文案（页签）', () => {
    const state = getExportButtonState(undefined, '「民主测评」页签');
    expect(state.hint).toContain('「民主测评」页签暂无导出模板');
  });
});

describe('importTabDataFromStages 页签级前序导入', () => {
  const tabs = [
    {
      key: 'transcript',
      fields: [{ key: 'projectName' }, { key: 'auditOrg' }],
      importFrom: ['notice'],
    },
    {
      key: 'outline',
      fields: [{ key: 'reporterName' }, { key: 'unitName' }, { key: 'positionTitle' }],
      importFrom: ['notice'],
      importMap: {
        reporterName: 'auditedLeaderName',
        unitName: 'auditedLeaderUnit',
        positionTitle: 'auditedLeaderPosition',
      },
    },
    {
      key: 'assessment',
      fields: [],
      importFrom: ['notice'],
    },
    {
      key: 'manual',
      fields: [{ key: 'remark' }],
    },
  ];

  const noticeStage = {
    stage: 'notice',
    dataJson: JSON.stringify({
      projectName: '通知书项目',
      auditOrg: '科右前旗审计局',
      auditedLeaderName: '张三',
      auditedLeaderUnit: '旗财政局',
      auditedLeaderPosition: '局长',
      text: '配合联系人',
    }),
  };

  it('只处理声明了 importFrom 的页签，同名映射与键名映射均生效', () => {
    const result = importTabDataFromStages(tabs, {}, [noticeStage]);
    expect(result.tabData.transcript).toEqual({
      projectName: '通知书项目',
      auditOrg: '科右前旗审计局',
    });
    expect(result.tabData.outline).toEqual({
      reporterName: '张三',
      unitName: '旗财政局',
      positionTitle: '局长',
    });
    // 未声明 importFrom 的页签保持原样
    expect(result.tabData.manual).toEqual({ remark: '' });
    expect(result.importedCount).toBe(5);
  });

  it('已填写字段不被覆盖，空值不导入', () => {
    const current = {
      transcript: { projectName: '手工项目', auditOrg: '' },
      outline: { reporterName: '', unitName: '已有单位', positionTitle: '' },
      assessment: {},
      manual: { remark: '备注' },
    };
    const stage = {
      stage: 'notice',
      dataJson: JSON.stringify({
        projectName: '通知书项目',
        auditOrg: '科右前旗审计局',
        auditedLeaderName: '张三',
        auditedLeaderUnit: '旗财政局',
        auditedLeaderPosition: '',
      }),
    };
    const result = importTabDataFromStages(tabs, current, [stage]);
    expect(result.tabData.transcript.projectName).toBe('手工项目');
    expect(result.tabData.transcript.auditOrg).toBe('科右前旗审计局');
    expect(result.tabData.outline.reporterName).toBe('张三');
    expect(result.tabData.outline.unitName).toBe('已有单位');
    expect(result.tabData.outline.positionTitle).toBe('');
    expect(result.tabData.manual.remark).toBe('备注');
  });

  it('importExclude 阻止不同语义同名字段串值', () => {
    const excludedTabs = [
      {
        key: 'transcript',
        fields: [{ key: 'text' }, { key: 'projectName' }],
        importFrom: ['notice'],
        importExclude: ['text'],
      },
    ];
    const result = importTabDataFromStages(excludedTabs, {}, [noticeStage]);
    expect(result.tabData.transcript.text).toBe('');
    expect(result.tabData.transcript.projectName).toBe('通知书项目');
  });

  it('采集通知书字段快照供纯导出页签引用', () => {
    const result = importTabDataFromStages(tabs, {}, [noticeStage]);
    expect(result.noticeFields.auditedLeaderName).toBe('张三');
    expect(result.noticeFields.auditOrg).toBe('科右前旗审计局');
    // 纯导出页签没有表单字段，不导入值但快照仍可用
    expect(result.tabData.assessment).toEqual({});
  });

  it('前序步骤缺失或数据为空时安全返回原数据', () => {
    const result = importTabDataFromStages(tabs, {}, [{ stage: 'notice', dataJson: '{}' }]);
    expect(result.importedCount).toBe(0);
    expect(result.noticeFields).toEqual({});
    expect(result.tabData.transcript).toEqual({ projectName: '', auditOrg: '' });
  });

  it('单条前序数据损坏时记录日志且不阻塞其他来源', () => {
    const multiSourceTabs = [
      {
        key: 'transcript',
        fields: [{ key: 'projectName' }],
        importFrom: ['plan', 'notice'],
      },
    ];
    const stages = [
      { stage: 'plan', dataJson: '{不是合法 JSON' },
      { stage: 'notice', dataJson: JSON.stringify({ projectName: '通知书项目' }) },
    ];
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const result = importTabDataFromStages(multiSourceTabs, {}, stages);
      expect(result.tabData.transcript.projectName).toBe('通知书项目');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('解析前序步骤 plan 的已保存数据失败'),
        expect.anything()
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('非通知书来源不写入通知书快照', () => {
    const planTabs = [
      {
        key: 'transcript',
        fields: [{ key: 'teamLeader' }],
        importFrom: ['plan'],
      },
    ];
    const result = importTabDataFromStages(planTabs, {}, [
      { stage: 'plan', dataJson: JSON.stringify({ teamLeader: '李四' }) },
    ]);
    expect(result.tabData.transcript.teamLeader).toBe('李四');
    expect(result.noticeFields).toEqual({});
  });
});

describe('formatDateToChinese 日期格式化', () => {
  it('ISO 日期转换为中文年月日', () => {
    expect(formatDateToChinese('2026-10-22')).toBe('2026年10月22日');
  });

  it('空值返回空串', () => {
    expect(formatDateToChinese('')).toBe('');
  });

  it('无法解析的日期原样返回', () => {
    expect(formatDateToChinese('不是日期')).toBe('不是日期');
  });
});
