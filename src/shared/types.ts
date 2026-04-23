// 审计阶段枚举
export enum AuditStage {
  NOTICE = 'notice',           // 审计通知
  SURVEY = 'survey',           // 审计调查
  PLAN = 'plan',               // 审计方案
  EVIDENCE = 'evidence',       // 审计取证
  WORKING_PAPER = 'working_paper', // 审计底稿
  REPORT = 'report',           // 审计报告
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
  auditedUnit: string;         // 被审计单位
  auditType: string;           // 审计类型（经济责任审计等）
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
}

// 阶段进度
export interface StageProgress {
  id: number;
  projectId: number;
  stage: AuditStage;
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
  auditedUnit: string;         // 被审计（调查）单位或个人
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
