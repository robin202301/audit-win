// 阶段表单的纯函数工具：可独立单元测试，不依赖组件状态

/**
 * 从前序步骤数据中挑选可导入的字段：
 * - 仅导入目标表单存在（key 已定义）且当前为空的字段
 * - 源值为空不导入
 * - exclude 中的字段一律跳过（防止同名字段语义不同导致串值，
 *   例如通知书的「配合联系人」与公示的「补充文本」都叫 text）
 * - importMap 指定键名映射（本步骤键 -> 前序步骤键），
 *   例如方案「开始日期」startDate 引用通知书「审计开始日期」auditStartDate
 */
export function pickImportableFields(
  parsed: Record<string, string>,
  target: Record<string, string>,
  exclude: string[] = [],
  importMap?: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  const excluded = new Set(exclude);
  // 先按映射导入（键名不同的字段）
  for (const [targetKey, sourceKey] of Object.entries(importMap || {})) {
    if (excluded.has(targetKey)) continue;
    if (target[targetKey] !== undefined && !target[targetKey] && parsed[sourceKey]) {
      result[targetKey] = parsed[sourceKey];
    }
  }
  // 再按同名导入
  for (const key of Object.keys(parsed)) {
    if (excluded.has(key)) continue;
    if (target[key] !== undefined && !target[key] && parsed[key]) {
      result[key] = parsed[key];
    }
  }
  return result;
}

/**
 * 将导入链中前序步骤的已保存数据补充进导出数据：
 * 仅填充导出数据中不存在的键（undefined），绝不覆盖已有值，
 * 用于模板中"无对应表单字段"的占位符（如征求意见书模板的
 * auditOrg/auditStartDate/documentNumber 等直接引用前序数据）。
 * excludedKeys：本次合并跳过的键（不同语义同名键，防抢先补入）。
 */
export function mergeImportChainData(
  exportData: Record<string, string>,
  parsed: Record<string, string>,
  excludedKeys: string[] = []
): void {
  const excluded = new Set(excludedKeys);
  for (const [key, value] of Object.entries(parsed)) {
    if (excluded.has(key)) continue;
    if (exportData[key] === undefined) {
      exportData[key] = value;
    }
  }
}

/**
 * 计算导出合并时对某个前序来源应排除的键。
 * 规则：征求意见书（report_consultation）的文号只取通知书"通"字号，
 * 报告文号（"报"字号）语义不同，不得抢先补入。
 */
export function computeMergeExcludedKeys(stepKey: string, srcKey: string): string[] {
  if (stepKey === 'report_consultation' && srcKey !== 'notice') {
    return ['documentNumber'];
  }
  return [];
}

/**
 * 模板型步骤编辑器的初始内容：
 * - 配置了默认正文（defaultContent）时优先使用，模板中的静态标题/落款不进入编辑区；
 * - 未配置时回退到模板文本，并移除正文占位符 {content} 本身，避免用户误编辑占位符。
 * 这样保存的编辑内容可通过 {content} 渲染回导出文档，且不会重复静态标题。
 */
export function resolveEditorInitialContent(
  templateText: string,
  defaultContent?: string
): string {
  if (defaultContent !== undefined && defaultContent.trim() !== '') {
    return defaultContent;
  }
  return (templateText || '').replace(/\{content\}/g, '');
}

/** 导出按钮状态：无模板时置灰并给出中文说明，避免点击后才提示 */
export interface ExportButtonState {
  disabled: boolean;
  hint: string;
}

export function getExportButtonState(
  templateName: string | null | undefined,
  scopeLabel = '该步骤'
): ExportButtonState {
  if (templateName && templateName.trim() !== '') {
    return { disabled: false, hint: '' };
  }
  return {
    disabled: true,
    hint: `${scopeLabel}暂无导出模板，填写内容仅在本系统中保存`,
  };
}

/** 页签级导入所需的最小配置（与 InterviewTabConfig 结构兼容） */
export interface TabImportConfig {
  key: string;
  fields: Array<{ key: string }>;
  importFrom?: string[];
  importExclude?: string[];
  importMap?: Record<string, string>;
}

export interface TabImportResult {
  tabData: Record<string, Record<string, string>>;
  noticeFields: Record<string, string>;
  importedCount: number;
}

/**
 * 按页签配置从前序步骤导入字段：
 * - 只处理页签显式声明的 importFrom，不再硬编码某个来源；
 * - 复用 pickImportableFields，仅填空值、支持 importMap/importExclude；
 * - 同时记录通知书字段快照，供纯导出页签（如民主测评表）在导出时引用。
 */
export function importTabDataFromStages(
  tabs: TabImportConfig[],
  currentData: Record<string, Record<string, string>>,
  stages: Array<{ stage: string; dataJson?: string }>
): TabImportResult {
  const tabData: Record<string, Record<string, string>> = {};
  for (const tab of tabs) {
    // 以字段定义初始化空值，确保导入目标形状完整；
    // 再覆盖已有数据，保留用户已填写内容与历史扩展键
    const initialized: Record<string, string> = {};
    for (const field of tab.fields) initialized[field.key] = '';
    tabData[tab.key] = { ...initialized, ...(currentData[tab.key] || {}) };
  }
  const noticeFields: Record<string, string> = {};
  let importedCount = 0;

  for (const tab of tabs) {
    if (!tab.importFrom || tab.importFrom.length === 0) continue;
    const target = tabData[tab.key];
    const targetShape: Record<string, string> = {};
    for (const field of tab.fields) {
      targetShape[field.key] = target[field.key] || '';
    }
    for (const srcKey of tab.importFrom) {
      const src = stages.find(s => s.stage === srcKey);
      if (!src || !src.dataJson || src.dataJson === '{}') continue;
      try {
        const parsed = JSON.parse(src.dataJson) as Record<string, string>;
        if (srcKey === 'notice') {
          for (const [key, value] of Object.entries(parsed)) {
            if (!noticeFields[key] && value !== undefined && value !== null && String(value).trim() !== '') {
              noticeFields[key] = String(value);
            }
          }
        }
        const picked = pickImportableFields(
          parsed,
          targetShape,
          tab.importExclude || [],
          tab.importMap
        );
        for (const [key, value] of Object.entries(picked)) {
          target[key] = value;
          targetShape[key] = value;
          importedCount++;
        }
      } catch (error) {
        // 单条阶段数据损坏不阻塞其他页签导入，记录日志便于排查
        console.error(`解析前序步骤 ${srcKey} 的已保存数据失败：`, error);
      }
    }
  }

  return { tabData, noticeFields, importedCount };
}

/** 将 ISO 日期（2026-01-01）转换为中文格式（2026年1月1日） */
export function formatDateToChinese(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  } catch {
    return dateStr;
  }
}

/**
 * 送达回证导出字段拼接：
 * 模板占位符为「送达文书名称和文号：{documentName}{documentNumber}」，
 * 将文书编号以「（编号）」的形式拼接到名称之后，如：
 * 名称「审计通知书」+ 编号「审（委）办经责通〔2024〕1号」
 * → documentName=审计通知书，documentNumber=（审（委）办经责通〔2024〕1号）
 */
export function composeDeliveryReceiptFields(
  documentName: string,
  documentNo: string
): { documentName: string; documentNumber: string } {
  const name = (documentName || '').trim();
  const no = (documentNo || '').trim();
  if (name && no) {
    return { documentName: name, documentNumber: `（${no}）` };
  }
  if (!name && no) {
    return { documentName: '', documentNumber: no };
  }
  return { documentName: name, documentNumber: '' };
}
