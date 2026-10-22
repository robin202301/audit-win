// 底稿与取证单共用的纯函数（可独立测试）

import { formatDateToChinese } from './stages/formDataUtils';

/** 审计工作底稿导出所需的最小字段集（与 PaperRow 的导出相关字段一致） */
export interface WorkingPaperExportInput {
  indexNumber?: string;
  projectName?: string;
  auditMatter?: string;
  auditorName?: string;
  compileDate?: string;
  auditProcess?: string;
  factSummary?: string;
  auditConclusion?: string;
  reviewerOpinion?: string;
  reviewerName?: string;
  reviewDate?: string;
  attachmentCount?: number | null;
}

export interface WorkingPaperExportFallback {
  projectName?: string;
  auditedUnit?: string;
}

/**
 * 构建审计工作底稿模板（16审计工作底稿）的导出数据。
 * 日期转为中文格式；项目名称优先取底稿自身值，遗漏时用通知书/项目信息兜底；
 * 被审计单位不在底稿表单中，统一由调用方传入的通知书修正值兜底。
 */
export function buildWorkingPaperExportData(
  paper: WorkingPaperExportInput,
  fallback: WorkingPaperExportFallback = {}
): Record<string, string> {
  return {
    indexNumber: paper.indexNumber || '',
    projectName: paper.projectName || fallback.projectName || '',
    auditedUnit: fallback.auditedUnit || '',
    auditMatter: paper.auditMatter || '',
    auditorName: paper.auditorName || '',
    compileDate: formatDateToChinese(paper.compileDate || ''),
    auditProcess: paper.auditProcess || '',
    factSummary: paper.factSummary || '',
    auditConclusion: paper.auditConclusion || '',
    reviewerOpinion: paper.reviewerOpinion || '',
    reviewerName: paper.reviewerName || '',
    reviewDate: formatDateToChinese(paper.reviewDate || ''),
    attachmentCount:
      paper.attachmentCount === undefined || paper.attachmentCount === null
        ? ''
        : String(paper.attachmentCount),
  };
}

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
