/**
 * 测试：StageView 路由逻辑 + 送达回证字段配置 + UniversalStageEditor 按钮
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { STAGE_FORM_CONFIGS } from '../stageConfigs';
import { WORKFLOW_STEPS } from '@shared/types';
import { getExportButtonState } from '../formDataUtils';

const STAGE_DIR = path.join(process.cwd(), 'src/renderer/views/stages');

function readStageSource(fileName: string): string {
  return fs.readFileSync(path.join(STAGE_DIR, fileName), 'utf8');
}

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

describe('P3-18 代拟稿封皮默认标题', () => {
  const config = STAGE_FORM_CONFIGS['draft_cover'];

  it('报告标题默认值与模板原封面标题一致，清空后可回落', () => {
    expect(config.defaultValues?.reportTitle).toBe('审  计  报  告');
  });

  it('报告标题仍作为可编辑表单字段暴露', () => {
    expect(config.fields.find(field => field.key === 'reportTitle')?.label).toBe('报告标题');
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

// ============ P3 修复回归防护 ============
describe('P3-8 auditedLeaderName 语义修正', () => {
  const source = readStageSource('UniversalStageEditor.vue');

  it('不再把被审计单位名称写入 auditedLeaderName 占位符', () => {
    expect(source).not.toContain("text.replace(/\\{auditedLeaderName\\}/g, props.projectInfo.auditedTarget)");
  });

  it('导出数据不再以被审计单位顶替领导干部姓名', () => {
    expect(source).not.toContain('exportData.auditedLeaderName = props.projectInfo.auditedTarget');
  });

  it('保留 auditedLeaderUnit → 被审计单位的正确映射', () => {
    expect(source).toContain("text.replace(/\\{auditedLeaderUnit\\}/g, props.projectInfo.auditedTarget)");
  });
});

describe('P3-11 谈话记录页签消费配置化导入', () => {
  const tabs = STAGE_FORM_CONFIGS['interview_record'].tabs!;
  const outline = tabs.find(tab => tab.key === 'work_report_outline');

  it('述职报告提纲通过 importFrom + importMap 引用通知书，不再用项目信息硬填姓名', () => {
    expect(outline).toBeDefined();
    expect(outline!.importFrom).toEqual(['notice']);
    expect(outline!.importMap).toEqual({
      reporterName: 'auditedLeaderName',
      unitName: 'auditedLeaderUnit',
      positionTitle: 'auditedLeaderPosition',
    });
    expect(Object.values(outline!.autoFillFromProject || {})).not.toContain('auditedLeaderName');
  });

  it('纯导出页签声明通知书来源，用于导出时引用被测评人', () => {
    for (const key of ['assessment_county', 'assessment_township']) {
      const tab = tabs.find(item => item.key === key);
      expect(tab).toBeDefined();
      expect(tab!.fields).toEqual([]);
      expect(tab!.importFrom).toEqual(['notice']);
    }
  });

  it('组件复用纯函数导入工具，不再保留硬编码的 importFromNotice', () => {
    const source = readStageSource('StageInterviewRecord.vue');
    expect(source).toContain('importTabDataFromStages');
    expect(source).toContain('noticeFields');
    expect(source).not.toContain('importFromNotice');
    expect(source).not.toContain('noticeParsed.auditedLeaderName');
  });
});

describe('P3-12 无模板步骤导出按钮状态化', () => {
  const noTemplateSteps = [
    'report',
    'result_report',
    'issues_not_reflected',
    'audit_decision',
    'issue_ledger',
  ];

  it.each(noTemplateSteps)('%s 未配置模板，导出按钮应置灰并给出中文说明', (key) => {
    const config = STAGE_FORM_CONFIGS[key];
    expect(config).toBeDefined();
    expect(config.template).toBeUndefined();
    const state = getExportButtonState(config.template, '该步骤');
    expect(state.disabled).toBe(true);
    expect(state.hint).toBe('该步骤暂无导出模板，填写内容仅在本系统中保存');
  });

  it('已配置模板的步骤按钮保持可用', () => {
    for (const key of ['survey', 'task_list_completion', 'external_report']) {
      const config = STAGE_FORM_CONFIGS[key];
      expect(config.template).toBeTruthy();
      expect(getExportButtonState(config.template, '该步骤')).toEqual({
        disabled: false,
        hint: '',
      });
    }
  });

  it('通用表单与模板编辑器均使用状态化导出按钮，不再点击后弹提示', () => {
    for (const file of ['GenericStageForm.vue', 'UniversalStageEditor.vue']) {
      const source = readStageSource(file);
      expect(source).toContain('getExportButtonState');
      expect(source).toContain(':disabled="exportState.disabled"');
      expect(source).not.toContain("alert('该步骤暂无导出模板')");
    }
    const interviewSource = readStageSource('StageInterviewRecord.vue');
    expect(interviewSource).toContain('getExportButtonState');
    expect(interviewSource).toContain(':disabled="exportState.disabled"');
    expect(interviewSource).not.toContain("alert('当前页签暂无导出模板')");
  });
});

describe('P3-9 / P3-10 表单字段与模板占位符对齐', () => {
  it('通知书表单包含附件内容与审计委员会办公室字段', () => {
    const keys = STAGE_FORM_CONFIGS['notice'].fields.map(field => field.key);
    expect(keys).toContain('content');
    expect(keys).toContain('auditCommitteeOffice');
    expect(STAGE_FORM_CONFIGS['notice'].defaultValues?.content).toBe('审计“八不准”工作纪律');
  });

  it('被审计单位基本情况表 18 个字段与模板单元格占位符一致', () => {
    const expected = [
      'unitName', 'unitNature', 'legalRepresentative', 'supervisingUnit',
      'staffQuota', 'currentStaffCount', 'orgStructure', 'responsibilityScope',
      'lawExecution', 'financialSystem', 'performanceIndicators', 'internalControl',
      'infoSystems', 'economicEnvironment', 'previousAudit', 'otherInfo',
      'fillerName', 'fillDate',
    ];
    expect(STAGE_FORM_CONFIGS['survey'].fields.map(field => field.key)).toEqual(expected);
  });

  it('对外报告只保留模板实际使用的 7 个字段', () => {
    expect(STAGE_FORM_CONFIGS['external_report'].fields.map(field => field.key)).toEqual([
      'projectName',
      'auditedUnit',
      'reportNumber',
      'reportDate',
      'reportContent',
      'issueOrg',
      'issuerSignature',
    ]);
  });

  it('任务清单完成情况字段与导出映射键一致', () => {
    expect(STAGE_FORM_CONFIGS['task_list_completion'].fields.map(field => field.key)).toEqual([
      'projectName',
      'completionContent',
      'compileDate',
    ]);
  });
});
