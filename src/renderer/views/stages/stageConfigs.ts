// 各步骤表单配置：定义字段、类型、占位符
export interface FormField {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'date' | 'select';
  placeholder?: string;
  rows?: number;
  fullSpan?: boolean;  // 是否占满两列
}

export interface StageFormConfig {
  title: string;           // 表单标题
  template: string;        // 导出模板名（对应 resources/templates/ 中的文件名，不含扩展名）
  exportFile: string;      // 导出文件名
  fields: FormField[];
  autoFillFromProject?: Record<string, string>;  // 从项目信息自动填充：formKey -> projectKey
  defaultValues?: Record<string, string>;  // 表单字段默认值（通常来自模板内容）
}

export const STAGE_FORM_CONFIGS: Record<string, StageFormConfig> = {
  work_plan: {
    title: '审计工作方案',
    template: 'tpl_audit_plan',
    exportFile: '审计工作方案.docx',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true, placeholder: '请输入项目名称' },
      { key: 'auditType', label: '审计类型', fullSpan: true, placeholder: '经济责任审计/预算执行和其他财政收支审计' },
      { key: 'workPlanContent', label: '工作方案内容', type: 'textarea', rows: 8, fullSpan: true, placeholder: '审计目标、范围、重点、时间安排等' },
      { key: 'compileDate', label: '编制日期', type: 'date' },
    ],
  },
  notice: {
    title: '审计通知书',
    template: 'tpl_audit_notice',
    exportFile: '审计通知书.docx',
    autoFillFromProject: { auditedLeaderUnit: 'auditedTarget' },
    fields: [
      { key: 'auditCommitteeOffice', label: '审计委员会办公室', fullSpan: true, placeholder: '例：中共某市委审计委员会办公室' },
      { key: 'auditOrg', label: '审计机关全称', fullSpan: true, placeholder: '例：某市审计局' },
      { key: 'documentNumber', label: '文号', placeholder: '例：审（委）办经责通〔2024〕1号' },
      { key: 'auditedLeaderName', label: '被审计领导干部姓名' },
      { key: 'auditedLeaderPosition', label: '被审计领导干部职务' },
      { key: 'auditStartDate', label: '审计开始日期', type: 'date' },
      { key: 'teamLeader', label: '审计组组长' },
      { key: 'teamDeputyLeader', label: '副组长' },
      { key: 'teamMembers', label: '审计组成员（逗号分隔）', fullSpan: true, placeholder: '请输入成员姓名，用逗号分隔' },
      { key: 'text', label: '配合联系人/财务负责人', fullSpan: true, placeholder: '例：单位财务负责人或联络人姓名，用于正文中"{auditedLeaderName}同志及{text}应当对所提供资料的及时性、真实性和完整性负责"' },
      { key: 'ccUnit', label: '抄送单位' },
      { key: 'issuingOrg', label: '印发机关' },
      { key: 'issueDate', label: '印发日期', type: 'date' },
      { key: 'content', label: '附件内容', type: 'textarea', rows: 4, fullSpan: true, placeholder: '通知书附件内容，留空则不显示' },
    ],
  },
  eight_prohibitions: {
    title: '审计"八不准"工作纪律',
    template: 'tpl_audit_eight_prohibitions_requirements',
    exportFile: '审计八不准工作纪律.docx',
    autoFillFromProject: {},
    defaultValues: {
      content: `审计"八不准"工作纪律

一、不准由被审计单位和个人报销或补贴住宿、餐饮、交通、通讯、医疗等费用。
二、不准接受被审计单位和个人赠送的礼品礼金，或未经批准通过授课等方式获取报酬。
三、不准参加被审计单位和个人安排的宴请、娱乐、旅游等活动。
四、不准利用审计工作知悉的国家秘密、商业秘密和内部信息谋取利益。
五、不准利用审计职权干预被审计单位依法管理的资金、资产、资源的审批或分配使用。
六、不准向被审计单位推销商品或介绍业务。
七、不准接受被审计单位和个人的请托干预审计工作。
八、不准向被审计单位和个人提出任何与审计工作无关的要求。

违反上述工作要求和工作纪律的，严格按照规定追究责任。
举报电话：0482-8399314`,
    },
    fields: [
      { key: 'content', label: '八不准内容', type: 'textarea', rows: 18, fullSpan: true, placeholder: '自动生成标准八不准内容，可编辑修改' },
    ],
  },
  delivery_receipt: {
    title: '审计文书送达回证',
    template: 'tpl_audit_document_delivery_receipt',
    exportFile: '审计文书送达回证.docx',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'documentName', label: '文书名称', placeholder: '例：审计通知书' },
      { key: 'documentNumber', label: '文书编号' },
      { key: 'recipientName', label: '收件人姓名' },
      { key: 'recipientUnit', label: '收件单位' },
      { key: 'deliveryMethod', label: '送达方式' },
      { key: 'deliveryDate', label: '送达日期', type: 'date' },
      { key: 'recipientSignature', label: '收件人签名' },
      { key: 'deliveryPerson', label: '送达人' },
      // 模板中的通用占位符
      { key: 'content', label: '填写内容', type: 'textarea', rows: 6, fullSpan: true },
    ],
  },
  audit_announcement: {
    title: '经济责任审计公示',
    template: 'tpl_er_audit_announcement',
    exportFile: '经济责任审计公示.docx',
    autoFillFromProject: { projectName: 'name', auditedLeaderName: 'auditedTarget' },
    fields: [
      { key: 'projectName', label: '审计项目名称', fullSpan: true },
      { key: 'auditedLeaderName', label: '被审计领导干部姓名' },
      { key: 'auditedLeaderPosition', label: '被审计领导干部职务' },
      { key: 'auditPeriod', label: '审计期间', placeholder: '例：2023年1月至2024年12月' },
      { key: 'announcementStartDate', label: '公示开始日期', type: 'date' },
      { key: 'announcementEndDate', label: '公示结束日期', type: 'date' },
      { key: 'contactPhone', label: '联系电话' },
      { key: 'contactAddress', label: '联系地址', fullSpan: true },
      // 模板中的通用占位符
      { key: 'content', label: '公示内容', type: 'textarea', rows: 6, fullSpan: true },
      { key: 'text', label: '补充文本' },
    ],
  },
  commitment_letter: {
    title: '被审计单位承诺书',
    template: 'tpl_auditee_commitment',
    exportFile: '被审计单位承诺书.docx',
    autoFillFromProject: { auditedUnit: 'auditedTarget' },
    fields: [
      { key: 'auditedUnit', label: '被审计单位' },
      { key: 'commitmentContent', label: '承诺内容', type: 'textarea', rows: 8, fullSpan: true, placeholder: '被审计单位对提供资料真实性、完整性等的承诺' },
      { key: 'legalRepSignature', label: '法定代表人签名' },
      { key: 'unitSeal', label: '单位盖章' },
      { key: 'commitDate', label: '承诺日期', type: 'date' },
      // 模板中的通用占位符
      { key: 'content', label: '正文内容', type: 'textarea', rows: 6, fullSpan: true },
      { key: 'text', label: '补充文本' },
    ],
  },
  survey: {
    title: '调查了解记录',
    template: 'tpl_investigation_record_auditee_basic_info',
    exportFile: '调查了解记录.xlsx',
    autoFillFromProject: { unitName: 'auditedTarget' },
    fields: [
      { key: 'unitName', label: '单位名称' },
      { key: 'unitNature', label: '单位性质' },
      { key: 'legalRepresentative', label: '法人代表' },
      { key: 'supervisingUnit', label: '主管单位' },
      { key: 'staffQuota', label: '人员编制' },
      { key: 'currentStaffCount', label: '期末人数' },
      { key: 'orgStructure', label: '机构设置情况', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'responsibilityScope', label: '职责范围/经营范围', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'lawExecution', label: '相关法律法规、政策及其执行情况', type: 'textarea', rows: 4, fullSpan: true },
      { key: 'financialSystem', label: '财政财务管理体制和业务管理体制', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'performanceIndicators', label: '适用的业绩指标体系', type: 'textarea', rows: 2, fullSpan: true },
      { key: 'internalControl', label: '相关内部控制及其执行情况', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'infoSystems', label: '相关信息系统及其电子数据情况', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'economicEnvironment', label: '经济环境、行业状况及其他外部因素', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'previousAudit', label: '以往接受审计情况', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'otherInfo', label: '其他需要了解的情况', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'fillerName', label: '填表人' },
      { key: 'fillDate', label: '填报日期', type: 'date' },
    ],
  },
  plan: {
    title: '审计实施方案',
    template: 'tpl_audit_plan',
    exportFile: '审计实施方案.docx',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'teamLeader', label: '组长' },
      { key: 'startDate', label: '开始日期', type: 'date' },
      { key: 'teamMembers', label: '审计组成员及分工', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'auditScope', label: '审计范围', type: 'textarea', rows: 2, fullSpan: true },
      { key: 'auditFocus', label: '审计重点', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'auditMethod', label: '审计方法', type: 'textarea', rows: 2, fullSpan: true },
      { key: 'schedule', label: '时间安排', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'endDate', label: '结束日期', type: 'date' },
    ],
  },
  task_list: {
    title: '任务清单',
    template: 'tpl_task_list',
    exportFile: '任务清单.xls',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'taskListContent', label: '任务清单内容', type: 'textarea', rows: 8, fullSpan: true, placeholder: '审计任务分解、责任人、完成时限等' },
      { key: 'compileDate', label: '编制日期', type: 'date' },
    ],
  },
  interview_record: {
    title: '谈话记录',
    template: 'tpl_investigation_interview_record',
    exportFile: '谈话记录.docx',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'interviewType', label: '谈话类型', placeholder: '领导班子谈话/民主测评/述职报告' },
      { key: 'interviewer', label: '谈话人' },
      { key: 'interviewee', label: '被谈话人' },
      { key: 'interviewDate', label: '谈话日期', type: 'date' },
      { key: 'interviewLocation', label: '谈话地点' },
      { key: 'interviewContent', label: '谈话内容', type: 'textarea', rows: 10, fullSpan: true, placeholder: '谈话记录详细内容' },
      { key: 'intervieweeSignature', label: '被谈话人签名' },
      // 模板中的通用占位符
      { key: 'content', label: '正文内容', type: 'textarea', rows: 6, fullSpan: true },
      { key: 'name', label: '人员姓名' },
    ],
  },
  evidence: {
    title: '审计取证单',
    template: 'tpl_audit_evidence',
    exportFile: '审计取证单.docx',
    autoFillFromProject: { projectName: 'name', auditedUnit: 'auditedTarget' },
    fields: [
      { key: 'serialNumber', label: '编号' },
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'auditedUnit', label: '被审计（调查）单位或个人' },
      { key: 'matterSummary', label: '审计（调查）事项摘要', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'evidenceContent', label: '证据内容', type: 'textarea', rows: 5, fullSpan: true },
      { key: 'legalBasis', label: '法律法规依据', type: 'textarea', rows: 2, fullSpan: true },
      { key: 'auditorName', label: '审计人员' },
      { key: 'compileDate', label: '编制日期', type: 'date' },
      { key: 'providerOpinion', label: '证据提供单位意见', type: 'textarea', rows: 2, fullSpan: true },
      { key: 'providerSignature', label: '证据提供单位盖章/签名' },
      { key: 'feedbackDeadline', label: '反馈截止日期', type: 'date' },
    ],
  },
  working_paper: {
    title: '审计底稿',
    template: 'tpl_working_paper',
    exportFile: '审计底稿.docx',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'indexNumber', label: '索引号' },
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'auditMatter', label: '审计（调查）事项' },
      { key: 'auditorName', label: '审计人员' },
      { key: 'compileDate', label: '编制日期', type: 'date' },
      { key: 'auditProcess', label: '审计过程（步骤、方法、证据）', type: 'textarea', rows: 5, fullSpan: true },
      { key: 'factSummary', label: '审计认定的事实摘要', type: 'textarea', rows: 5, fullSpan: true },
      { key: 'auditConclusion', label: '审计结论', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'reviewerOpinion', label: '审核意见', type: 'textarea', rows: 2, fullSpan: true },
      { key: 'reviewerName', label: '审核人员' },
      { key: 'reviewDate', label: '审核日期', type: 'date' },
      { key: 'attachmentCount', label: '附件页数' },
      // 模板中的通用占位符
      { key: 'val', label: '引用底稿/证据编号' },
    ],
  },
  task_list_completion: {
    title: '审计任务清单完成情况',
    template: 'tpl_task_list_completion',
    exportFile: '审计任务清单完成情况.xls',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'completionContent', label: '任务完成情况', type: 'textarea', rows: 10, fullSpan: true, placeholder: '各任务完成情况、责任人完成时限等' },
      { key: 'compileDate', label: '填报日期', type: 'date' },
    ],
  },
  report: {
    title: '审计组审计报告',
    template: 'tpl_final_report',
    exportFile: '审计组审计报告.docx',
    autoFillFromProject: { auditedUnit: 'auditedTarget', auditProject: 'name' },
    fields: [
      { key: 'documentNumber', label: '文号', placeholder: '例：*审（委）办经责报〔20**〕**号' },
      { key: 'auditedUnit', label: '被审计单位' },
      { key: 'auditedLeaderName', label: '被审计领导干部' },
      { key: 'auditProject', label: '审计项目' },
      { key: 'auditStartDate', label: '审计开始日期', type: 'date' },
      { key: 'auditEndDate', label: '审计结束日期', type: 'date' },
      { key: 'leaderPosition1', label: '被审计领导职务（一）' },
      { key: 'leaderPosition2', label: '被审计领导职务（二）' },
      { key: 'basicInfo', label: '被审计单位基本情况', type: 'textarea', rows: 6, fullSpan: true, placeholder: '简要表述被审计单位的背景信息、性质、组织结构等' },
      { key: 'mainWork', label: '履行经济责任所做的主要工作', type: 'textarea', rows: 6, fullSpan: true },
      { key: 'overallEvaluation', label: '总体评价', type: 'textarea', rows: 4, fullSpan: true },
      { key: 'problemsFound', label: '审计发现的主要问题', type: 'textarea', rows: 8, fullSpan: true },
      { key: 'responsibility', label: '责任认定', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'auditSuggestions', label: '审计建议', type: 'textarea', rows: 4, fullSpan: true },
      // 模板中的通用占位符
      { key: 'text', label: '审计期间', type: 'textarea', rows: 3, fullSpan: true, placeholder: '审计期间、范围、重点等文本内容' },
      { key: 'content', label: '报告正文内容', type: 'textarea', rows: 10, fullSpan: true, placeholder: '报告正文详细内容' },
      { key: 'shortText', label: '补充说明', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'name', label: '相关人员姓名' },
      { key: 'val', label: '其他数值' },
    ],
  },
  report_consultation: {
    title: '审计报告征求意见书',
    template: 'tpl_er_audit_report_consultation',
    exportFile: '审计报告征求意见书.docx',
    autoFillFromProject: { auditedUnit: 'auditedTarget', projectName: 'name' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'auditedUnit', label: '被审计单位' },
      { key: 'consultationContent', label: '征求意见内容', type: 'textarea', rows: 8, fullSpan: true, placeholder: '审计报告摘要及征求意见事项' },
      { key: 'feedbackDeadline', label: '反馈截止日期', type: 'date' },
      { key: 'contactPerson', label: '联系人' },
      { key: 'contactPhone', label: '联系电话' },
      { key: 'issueDate', label: '发出日期', type: 'date' },
      // 模板中的通用占位符
      { key: 'content', label: '正文内容', type: 'textarea', rows: 6, fullSpan: true },
      { key: 'text', label: '描述文本', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'val', label: '编号/日期值' },
    ],
  },
  audit_opinion: {
    title: '审核意见',
    template: 'tpl_audit_opinion',
    exportFile: '审核意见.docx',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'reviewerName', label: '审核人' },
      { key: 'reviewDate', label: '审核日期', type: 'date' },
      { key: 'reviewOpinion', label: '审核意见', type: 'textarea', rows: 6, fullSpan: true, placeholder: '对审计报告的审核意见' },
    ],
  },
  review_opinion: {
    title: '复核意见',
    template: 'tpl_review_opinion',
    exportFile: '复核意见.docx',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'reviewerName', label: '复核人' },
      { key: 'reviewDate', label: '复核日期', type: 'date' },
      { key: 'reviewOpinion', label: '复核意见', type: 'textarea', rows: 6, fullSpan: true, placeholder: '对审计报告的复核意见' },
    ],
  },
  adjudication_opinion: {
    title: '审理意见',
    template: 'tpl_adjudication_opinion',
    exportFile: '审理意见.docx',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'adjudicatorName', label: '审理人' },
      { key: 'adjudicationDate', label: '审理日期', type: 'date' },
      { key: 'adjudicationOpinion', label: '审理意见', type: 'textarea', rows: 6, fullSpan: true, placeholder: '对审计报告的审理意见' },
    ],
  },
  adjudication_meeting: {
    title: '审理会纪要',
    template: 'tpl_adjudication_meeting_minutes',
    exportFile: '审理会纪要.docx',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'meetingDate', label: '会议日期', type: 'date' },
      { key: 'meetingLocation', label: '会议地点' },
      { key: 'attendees', label: '参会人员', fullSpan: true },
      { key: 'meetingContent', label: '会议内容', type: 'textarea', rows: 8, fullSpan: true, placeholder: '审理会讨论内容及决议' },
      { key: 'meetingConclusion', label: '会议结论', type: 'textarea', rows: 4, fullSpan: true },
      { key: 'recorderName', label: '记录人' },
    ],
  },
  draft_cover: {
    title: '报告代拟稿封面',
    template: 'tpl_draft_cover',
    exportFile: '报告代拟稿封面.docx',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'reportTitle', label: '报告标题', fullSpan: true },
      { key: 'authorName', label: '拟稿人' },
      { key: 'reviewerName', label: '审核人' },
      { key: 'draftDate', label: '拟稿日期', type: 'date' },
      { key: 'version', label: '版本号' },
      { key: 'remarks', label: '备注', type: 'textarea', rows: 3, fullSpan: true },
    ],
  },
  external_report: {
    title: '对外报告',
    template: 'tpl_final_report',
    exportFile: '对外报告.docx',
    autoFillFromProject: { projectName: 'name', auditedUnit: 'auditedTarget' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'auditedUnit', label: '被审计单位' },
      { key: 'reportNumber', label: '报告编号' },
      { key: 'reportDate', label: '报告日期', type: 'date' },
      { key: 'reportContent', label: '报告内容', type: 'textarea', rows: 12, fullSpan: true, placeholder: '对外发布的完整报告内容' },
      { key: 'issueOrg', label: '发文机关' },
      { key: 'issuerSignature', label: '签发人签名' },
      // 模板中的通用占位符
      { key: 'content', label: '正文内容', type: 'textarea', rows: 8, fullSpan: true },
      { key: 'text', label: '描述文本', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'name', label: '人员姓名' },
      { key: 'val', label: '编号/数值' },
    ],
  },
  audit_decision: {
    title: '审计决定书',
    template: 'tpl_audit_opinion',
    exportFile: '审计决定书.docx',
    autoFillFromProject: { auditedUnit: 'auditedTarget' },
    fields: [
      { key: 'documentNumber', label: '文号' },
      { key: 'auditedUnit', label: '被审计单位' },
      { key: 'decisionContent', label: '审计决定内容', type: 'textarea', rows: 10, fullSpan: true, placeholder: '审计处理决定内容' },
      { key: 'decisionDate', label: '决定日期', type: 'date' },
      { key: 'issueOrg', label: '发文机关' },
      // 模板中的通用占位符
      { key: 'content', label: '正文内容', type: 'textarea', rows: 8, fullSpan: true },
      { key: 'text', label: '描述文本', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'name', label: '人员姓名' },
      { key: 'val', label: '编号/数值' },
    ],
  },
  result_report: {
    title: '经责审计结果报告',
    template: 'tpl_er_result_report',
    exportFile: '经济责任审计结果报告.docx',
    autoFillFromProject: { projectName: 'name', auditedLeaderName: 'auditedTarget' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'auditedLeaderName', label: '被审计领导干部' },
      { key: 'auditedLeaderPosition', label: '被审计领导职务' },
      { key: 'reportContent', label: '结果报告内容', type: 'textarea', rows: 12, fullSpan: true, placeholder: '经济责任审计结果报告完整内容' },
      { key: 'reportDate', label: '报告日期', type: 'date' },
      // 模板中的通用占位符
      { key: 'content', label: '正文内容', type: 'textarea', rows: 8, fullSpan: true, placeholder: '报告正文详细内容' },
      { key: 'text', label: '期间/描述文本', type: 'textarea', rows: 3, fullSpan: true },
      { key: 'name', label: '人员姓名' },
      { key: 'val', label: '编号/数值' },
    ],
  },
  issues_not_reflected: {
    title: '未在审计报告中反映问题清单',
    template: 'tpl_issues_not_reflected_in_audit_report',
    exportFile: '未在审计报告中反映问题清单.docx',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'issuesContent', label: '未在报告中反映的问题清单', type: 'textarea', rows: 10, fullSpan: true, placeholder: '逐条列出未在审计报告中反映的问题及原因' },
      { key: 'compileDate', label: '填报日期', type: 'date' },
    ],
  },
  issue_ledger: {
    title: '审计问题台账',
    template: 'tpl_issues_not_reflected_in_audit_report',
    exportFile: '审计问题台账.xls',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'ledgerContent', label: '问题台账内容', type: 'textarea', rows: 12, fullSpan: true, placeholder: '逐条登记审计发现的问题、整改情况、责任人员等' },
      { key: 'compileDate', label: '填报日期', type: 'date' },
    ],
  },
  archive_catalog: {
    title: '审计档案目录',
    template: 'tpl_issues_not_reflected_in_audit_report',
    exportFile: '审计档案目录.xls',
    autoFillFromProject: { projectName: 'name' },
    fields: [
      { key: 'projectName', label: '项目名称', fullSpan: true },
      { key: 'archiverName', label: '归档人' },
      { key: 'archiveDate', label: '归档日期', type: 'date' },
      { key: 'catalogContent', label: '档案目录内容', type: 'textarea', rows: 12, fullSpan: true, placeholder: '按顺序列出归档文件清单' },
      { key: 'totalPages', label: '总页数' },
      { key: 'totalFiles', label: '总件数' },
    ],
  },
};
