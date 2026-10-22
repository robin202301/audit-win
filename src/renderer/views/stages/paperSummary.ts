// 审计底稿汇总表导出数据构建（纯函数，可独立单元测试）
import { formatDateToChinese } from './formDataUtils';

export interface SummaryPaper {
  indexNumber?: string;
  auditMatter?: string;
  auditorName?: string;
  compileDate?: string;
  factSummary?: string;
  auditConclusion?: string;
  reviewerOpinion?: string;
  reviewerName?: string;
  reviewDate?: string;
}

export interface SummaryProjectInfo {
  name?: string;
  auditedTarget?: string;
}

export interface WorkingPaperSummaryData {
  projectName: string;
  auditedUnit: string;
  compileDate: string;
  totalCount: string;
  workingPapers: Array<Record<string, string>>;
}

function text(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

/** 索引号数字优先升序；非数字索引排在数字之后，保持原始顺序 */
function indexSortValue(raw: string): number {
  if (raw.trim() === '') return Number.MAX_SAFE_INTEGER;
  const num = Number(raw);
  return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
}

/** 本地日期格式化为中文日期，避免 toISOString 的 UTC 跨日偏差 */
export function formatLocalDateToChinese(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

/**
 * 构建审计底稿汇总表导出数据。
 * 通知书中的项目名称/被审计单位优先，项目初始信息兜底；
 * 所有字段均转为字符串（缺失为空串），日期统一为中文格式。
 */
export function buildWorkingPaperSummaryData(
  papers: SummaryPaper[],
  projectInfo: SummaryProjectInfo,
  noticeInfo: SummaryProjectInfo = {},
  now: Date = new Date()
): WorkingPaperSummaryData {
  // 数字索引升序；非数字索引统一排后。Array.prototype.sort 为稳定排序，
  // 相同排序值时保持底稿原有顺序。
  const sorted = papers.slice().sort(
    (a, b) => indexSortValue(text(a.indexNumber)) - indexSortValue(text(b.indexNumber))
  );

  return {
    projectName: text(noticeInfo.name) || text(projectInfo.name),
    auditedUnit: text(noticeInfo.auditedTarget) || text(projectInfo.auditedTarget),
    compileDate: formatLocalDateToChinese(now),
    totalCount: String(sorted.length),
    workingPapers: sorted.map((paper, index) => ({
      seq: String(index + 1),
      indexNumber: text(paper.indexNumber),
      auditMatter: text(paper.auditMatter),
      auditorName: text(paper.auditorName),
      compileDate: formatDateToChinese(text(paper.compileDate)),
      factSummary: text(paper.factSummary),
      auditConclusion: text(paper.auditConclusion),
      reviewerOpinion: text(paper.reviewerOpinion),
      reviewerName: text(paper.reviewerName),
      reviewDate: formatDateToChinese(text(paper.reviewDate)),
    })),
  };
}
