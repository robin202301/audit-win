// Excel 模板渲染纯函数：占位符替换 + 行循环展开
// 从 templateService 中抽离，便于单元测试（不依赖 Electron 运行时）
import * as XLSX from 'xlsx';

type Cell = XLSX.CellObject;

/** 占位符替换：未提供或为空的字段渲染为空串（与既有导出行为一致） */
export function replaceExcelPlaceholders(
  text: string,
  data: Record<string, unknown>
): string {
  return text.replace(/\{(\w+)\}/g, (_match: string, key: string) => {
    const value = data[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

/** 读取单元格的循环起始标记 {#key} */
function getLoopStartKey(cell: Cell | undefined): string | null {
  if (!cell || typeof cell.v !== 'string') return null;
  const matched = cell.v.trim().match(/^\{#(\w+)\}$/);
  return matched ? matched[1] : null;
}

/** 判断单元格是否为循环结束标记 {/key} */
function isLoopEndCell(cell: Cell | undefined, key: string): boolean {
  return !!cell && typeof cell.v === 'string' && cell.v.trim() === `{/${key}}`;
}

interface LoopRange {
  key: string;
  startRow: number;
  endRow: number;
  range: XLSX.Range;
}

function findLoopRange(ws: XLSX.WorkSheet): LoopRange | null {
  const ref = ws['!ref'];
  if (!ref) return null;
  const range = XLSX.utils.decode_range(ref);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })] as Cell | undefined;
      const key = getLoopStartKey(cell);
      if (!key) continue;
      for (let endRow = r + 1; endRow <= range.e.r; endRow++) {
        for (let endCol = range.s.c; endCol <= range.e.c; endCol++) {
          const endCell = ws[XLSX.utils.encode_cell({ r: endRow, c: endCol })] as Cell | undefined;
          if (isLoopEndCell(endCell, key)) {
            return { key, startRow: r, endRow, range };
          }
        }
      }
      // 找到起始标记但无结束标记，视为模板配置错误
      throw new Error(`Excel 模板循环标记缺少结束标记：{/${key}}`);
    }
  }
  return null;
}

/** 复制一行单元格（保留单元格样式对象）到输出工作表 */
function copyRow(
  ws: XLSX.WorkSheet,
  out: XLSX.WorkSheet,
  sourceRow: number,
  targetRow: number,
  columns: { s: number; e: number },
  item?: Record<string, unknown>
): void {
  for (let c = columns.s; c <= columns.e; c++) {
    const source = ws[XLSX.utils.encode_cell({ r: sourceRow, c })] as Cell | undefined;
    if (!source) continue;
    const cloned: Cell = { ...source };
    if (typeof cloned.v === 'string') {
      // 循环行内的占位符按当前条目替换；普通行由后续全局替换处理
      cloned.v = item ? replaceExcelPlaceholders(cloned.v, item) : cloned.v;
      cloned.w = cloned.v;
    }
    out[XLSX.utils.encode_cell({ r: targetRow, c })] = cloned;
  }
}

/**
 * 展开表格中的行循环：
 *   {#items}  ← 起始标记行（独占一行）
 *   {字段}    ← 循环模板行（可多行）
 *   {/items}  ← 结束标记行
 * 展开后删除标记行，并按条目数量复制模板行。
 */
function expandLoop(ws: XLSX.WorkSheet, loop: LoopRange, data: Record<string, unknown>): void {
  const { key, startRow, endRow, range } = loop;
  const items = Array.isArray(data[key])
    ? (data[key] as Array<Record<string, unknown>>)
    : [];
  const templateRowCount = endRow - startRow - 1;
  if (templateRowCount < 0) {
    throw new Error(`Excel 模板循环区间无效：{#${key}}`);
  }

  const out: XLSX.WorkSheet = {};
  const insertedRows = items.length * templateRowCount;
  const removedRows = endRow - startRow + 1;
  const delta = insertedRows - removedRows;
  const columns = { s: range.s.c, e: range.e.c };

  // 循环区间之前的行原样保留
  for (let r = range.s.r; r < startRow; r++) {
    copyRow(ws, out, r, r, columns);
    if (ws['!rows'] && ws['!rows'][r]) {
      out['!rows'] = out['!rows'] || [];
      out['!rows'][r] = ws['!rows'][r];
    }
  }

  // 按条目展开循环模板行
  let targetRow = startRow;
  for (const item of items) {
    for (let offset = 0; offset < templateRowCount; offset++) {
      copyRow(ws, out, startRow + 1 + offset, targetRow, columns, item);
      targetRow++;
    }
  }

  // 循环区间之后的行整体下移
  for (let r = endRow + 1; r <= range.e.r; r++) {
    copyRow(ws, out, r, r + delta, columns);
    if (ws['!rows'] && ws['!rows'][r]) {
      out['!rows'] = out['!rows'] || [];
      out['!rows'][r + delta] = ws['!rows'][r];
    }
  }

  const newEndRow = range.e.r + delta;
  out['!ref'] = XLSX.utils.encode_range({
    s: { r: range.s.r, c: range.s.c },
    e: { r: Math.max(range.s.r, newEndRow), c: range.e.c },
  });

  // 合并单元格：仅保留/平移不跨越循环区间的合并区域；
  // 循环区间的合并需要在模板中避免（逐条复制合并区域语义不明确）
  const merges: XLSX.Range[] = [];
  for (const merge of ws['!merges'] || []) {
    if (merge.e.r < startRow) {
      merges.push(merge);
    } else if (merge.s.r > endRow) {
      merges.push({
        s: { r: merge.s.r + delta, c: merge.s.c },
        e: { r: merge.e.r + delta, c: merge.e.c },
      });
    }
  }
  if (merges.length > 0) out['!merges'] = merges;
  if (ws['!cols']) out['!cols'] = ws['!cols'];

  // 用展开后的内容替换原工作表（保留对象引用，供调用方继续使用）
  for (const keyName of Object.keys(ws)) {
    delete ws[keyName];
  }
  Object.assign(ws, out);
}

/**
 * 渲染整个工作表：先展开所有行循环，再替换普通占位符。
 * 返回值为是否发生了行循环展开，便于测试断言。
 */
export function renderExcelWorksheet(
  ws: XLSX.WorkSheet,
  data: Record<string, unknown>
): boolean {
  let expanded = false;
  // 循环上限防止模板标记异常导致死循环
  for (let guard = 0; guard < 20; guard++) {
    const loop = findLoopRange(ws);
    if (!loop) break;
    expandLoop(ws, loop, data);
    expanded = true;
  }

  if (!ws['!ref']) return expanded;
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })] as Cell | undefined;
      if (!cell || typeof cell.v !== 'string') continue;
      cell.v = replaceExcelPlaceholders(cell.v, data);
      cell.w = cell.v;
    }
  }
  return expanded;
}

/**
 * 任务清单（12任务清单.xls）单元格映射。
 *
 * 该模板为 BIFF8 旧版 .xls，直接改写模板文本会丢失字体、边框等样式。
 * 为满足「版式无损」约束，模板保持原样，导出时按既有单元格坐标写入
 * 表单数据（标签与值同格，空值不再追加内容）。
 */
export function applyTaskListCellMapping(
  ws: XLSX.WorkSheet,
  data: Record<string, unknown>
): void {
  const text = (key: string): string => {
    const value = data[key];
    return value === undefined || value === null ? '' : String(value).trim();
  };

  const projectName = text('projectName');
  const compileDate = text('compileDate');
  setCellText(
    ws,
    'A2',
    `项目名称：${projectName}${compileDate ? `        编制日期：${compileDate}` : ''}`
  );
  setCellText(ws, 'A3', '审计组：');
  setCellText(
    ws,
    'B3',
    `组长：${text('teamLeader')}   主审：${text('chiefAuditor')}  成员：${text('teamMembers')}`
  );
  setCellText(ws, 'B6', text('taskListContent'));
}

/**
 * 任务清单完成情况（19任务清单完成情况.xls）单元格映射。
 *
 * 模板为 BIFF8 旧版 .xls，答案区无占位符，且直接改写模板会丢失样式。
 * 保持模板原样，导出时按单元格坐标写入：A4 项目名称/填报日期，A5 总体情况。
 */
export function applyTaskListCompletionCellMapping(
  ws: XLSX.WorkSheet,
  data: Record<string, unknown>
): void {
  const text = (key: string): string => {
    const value = data[key];
    return value === undefined || value === null ? '' : String(value).trim();
  };

  const projectName = text('projectName');
  const compileDate = text('compileDate');
  setCellText(
    ws,
    'A4',
    `项目名称：${projectName}${compileDate ? `        填报日期：${compileDate}` : ''}`
  );
  setCellText(ws, 'A5', `总体情况：${text('completionContent')}`);
}

/** 写入文本单元格，尽量保留原有单元格样式对象；无单元格时新建字符串单元格 */
function setCellText(ws: XLSX.WorkSheet, address: string, value: string): void {
  const existing = ws[address] as Cell | undefined;
  if (existing) {
    existing.t = 's';
    existing.v = value;
    existing.w = value;
    delete existing.f;
    return;
  }
  ws[address] = { t: 's', v: value, w: value };
}

/**
 * SheetJS 写回 .xls 时，若保留从原文件解析出的文档属性，
 * 会因属性类型不支持而抛错（TypedPropertyValue unrecognized type）。
 * 文档属性与表格内容/版式无关，写入前清空即可。
 */
export function sanitizeWorkbookForWrite(wb: XLSX.WorkBook): void {
  delete (wb as { Props?: unknown }).Props;
  delete (wb as { Custprops?: unknown }).Custprops;
}
