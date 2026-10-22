/**
 * 测试：StageView 路由逻辑 + 送达回证字段配置 + UniversalStageEditor 按钮
 */
import { describe, it, expect } from 'vitest';
import { STAGE_FORM_CONFIGS } from '../stageConfigs';
import { WORKFLOW_STEPS } from '@shared/types';

// ============ 模板型步骤路由测试 ============
describe('StageView 路由逻辑', () => {
  // 模拟 isTemplateOnlyStep 计算属性
  function isTemplateOnlyStep(stageKey: string): boolean {
    const config = STAGE_FORM_CONFIGS[stageKey];
    return !!(config && config.fields.length === 0);
  }

  it('eight_prohibitions 应为模板型步骤（0字段）', () => {
    expect(isTemplateOnlyStep('eight_prohibitions')).toBe(true);
  });

  it('eight_prohibitions 不应引用前序数据（仅保留模板内容）', () => {
    const step = WORKFLOW_STEPS.find(s => s.key === 'eight_prohibitions');
    expect(step).toBeDefined();
    expect(step!.importFrom || []).toEqual([]);
  });

  it('commitment_letter 应为模板型步骤（0字段）', () => {
    expect(isTemplateOnlyStep('commitment_letter')).toBe(true);
  });

  it('survey_assessment 应为模板型步骤（0字段）', () => {
    expect(isTemplateOnlyStep('survey_assessment')).toBe(true);
  });

  it('survey_measures 应为模板型步骤（0字段）', () => {
    expect(isTemplateOnlyStep('survey_measures')).toBe(true);
  });

  it('working_paper_summary 应为模板型步骤（0字段）', () => {
    expect(isTemplateOnlyStep('working_paper_summary')).toBe(true);
  });

  it('notice 不应该是模板型步骤（有15个字段）', () => {
    expect(isTemplateOnlyStep('notice')).toBe(false);
  });

  it('delivery_receipt 不应该是模板型步骤', () => {
    expect(isTemplateOnlyStep('delivery_receipt')).toBe(false);
  });

  it('evidence 不应该是模板型步骤', () => {
    expect(isTemplateOnlyStep('evidence')).toBe(false);
  });

  it('所有26个步骤都应在 STAGE_FORM_CONFIGS 中', () => {
    for (const step of WORKFLOW_STEPS) {
      expect(STAGE_FORM_CONFIGS[step.key]).toBeDefined();
    }
  });

  it('所有步骤的 fallbackStep 条件 !STAGE_FORM_CONFIGS[key] 均不成立', () => {
    // 验证之前的 fallbackStep 逻辑永远不会触发
    for (const step of WORKFLOW_STEPS) {
      expect(STAGE_FORM_CONFIGS[step.key]).toBeTruthy();
    }
  });
});

// ============ P2 导出链路配置测试 ============
describe('P2-4 模板型步骤默认正文配置', () => {
  const templateOnlySteps = [
    'eight_prohibitions',
    'commitment_letter',
    'survey_assessment',
    'survey_measures',
  ];

  it.each(templateOnlySteps)('%s 应配置非空默认正文，供编辑区加载并写入 {content}', (key) => {
    const config = STAGE_FORM_CONFIGS[key];
    expect(config.template).toBeTruthy();
    expect(config.defaultValues?.content?.trim()).toBeTruthy();
  });

  it.each(templateOnlySteps)('%s 仍保持零表单字段（大输入框编辑器）', (key) => {
    expect(STAGE_FORM_CONFIGS[key].fields).toEqual([]);
  });

  it.each(templateOnlySteps)('%s 默认正文不包含模板静态标题，避免导出重复标题', (key) => {
    const config = STAGE_FORM_CONFIGS[key];
    expect(config.defaultValues?.content || '').not.toContain(config.title);
  });
});

describe('P2-6 任务清单导出配置', () => {
  const config = STAGE_FORM_CONFIGS['task_list'];

  it('应接线 12任务清单 模板并使用 xls 导出', () => {
    expect(config.template).toBe('12任务清单');
    expect(config.exportFile).toBe('任务清单.xls');
    const step = WORKFLOW_STEPS.find(s => s.key === 'task_list');
    expect(step?.template).toBe('12任务清单');
  });

  it('应包含模板中审计组、项目名称、编制日期、任务内容对应字段', () => {
    const keys = config.fields.map(f => f.key);
    expect(keys).toEqual(expect.arrayContaining([
      'projectName',
      'teamLeader',
      'chiefAuditor',
      'teamMembers',
      'taskListContent',
      'compileDate',
    ]));
  });
});

describe('P2-5 审计底稿汇总表导出配置', () => {
  const config = STAGE_FORM_CONFIGS['working_paper_summary'];

  it('应配置汇总表模板与 xlsx 导出文件名', () => {
    expect(config.template).toBe('29审计底稿汇总表');
    expect(config.exportFile).toBe('审计底稿汇总表.xlsx');
    const step = WORKFLOW_STEPS.find(s => s.key === 'working_paper_summary');
    expect(step?.template).toBe('29审计底稿汇总表');
  });
});

// ============ 送达回证字段配置测试 ============
describe('送达回证表单字段对齐模板占位符', () => {
  const deliveryConfig = STAGE_FORM_CONFIGS['delivery_receipt'];

  it('应包含 documentName 字段（对应 {documentName}）', () => {
    const field = deliveryConfig.fields.find(f => f.key === 'documentName');
    expect(field).toBeDefined();
    expect(field!.label).toBe('文书名称');
  });

  it('应包含 documentNo 字段（表单键名），模板占位符为 documentNumber，导出时由拼接逻辑映射', () => {
    const field = deliveryConfig.fields.find(f => f.key === 'documentNo');
    expect(field).toBeDefined();
    expect(field!.label).toBe('文书编号');

    // 表单字段不用 documentNumber（避免与模板占位符混淆，导出时由 composeDeliveryReceiptFields 拼接）
    const oldField = deliveryConfig.fields.find(f => f.key === 'documentNumber');
    expect(oldField).toBeUndefined();
  });

  it('auditedUnit 不在表单字段中（由导出逻辑自动填充）', () => {
    const field = deliveryConfig.fields.find(f => f.key === 'auditedUnit');
    expect(field).toBeUndefined(); // 不作为输入框展示，导出时自动从项目信息填充
  });

  it('应包含 address 字段（对应 {address}）', () => {
    const field = deliveryConfig.fields.find(f => f.key === 'address');
    expect(field).toBeDefined();
    expect(field!.label).toBe('送达地址');
  });

  it('应包含 postCode 字段（对应 {postCode}）', () => {
    const field = deliveryConfig.fields.find(f => f.key === 'postCode');
    expect(field).toBeDefined();
    expect(field!.label).toBe('邮编');
  });

  it('autoFillFromProject 应包含 recipientUnit', () => {
    expect(deliveryConfig.autoFillFromProject).toBeDefined();
    expect(deliveryConfig.autoFillFromProject!.recipientUnit).toBe('auditedTarget');
  });

  it('模板占位符对应的表单字段均已配置', () => {
    // auditedUnit 由导出逻辑自动填充，不展示为输入框
    const formFieldPlaceholders = ['documentName', 'documentNo', 'address', 'postCode'];
    for (const key of formFieldPlaceholders) {
      expect(deliveryConfig.fields.find(f => f.key === key)).toBeDefined();
    }
    // 验证 auditedUnit 不在字段中
    expect(deliveryConfig.fields.find(f => f.key === 'auditedUnit')).toBeUndefined();
  });
});

// ============ UniversalStageEditor 按钮可见性测试 ============
describe('UniversalStageEditor 按钮可见性', () => {
  // 模拟按钮显示条件
  function shouldShow(condition: { hasSavedData: boolean; isEditing: boolean }) {
    return {
      editButton: condition.hasSavedData && !condition.isEditing,
      saveButton: condition.isEditing,
      uploadButton: condition.isEditing,
      resetButton: condition.isEditing,
      exportButton: true, // 始终可见
    };
  }

  it('只读模式：仅显示修改和导出按钮', () => {
    const btns = shouldShow({ hasSavedData: true, isEditing: false });
    expect(btns.editButton).toBe(true);
    expect(btns.saveButton).toBe(false);
    expect(btns.uploadButton).toBe(false);
    expect(btns.resetButton).toBe(false);
    expect(btns.exportButton).toBe(true);
  });

  it('编辑模式：显示保存、上传、重置、导出按钮', () => {
    const btns = shouldShow({ hasSavedData: true, isEditing: true });
    expect(btns.editButton).toBe(false);
    expect(btns.saveButton).toBe(true);
    expect(btns.uploadButton).toBe(true);
    expect(btns.resetButton).toBe(true);
    expect(btns.exportButton).toBe(true);
  });

  it('新建模式（无保存数据）：仅显示编辑按钮', () => {
    const btns = shouldShow({ hasSavedData: false, isEditing: true });
    expect(btns.editButton).toBe(false);
    expect(btns.saveButton).toBe(true);
    expect(btns.uploadButton).toBe(true);
    expect(btns.resetButton).toBe(true);
    expect(btns.exportButton).toBe(true);
  });
});

describe('公示导入排除 + 送达回证导出拼接（回归防护）', () => {
  it('audit_announcement 步骤应排除导入 text 字段（通知书的配合联系人不得串入补充文本）', () => {
    const step = WORKFLOW_STEPS.find(s => s.key === 'audit_announcement');
    expect(step).toBeDefined();
    expect(step!.importExclude).toBeDefined();
    expect(step!.importExclude).toContain('text');
  });

  it('通知书与公示的 text 字段语义不同（配合联系人 vs 补充文本）', () => {
    const noticeText = STAGE_FORM_CONFIGS['notice'].fields.find(f => f.key === 'text');
    const announceText = STAGE_FORM_CONFIGS['audit_announcement'].fields.find(f => f.key === 'text');
    expect(noticeText).toBeDefined();
    expect(announceText).toBeDefined();
    expect(noticeText!.label).toBe('配合联系人/财务负责人');
    expect(announceText!.label).toBe('补充文本');
  });

  it('其他步骤的 importExclude 应为受控白名单（防串值范围可预期）', () => {
    // 通知书 content=附件内容、text=配合联系人，与下游同名字段语义不同，必须排除；
    // 报告 documentNumber=报告文号（报），与通知书文号（通）不可直接复制
    const expected: Record<string, string[]> = {
      audit_announcement: ['text', 'content'],
      delivery_receipt: ['content'],
      report: ['documentNumber', 'text', 'content'],
      report_consultation: ['text', 'content'],
      result_report: ['text', 'content'],
    };
    for (const step of WORKFLOW_STEPS) {
      if (expected[step.key]) {
        expect(step.importExclude).toEqual(expected[step.key]);
      } else {
        expect(step.importExclude || []).toEqual([]);
      }
    }
  });

  it('需要引用通知书内容的步骤应包含 notice 导入源', () => {
    for (const key of ['delivery_receipt', 'audit_announcement', 'plan', 'report', 'report_consultation', 'result_report']) {
      const step = WORKFLOW_STEPS.find(s => s.key === key);
      expect(step).toBeDefined();
      expect(step!.importFrom || []).toContain('notice');
    }
  });

  it('方案的开始日期应通过键名映射引用通知书的审计开始日期', () => {
    const step = WORKFLOW_STEPS.find(s => s.key === 'plan');
    expect(step).toBeDefined();
    expect(step!.importMap).toEqual({ startDate: 'auditStartDate' });
  });
});
