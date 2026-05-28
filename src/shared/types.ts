// 审计工作流步骤
export interface WorkflowStep {
  stepNumber: number;        // 步骤序号
  key: string;               // 唯一标识
  label: string;             // 显示名称
  phase: number;             // 所属阶段 1-5
  phaseLabel: string;        // 阶段名称
  template?: string;         // 导出模板名
  importFrom?: string[];     // 从哪些步骤导入数据
  auditType?: string;        // 适用的审计类型（留空表示通用）
}

// 审计类型枚举
export const AUDIT_TYPES = ['经济责任审计', '预算执行审计', '专项审计调查'] as const;
export type AuditType = typeof AUDIT_TYPES[number];

// 通知书模板映射（根据审计类型选择对应模板）
export const NOTICE_TEMPLATES: Record<AuditType, string> = {
  '经济责任审计': '1经济责任审计通知书',
  '预算执行审计': '2预算执行通知书',
  '专项审计调查': '3专项审计调查通知书',
};

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { stepNumber: 1, key: 'notice', label: '审计通知书', phase: 1, phaseLabel: '审计准备阶段', importFrom: [] },
  { stepNumber: 2, key: 'eight_prohibitions', label: '通知附件八不准', phase: 1, phaseLabel: '审计准备阶段', template: '4通知附件八不准', importFrom: ['notice'] },
  { stepNumber: 3, key: 'delivery_receipt', label: '审计文书送达回证', phase: 1, phaseLabel: '审计准备阶段', template: '5审计文书送达回证', importFrom: ['notice'] },
  { stepNumber: 4, key: 'audit_announcement', label: '经济责任审计公示', phase: 1, phaseLabel: '审计准备阶段', importFrom: ['notice'], auditType: '经济责任审计' },
  { stepNumber: 5, key: 'commitment_letter', label: '被审计单位承诺书', phase: 1, phaseLabel: '审计准备阶段', template: '6被审计单位承诺书', importFrom: [] },
  { stepNumber: 6, key: 'survey', label: '被审计单位基本情况表', phase: 1, phaseLabel: '审计准备阶段', template: '7调查了解记录1基本情况表', importFrom: [] },
  { stepNumber: 6, key: 'survey_assessment', label: '评估被审计单位存在重要问题的可能性', phase: 1, phaseLabel: '审计准备阶段', template: '8调查了解记录2评估可能性', importFrom: ['survey'] },
  { stepNumber: 6, key: 'survey_measures', label: '确定审计事项和审计应对措施', phase: 1, phaseLabel: '审计准备阶段', template: '9调查了解记录3审计应对措施', importFrom: ['survey_assessment'] },
  { stepNumber: 7, key: 'plan', label: '审计实施方案', phase: 1, phaseLabel: '审计准备阶段', template: '10审计实施方案', importFrom: ['notice', 'survey'] },
  { stepNumber: 8, key: 'task_list', label: '任务清单', phase: 1, phaseLabel: '审计准备阶段', importFrom: ['plan'] },
  { stepNumber: 9, key: 'interview_record', label: '谈话记录', phase: 1, phaseLabel: '审计准备阶段', importFrom: [], auditType: '经济责任审计' },
  { stepNumber: 10, key: 'evidence', label: '审计取证单', phase: 2, phaseLabel: '审计实施阶段', template: '11审计取证单', importFrom: ['notice'] },
  { stepNumber: 11, key: 'working_paper', label: '审计工作底稿', phase: 2, phaseLabel: '审计实施阶段', template: '12审计工作底稿', importFrom: ['evidence'] },
  { stepNumber: 12, key: 'task_list_completion', label: '任务清单完成情况', phase: 2, phaseLabel: '审计实施阶段', template: '13任务清单完成情况', importFrom: ['task_list'] },
  { stepNumber: 13, key: 'report', label: '审计组审计报告', phase: 2, phaseLabel: '审计实施阶段', importFrom: ['survey', 'evidence', 'working_paper'] },
  { stepNumber: 14, key: 'report_consultation', label: '审计报告征求意见书', phase: 3, phaseLabel: '审计报告阶段', template: '14审计报告征求意见书', importFrom: ['report'] },
  { stepNumber: 15, key: 'audit_opinion', label: '审核意见书', phase: 3, phaseLabel: '审计报告阶段', template: '15审核意见书', importFrom: ['report_consultation'] },
  { stepNumber: 16, key: 'review_opinion', label: '复核意见书', phase: 3, phaseLabel: '审计报告阶段', template: '16复核意见书', importFrom: ['audit_opinion'] },
  { stepNumber: 17, key: 'adjudication_opinion', label: '审理意见书', phase: 3, phaseLabel: '审计报告阶段', template: '17审理意见书', importFrom: ['review_opinion'] },
  { stepNumber: 18, key: 'adjudication_meeting', label: '审理会议纪要', phase: 3, phaseLabel: '审计报告阶段', template: '19审理会议纪要', importFrom: ['adjudication_opinion'] },
  { stepNumber: 19, key: 'draft_cover', label: '代拟稿封皮', phase: 3, phaseLabel: '审计报告阶段', template: '18代拟稿封皮', importFrom: ['adjudication_meeting'] },
  { stepNumber: 20, key: 'external_report', label: '对外报告', phase: 4, phaseLabel: '审计处理阶段', template: '20预算执行对外报告', importFrom: ['report'] },
  { stepNumber: 21, key: 'result_report', label: '经责审计结果报告', phase: 4, phaseLabel: '审计处理阶段', importFrom: ['external_report'], auditType: '经济责任审计' },
  { stepNumber: 22, key: 'issues_not_reflected', label: '未在报告中反映问题清单', phase: 4, phaseLabel: '审计处理阶段', importFrom: [] },
  { stepNumber: 23, key: 'audit_decision', label: '审计决定书', phase: 4, phaseLabel: '审计处理阶段', importFrom: ['external_report'] },
  { stepNumber: 24, key: 'issue_ledger', label: '审计问题台账', phase: 4, phaseLabel: '审计处理阶段', importFrom: ['external_report'] },
  { stepNumber: 25, key: 'archive_catalog', label: '审计档案目录', phase: 5, phaseLabel: '审计归档阶段', importFrom: [] },
];

// 向后兼容：保留原有6阶段枚举
export enum AuditStage {
  NOTICE = 'notice',
  SURVEY = 'survey',
  PLAN = 'plan',
  EVIDENCE = 'evidence',
  WORKING_PAPER = 'working_paper',
  REPORT = 'report',
}

export const STAGE_LABELS: Record<AuditStage, string> = {
  [AuditStage.NOTICE]: '审计通知',
  [AuditStage.SURVEY]: '审计调查',
  [AuditStage.PLAN]: '审计方案',
  [AuditStage.EVIDENCE]: '审计取证',
  [AuditStage.WORKING_PAPER]: '审计底稿',
  [AuditStage.REPORT]: '审计报告',
};

// IPC 响应结构
export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

// 审计项目
export interface Project {
  id: number;
  name: string;                // 项目名称
  auditedTarget: string;       // 被审计单位
  auditType: AuditType;        // 审计类型
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
}

// 阶段进度
export interface StageProgress {
  id: number;
  projectId: number;
  stage: string;
  status: 'not_started' | 'in_progress' | 'completed';
  dataJson: string;            // 阶段表单数据（JSON）
  updatedAt: string;
}

// 取证单
export interface EvidenceItem {
  id: number;
  projectId: number;
  serialNumber: string;        // 编号
  projectName: string;         // 项目名称
  auditedUnit: string;         // 被审计（调查）单位
  matterSummary: string;       // 审计（调查）事项摘要
  evidenceContent: string;     // 证据内容
  legalBasis: string;          // 法律法规依据
  auditorName: string;         // 审计人员
  compileDate: string;         // 编制日期
  providerOpinion: string;     // 证据提供单位意见
  providerSignature: string;   // 证据提供单位盖章/签名
  feedbackDeadline: string;    // 反馈截止日期
  attachmentPaths: string;     // 附件路径（JSON 数组）
  createdAt: string;
  updatedAt: string;
}

// 底稿
export interface WorkingPaper {
  id: number;
  projectId: number;
  indexNumber: string;         // 索引号
  projectName: string;         // 项目名称
  auditMatter: string;         // 审计（调查）事项
  auditorName: string;         // 审计人员
  compileDate: string;         // 编制日期
  auditProcess: string;        // 审计过程（步骤、方法、证据）
  factSummary: string;         // 审计认定的事实摘要
  auditConclusion: string;     // 审计结论
  reviewerOpinion: string;     // 审核意见
  reviewerName: string;        // 审核人员
  reviewDate: string;          // 审核日期
  attachmentCount: number;     // 附件页数
  createdAt: string;
  updatedAt: string;
}

// 调查记录（审计调查阶段）
export interface SurveyRecord {
  id: number;
  projectId: number;
  unitName: string;            // 单位名称
  unitNature: string;          // 单位性质
  legalRepresentative: string; // 法人代表
  supervisingUnit: string;     // 主管单位
  staffQuota: number;          // 人员编制
  currentStaffCount: number;   // 期末人数
  orgStructure: string;        // 机构设置情况
  responsibilityScope: string; // 职责范围/经营范围
  lawExecution: string;        // 法律法规、政策及其执行情况
  financialSystem: string;     // 财政财务管理体制和业务管理体制
  performanceIndicators: string; // 适用的业绩指标体系
  internalControl: string;     // 相关内部控制及其执行情况
  infoSystems: string;         // 相关信息系统及其电子数据情况
  economicEnvironment: string; // 经济环境、行业状况及其他外部因素
  previousAudit: string;       // 以往接受审计情况
  otherInfo: string;           // 其他需要了解的情况
  fillerName: string;          // 填表人
  fillDate: string;            // 填报日期
  createdAt: string;
  updatedAt: string;
}

// 调查评估记录
export interface SurveyAssessmentRecord {
  id: number;
  projectId: number;
  assessmentContent: string;
  assessmentDate: string;
  createdAt: string;
  updatedAt: string;
}

// 调查应对措施记录
export interface SurveyMeasuresRecord {
  id: number;
  projectId: number;
  auditMatters: string;
  auditMeasures: string;
  compileDate: string;
  fillerName: string;
  createdAt: string;
  updatedAt: string;
}

// 文件附件
export interface FileAttachment {
  id: number;
  projectId: number;
  entityType: string;          // 关联实体类型（evidence, working_paper, survey 等）
  entityId: number;            // 关联实体 ID
  filePath: string;            // 文件存储路径
  fileName: string;            // 原始文件名
  fileType: string;            // 文件类型（docx, xlsx, pdf 等）
  fileSize: number;            // 文件大小（字节）
  createdAt: string;
}

// 通知阶段数据
export interface NoticeData {
  auditProjectName: string;    // 审计项目名称（关于开展xxx审计通知）
  auditOrg: string;            // 审计机关全称
  documentNumber: string;      // 文号
  auditedLeaderName: string;   // 被审计领导干部姓名
  auditedLeaderUnit: string;   // 被审计领导干部所在单位
  auditedLeaderPosition: string; // 被审计领导干部职务
  auditStartDate: string;      // 审计开始日期
  auditEndDate: string;        // 审计追溯结束日期
  teamLeader: string;          // 审计组组长
  teamDeputyLeader: string;    // 副组长
  teamMembers: string;         // 成员（逗号分隔）
  ccUnit: string;              // 抄送
  issuingOrg: string;          // 印发机关
  issueDate: string;           // 印发日期
}

// 方案阶段数据
export interface PlanData {
  projectName: string;         // 项目名称
  teamLeader: string;          // 组长
  teamMembers: string;         // 成员及分工
  auditScope: string;          // 审计范围
  auditFocus: string;          // 审计重点
  auditMethod: string;         // 审计方法
  schedule: string;            // 时间安排
  startDate: string;           // 开始日期
  endDate: string;             // 结束日期
}

// 报告阶段数据
export interface ReportData {
  documentNumber: string;      // 文号
  auditedUnit: string;         // 被审计单位
  auditedLeaderName: string;   // 被审计领导干部
  auditProject: string;        // 审计项目
  auditStartDate: string;      // 审计开始日期
  auditEndDate: string;        // 审计结束日期
  leaderPosition1: string;     // 领导1职务
  leaderPosition2: string;     // 领导2职务
  basicInfo: string;           // 被审计单位基本情况
  mainWork: string;            // 履行经济责任所做的主要工作
  overallEvaluation: string;   // 总体评价
  problemsFound: string;       // 审计发现的主要问题
  responsibility: string;      // 责任认定
  auditSuggestions: string;    // 审计建议
}
