// 底稿与取证单共用的纯函数（可独立测试）

/**
 * 解析取证单「审计事项摘要」字段。
 * 新版本存 JSON 数组（[{content}] 或纯字符串数组），旧版本存纯文本。
 * 返回非空摘要条目列表。
 */
export function parseSummaryItems(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item: unknown): unknown =>
          typeof item === 'string' ? item : (item as { content?: unknown } | null | undefined)?.content
        )
        .filter((s): s is string => typeof s === 'string' && s.trim() !== '');
    }
    if (typeof parsed === 'string' && parsed.trim()) {
      return [parsed];
    }
    return [];
  } catch {
    // 旧版数据为纯文本，直接作为单条摘要
    return raw.trim() ? [raw] : [];
  }
}

/**
 * 计算当前项目内下一个底稿索引号。
 * 取现有数字索引的最大值 +1（从 1 开始）；非数字索引不参与计算。
 * 按项目独立查询调用，天然实现"不同项目可以重复"。
 */
export function computeNextIndexNumber(existing: string[]): string {
  let maxNum = 0;
  for (const raw of existing) {
    const n = Number(raw);
    if (Number.isInteger(n) && n > maxNum) {
      maxNum = n;
    }
  }
  return String(maxNum + 1);
}
