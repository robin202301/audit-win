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
 */
export function mergeImportChainData(
  exportData: Record<string, string>,
  parsed: Record<string, string>
): void {
  for (const [key, value] of Object.entries(parsed)) {
    if (exportData[key] === undefined) {
      exportData[key] = value;
    }
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
