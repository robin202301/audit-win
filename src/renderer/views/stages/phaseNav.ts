// 阶段页签导航工具：从阶段页返回项目时定位到当前步骤所属阶段
export const PHASE_COUNT = 5;

/**
 * 解析路由 phase 查询参数。
 * 返回 1..PHASE_COUNT 的有效阶段号，非法值返回 null（回落到默认阶段 1）。
 */
export function parsePhaseQuery(raw: unknown): number | null {
  const num = Number(raw);
  return Number.isInteger(num) && num >= 1 && num <= PHASE_COUNT ? num : null;
}
