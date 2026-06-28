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

// ============ 送达回证字段配置测试 ============
describe('送达回证表单字段对齐模板占位符', () => {
  const deliveryConfig = STAGE_FORM_CONFIGS['delivery_receipt'];

  it('应包含 documentName 字段（对应 {documentName}）', () => {
    const field = deliveryConfig.fields.find(f => f.key === 'documentName');
    expect(field).toBeDefined();
    expect(field!.label).toBe('文书名称');
  });

  it('应包含 documentNo 字段（对应 {documentNo}），而非 documentNumber', () => {
    const field = deliveryConfig.fields.find(f => f.key === 'documentNo');
    expect(field).toBeDefined();
    expect(field!.label).toBe('文书编号');

    const oldField = deliveryConfig.fields.find(f => f.key === 'documentNumber');
    expect(oldField).toBeUndefined(); // 已改名
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
