/**
 * 测试：各阶段步骤对「审计通知书」内容的引用链完整性（静态配置断言）
 *
 * 依据：
 * - 系统设计对照与更新.md 第「四、各页面关系」节与 9.8 节
 * - 通知书（notice）步骤实际保存的表单字段（stageConfigs.notice.fields）
 *   + autoFillFromProject 兜底（auditedUnit←auditedTarget、auditProject←name）
 *
 * 本文件锁定"引用通道配置存在"这一事实，防止后续重构时某一步骤
 * 丢失对通知书的引用（如删掉 importFrom/importMap/同名字段）。
 * 注意：本文件不锁死已知缺陷行为（如 autoFill 预占导致 notice 修正值
 * 无法同步的问题），该类问题请见缺陷文档。
 */
import { describe, it, expect } from 'vitest';
import { WORKFLOW_STEPS } from '@shared/types';
import { STAGE_FORM_CONFIGS } from '../stageConfigs';

/** 通知书步骤实际保存的关键字段（dataJson 键） */
const NOTICE_KEYS = [
  'auditCommitteeOffice', // 审计委员会办公室（仅经济责任审计显示）
  'auditOrg',             // 审计机关全称（默认值：科右前旗审计局）
  'documentNumber',       // 文号
  'auditedUnit',          // 被审计单位（autoFill←auditedTarget，用户可在通知书修正）
  'auditedLeaderName',    // 被审计领导干部姓名（仅经济责任审计）
  'auditedLeaderPosition',// 被审计领导干部职务（仅经济责任审计）
  'auditStartDate',       // 审计开始日期
  'auditYear',            // 审计年度（仅预算执行审计）
  'auditProject',         // 审计项目名称（仅专项审计调查显示；autoFill←name 恒有值）
  'teamLeader',           // 审计组组长
  'teamDeputyLeader',     // 副组长
  'teamMembers',          // 审计组成员
  'text',                 // 配合联系人/财务负责人（仅经济责任审计）
  'ccUnit',               // 抄送单位
  'issuingOrg',           // 印发机关
  'issueDate',            // 印发日期
  'content',              // 附件内容
] as const;

const step = (key: string) => {
  const s = WORKFLOW_STEPS.find(x => x.key === key);
  if (!s) throw new Error(`步骤不存在：${key}`);
  return s;
};

const fieldKeys = (config: { fields: Array<{ key: string }> }) => config.fields.map(f => f.key);

describe('通知书（notice）字段清单', () => {
  it('notice 表单字段均为 stageConfigs 已定义字段（保存键集合稳定）', () => {
    const noticeConfig = STAGE_FORM_CONFIGS['notice'];
    expect(noticeConfig).toBeDefined();
    for (const key of NOTICE_KEYS) {
      expect(fieldKeys(noticeConfig).includes(key), `notice 缺少字段 ${key}`).toBe(true);
    }
    // auditEndDate（审计结束/追溯日期）不存在于通知书表单 —— 下游步骤不可引用该键
    expect(fieldKeys(noticeConfig).includes('auditEndDate')).toBe(false);
  });

  it('notice autoFill 兜底：auditedUnit←auditedTarget、auditProject←name', () => {
    expect(STAGE_FORM_CONFIGS['notice'].autoFillFromProject).toEqual({
      auditedUnit: 'auditedTarget',
      auditProject: 'name',
    });
  });
});

describe('各步骤 → 通知书引用通道完整性', () => {
  /** 每步需要从通知书获得的关键内容及其在本步骤的接收字段/映射/兜底 */
  const expectedChannels: Record<string, Array<{ noticeKey: string; receiver: string; note?: string }>> = {
    delivery_receipt: [
      // 文号：组件加载已保存数据后自动填充 documentNo ← notice.documentNumber；导出时 composeDeliveryReceiptFields 拼接到 documentNumber
      { noticeKey: 'documentNumber', receiver: 'documentNo', note: '组件专用填充 + 导出拼接' },
      // 收件单位：autoFill←auditedTarget（未引用 notice.auditedUnit，见缺陷文档）
      { noticeKey: 'auditedUnit', receiver: 'recipientUnit', note: 'autoFill 兜底' },
    ],
    audit_announcement: [
      { noticeKey: 'auditedLeaderName', receiver: 'auditedLeaderName' },
      { noticeKey: 'auditedLeaderPosition', receiver: 'auditedLeaderPosition' },
      { noticeKey: 'auditStartDate', receiver: 'auditStartDate' },
    ],
    plan: [
      { noticeKey: 'teamLeader', receiver: 'teamLeader' },
      { noticeKey: 'teamMembers', receiver: 'teamMembers' },
      { noticeKey: 'auditStartDate', receiver: 'startDate', note: 'importMap 键名映射 startDate←auditStartDate' },
      { noticeKey: 'auditedUnit', receiver: 'auditedUnit' },
    ],
    report: [
      { noticeKey: 'auditedUnit', receiver: 'auditedUnit' },
      { noticeKey: 'auditedLeaderName', receiver: 'auditedLeaderName' },
      { noticeKey: 'auditStartDate', receiver: 'auditStartDate' },
    ],
    report_consultation: [
      // 模板 21 的 auditOrg/auditStartDate/documentNumber 无表单字段：导出时由 mergeImportChainData 从 notice 补足
      { noticeKey: 'auditOrg', receiver: '（导出兜底 merge）', note: 'mergeImportChainData' },
      { noticeKey: 'auditStartDate', receiver: '（导出兜底 merge）', note: 'mergeImportChainData' },
      { noticeKey: 'documentNumber', receiver: '（导出兜底 merge）', note: 'mergeImportChainData' },
    ],
    result_report: [
      { noticeKey: 'auditedLeaderName', receiver: 'auditedLeaderName' },
      { noticeKey: 'auditedLeaderPosition', receiver: 'auditedLeaderPosition' },
    ],
  };

  for (const [targetKey, channels] of Object.entries(expectedChannels)) {
    describe(`步骤 ${targetKey}`, () => {
      it(`importFrom 包含 notice`, () => {
        expect(step(targetKey).importFrom || []).toContain('notice');
      });
      for (const ch of channels) {
        it(`通知书「${ch.noticeKey}」有引用通道 → ${ch.receiver}（${ch.note || '同名字段自动导入'}）`, () => {
          if (ch.receiver.startsWith('（')) {
            // 导出兜底：目标步骤表单不应误收该 notice 键（避免串值）
            const cfg = STAGE_FORM_CONFIGS[targetKey];
            expect(fieldKeys(cfg).includes(ch.noticeKey)).toBe(false);
            return;
          }
          const cfg = STAGE_FORM_CONFIGS[targetKey];
          expect(fieldKeys(cfg).includes(ch.receiver), `${targetKey} 缺少接收字段 ${ch.receiver}`).toBe(true);
          // 键名相同 → 同名导入；键名不同 → 必须声明 importMap 或为专用逻辑
          if (ch.noticeKey !== ch.receiver && !ch.receiver.startsWith('（')) {
            if (ch.receiver === 'documentNo') {
              // 送达回证文书编号为组件专用填充逻辑（加载已保存数据后），非 importMap
              expect(ch.note).toContain('组件专用');
            } else if (ch.receiver === 'recipientUnit') {
              expect(ch.note).toContain('autoFill');
            } else if (ch.note && ch.note.includes('importMap')) {
              expect(step(targetKey).importMap).toBeDefined();
              expect(step(targetKey).importMap![ch.receiver]).toBe(ch.noticeKey);
            }
          }
        });
      }
    });
  }
});

describe('防串值复核（9.8 修复项回归）', () => {
  it('report 不接收 notice.documentNumber/text/content（报≠通、正文语义不同）', () => {
    const s = step('report');
    for (const k of ['documentNumber', 'text', 'content']) {
      expect(s.importExclude || []).toContain(k);
    }
  });

  it('result_report 不再把 auditedTarget 填进 auditedLeaderName（9.8.1-6）', () => {
    const cfg = STAGE_FORM_CONFIGS['result_report'];
    expect(cfg.fields.some(f => f.key === 'auditedLeaderName')).toBe(true);
    // autoFillFromProject 只能引用项目信息键（name/auditedTarget/auditType），不得出现 auditedLeaderName
    expect(Object.values(cfg.autoFillFromProject || {})).not.toContain('auditedLeaderName');
  });

  it('各步骤 importExclude 均为 9.8 修复后的受控白名单（与 routing-and-config 一致）', () => {
    const expected: Record<string, string[]> = {
      audit_announcement: ['text', 'content'],
      delivery_receipt: ['content'],
      report: ['documentNumber', 'text', 'content'],
      report_consultation: ['text', 'content'],
      result_report: ['text', 'content'],
    };
    for (const s of WORKFLOW_STEPS) {
      expect(s.importExclude || [], `步骤 ${s.key} importExclude 超出白名单`).toEqual(expected[s.key] || []);
    }
  });
});
