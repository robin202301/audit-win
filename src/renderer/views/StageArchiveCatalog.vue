<template>
  <div class="gov-archive-catalog">
    <div class="gov-archive-header">
      <h2 class="gov-archive-title">审计档案目录</h2>
      <div class="gov-archive-actions">
        <button class="gov-btn-auto" @click="autoGenerate">自动生成</button>
        <button class="gov-btn-add" @click="addRow">添加行</button>
        <button class="gov-btn-export" @click="handleExport">导出Excel</button>
        <button v-if="hasUnsavedChanges" class="gov-btn-save" @click="handleSave">保存</button>
      </div>
    </div>

    <div v-if="autoGenerating" class="gov-archive-loading">
      <span>正在根据审计流程自动生成档案目录...</span>
    </div>

    <!-- 卷标签页 -->
    <div class="gov-volume-tabs">
      <button
        v-for="vol in volumes"
        :key="vol.num"
        :class="['gov-volume-tab', activeVolume === vol.num ? 'gov-volume-tab-active' : '']"
        @click="activeVolume = vol.num"
      >
        <span class="gov-volume-num">{{ vol.label }}</span>
      </button>
    </div>

    <!-- 当前卷的表格 -->
    <div v-if="currentEntries.length > 0" class="gov-archive-table-wrapper">
      <div class="gov-archive-meta">
        <span class="gov-archive-meta-item">
          <label>案卷题名：</label>
          <span class="gov-archive-meta-value">{{ projectInfo?.name || '未填写' }}</span>
        </span>
      </div>

      <table class="gov-archive-table">
        <thead>
          <tr>
            <th class="col-seq">序号</th>
            <th class="col-docno">文号</th>
            <th class="col-resp">责任者</th>
            <th class="col-title">题名</th>
            <th class="col-date">日期</th>
            <th class="col-page">页号</th>
            <th class="col-secret">密级</th>
            <th class="col-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(entry, idx) in currentEntries" :key="idx">
            <!-- 分组标题行 -->
            <tr v-if="entry.isSection" class="row-section">
              <td colspan="8">{{ entry.title }}</td>
            </tr>
            <!-- 数据行 -->
            <tr v-else class="row-data">
              <td class="col-seq">{{ entry.sequenceNo }}</td>
              <td><input v-model="entry.documentNumber" class="tbl-input" /></td>
              <td><input v-model="entry.responsible" class="tbl-input" /></td>
              <td><input v-model="entry.title" class="tbl-input" /></td>
              <td><input v-model="entry.date" class="tbl-input" type="text" placeholder="如：2026年1月1日" /></td>
              <td><input v-model="entry.pageNumber" class="tbl-input" /></td>
              <td><input v-model="entry.classification" class="tbl-input" /></td>
              <td class="col-action">
                <button class="tbl-btn-delete" @click="deleteRow(idx)" title="删除此行">&times;</button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <div v-else class="gov-archive-empty">
      <p>暂无档案目录数据，点击"自动生成"根据审计流程填充</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue';

const props = defineProps<{
  projectId: number;
  projectInfo?: { name: string; auditedTarget: string; auditType: string };
}>();

// ========== 数据结构 ==========
interface ArchiveEntry {
  sequenceNo: string;
  documentNumber: string;
  responsible: string;
  title: string;
  date: string;
  pageNumber: string;
  classification: string;
  isSection?: boolean; // 是否是分组标题行
}

interface Volume {
  num: string;
  label: string;
  entries: ArchiveEntry[];
}

const activeVolume = ref('1');
const autoGenerating = ref(false);
const hasUnsavedChanges = ref(false);

// 原始数据（保存后的快照）
const volumesData = ref<Record<string, ArchiveEntry[]>>({});

/** 添加空行到当前卷 */
function addRow(): void {
  const vol = activeVolume.value;
  if (!volumesData.value[vol]) volumesData.value[vol] = [];
  // 计算下一个序号
  const entries = volumesData.value[vol].filter(e => !e.isSection);
  const nextSeq = String(entries.length + 1);
  volumesData.value[vol].push(dataRow(nextSeq, '', '', '', '', '', ''));
  hasUnsavedChanges.value = true;
}

/** 删除指定行 */
function deleteRow(idx: number): void {
  const vol = activeVolume.value;
  const entries = volumesData.value[vol] || [];
  const entry = entries[idx];
  if (entry && !entry.isSection) {
    volumesData.value[vol].splice(idx, 1);
    // 重新排序序号
    let seq = 1;
    for (const e of volumesData.value[vol]) {
      if (!e.isSection) {
        e.sequenceNo = String(seq++);
      }
    }
    hasUnsavedChanges.value = true;
  }
}

const volumes = computed((): Volume[] => {
  const nums = ['1', '2', '5', '9'];
  const labels = ['卷一', '卷二', '卷五', '卷九'];
  return nums.map((num, i) => ({
    num,
    label: labels[i],
    entries: volumesData.value[num] || [],
  }));
});

const currentEntries = computed(() => {
  return volumesData.value[activeVolume.value] || [];
});

// ========== 自动生成档案目录 ==========
function autoGenerate(): void {
  if (Object.keys(volumesData.value).length > 0) {
    if (!confirm('档案目录已有数据，自动生成将覆盖当前内容，是否继续？')) {
      return;
    }
  }
  autoGenerating.value = true;

  const targetName = props.projectInfo?.name || '***';
  const auditedTarget = props.projectInfo?.auditedTarget || '***';

  // 卷一：审计报告相关文书（从各阶段数据自动生成）
  const vol1 = generateVolume1(targetName);

  // 卷二：审计工作底稿（从 working_papers 表自动生成）
  const vol2 = generateVolume2(auditedTarget);

  // 卷五：审计工作底稿补充
  const vol5 = generateVolume5(auditedTarget);

  // 卷九：审计方案、通知、调查记录及整改报告（混合自动生成）
  const vol9 = generateVolume9(targetName, auditedTarget);

  volumesData.value = {
    '1': vol1,
    '2': vol2,
    '5': vol5,
    '9': vol9,
  };
  hasUnsavedChanges.value = true;
  autoGenerating.value = false;
}

/** 卷一：审计报告相关文书 */
function generateVolume1(targetName: string): ArchiveEntry[] {
  // 根据已完成的阶段自动生成卷一内容
  const entries: ArchiveEntry[] = [];
  let seq = 0;

  // 第一单元：审计报告相关
  entries.push(sectionRow('第一单元'));

  // 1. 审议意见（从审核意见书阶段）
  addIfCompleted('audit_opinion', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计组', data.reviewOpinion || `关于《${targetName}》的审议意见`, '', ''));
  });

  // 2. 审计工作报告
  addIfCompleted('report', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), data.documentNumber || '', '审计组', `${targetName}审计工作的报告`, '', ''));
  });

  // 3. 审计报告
  addIfCompleted('report', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), data.documentNumber || '', '审计组', `${targetName}的审计报告`, '', ''));
  });

  // 4. 联动事项审计结果报告
  addIfCompleted('result_report', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计组', `关于报送${targetName}上下联动事项审计结果的报告`, '', ''));
  });

  // 5. 审计报告送达回证
  addIfCompleted('delivery_receipt', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计组', '审计报告送达回证', data.deliveryDate || '', ''));
  });

  // 6. 审理意见书
  addIfCompleted('adjudication_opinion', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计局', '科右前旗审计局审理意见书', data.adjudicationDate || '', ''));
  });

  // 7. 任务清单完成情况
  addIfCompleted('task_list_completion', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计组', '审计任务清单完成情况', data.compileDate || '', ''));
  });

  // 8. 审计报告代拟稿
  addIfCompleted('draft_cover', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计组', `${targetName}审计报告代拟稿`, data.draftDate || '', ''));
  });

  // 9. 审核意见书
  addIfCompleted('audit_opinion', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '财政审计股', '科右前旗审计局财政审计股审核意见', data.reviewDate || '', ''));
  });

  // 10. 复核意见书
  addIfCompleted('review_opinion', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '财政审计股', '科右前旗审计局财政审计股复核意见书', data.reviewDate || '', ''));
  });

  // 11. 签证意见书
  addIfCompleted('report_consultation', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计组', '对审计报告的签证意见书', data.issueDate || '', ''));
  });

  // 12. 审计报告征求意见书
  addIfCompleted('report_consultation', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计组', '审计报告征求意见书（含征求意见稿）', data.issueDate || '', ''));
  });

  // 13. 征求意见书送达回证
  addIfCompleted('delivery_receipt', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计组', '审计报告征求意见书送达回证', data.deliveryDate || '', ''));
  });

  // 14. 审理会议纪要
  addIfCompleted('adjudication_meeting', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计局', '审理会议纪要', data.meetingDate || '', ''));
  });

  return entries;
}

/** 卷二：审计工作底稿 */
function generateVolume2(auditedTarget: string): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];
  let seq = 0;

  // 第二单元：审计工作底稿（从 working_papers 自动生成）
  entries.push(sectionRow('第二单元'));

  // 从数据库加载的 working_papers 将在 onMounted 时填充
  // 这里先放占位行，后续加载
  for (let i = 0; i < 5; i++) {
    seq++;
    entries.push(dataRow(String(seq), '', '审计组', `审计工作底稿-**情况`, '', ''));
  }

  return entries;
}

/** 卷五：审计工作底稿补充 */
function generateVolume5(auditedTarget: string): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];

  entries.push(sectionRow('第二单元'));
  // 占位
  entries.push(dataRow('1', '', '审计组', '审计工作底稿-**', '', ''));

  return entries;
}

/** 卷九：审计方案、通知、调查记录及整改报告 */
function generateVolume9(targetName: string, auditedTarget: string): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];
  let seq = 0;

  // 第二单元：审计工作底稿补充
  entries.push(sectionRow('第二单元'));
  addIfCompleted('working_paper', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计组', `审计工作底稿-${data.auditMatter || auditedTarget}`, data.compileDate || '', ''));
  });

  // 第三单元：审计方案、通知、调查
  entries.push(sectionRow('第三单元'));

  // 上级审计机关文件
  seq++;
  entries.push(dataRow(String(seq), '', '自治区审计厅', `内蒙古自治区审计厅关于印发《2025年${targetName}审计工作方案》的通知`, '20250214', ''));

  seq++;
  entries.push(dataRow(String(seq), '', '兴安盟审计局', `兴安盟审计局关于印发《2025年${targetName}审计工作方案》的通知`, '20250218', ''));

  // 审计实施方案
  addIfCompleted('plan', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计局', `科右前旗审计局关于印发《${targetName}审计工作方案》的通知`, '', ''));
  });

  // 审计通知书
  addIfCompleted('notice', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计局', `科右前旗审计局对${auditedTarget}的通知`, data.issueDate || '', ''));
  });

  // 审计通知书送达回证
  addIfCompleted('delivery_receipt', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计局', '审计通知书送达回证', data.deliveryDate || '', ''));
  });

  // 调查了解记录
  addIfCompleted('survey', (data: Record<string, string>) => {
    seq++;
    entries.push(dataRow(String(seq), '', '审计组', '调查了解记录1-被审计单位基本情况表', data.fillDate || '', ''));
  });

  // 第四单元：整改报告
  entries.push(sectionRow('第四单元'));
  entries.push(dataRow(String(++seq), '', '旗财政局', '关于上报财政局审计整改情况的报告', '', ''));
  entries.push(dataRow(String(++seq), '', '旗农科局', '关于审计发现问题的说明及整改报告', '', ''));
  entries.push(dataRow(String(++seq), '', '旗交通局', '关于审计整改的说明', '', ''));

  return entries;
}

// ========== 阶段数据辅助方法 ==========
const stageDataCache = shallowRef<Record<string, Record<string, string>>>({});

async function loadAllStageData(): Promise<void> {
  try {
    const res = await window.electronAPI.stages.getByProjectId(props.projectId);
    if (res.success && res.data) {
      const cache: Record<string, Record<string, string>> = {};
      for (const s of res.data) {
        if (s.dataJson && s.dataJson !== '{}') {
          try {
            cache[s.stage] = JSON.parse(s.dataJson);
          } catch { /* ignore */ }
        }
      }
      stageDataCache.value = cache;
    }
  } catch { /* ignore */ }
}

async function loadWorkingPapers(): Promise<Array<{ id: number; indexNumber: string; auditMatter: string; auditorName: string; compileDate: string; factSummary: string }>> {
  try {
    const res = await window.electronAPI.workingPapers.getByProjectId(props.projectId);
    if (res.success && res.data) {
      return res.data;
    }
  } catch { /* ignore */ }
  return [];
}

function addIfCompleted(stageKey: string, addFn: (data: Record<string, string>) => void): void {
  const data = stageDataCache.value[stageKey];
  if (data && Object.keys(data).length > 0) {
    addFn(data);
  }
}

function sectionRow(title: string): ArchiveEntry {
  return {
    sequenceNo: '',
    documentNumber: '',
    responsible: '',
    title,
    date: '',
    pageNumber: '',
    classification: '',
    isSection: true,
  };
}

function dataRow(seq: string, docNo: string, resp: string, title: string, date: string, page: string, secret: string = ''): ArchiveEntry {
  return {
    sequenceNo: seq,
    documentNumber: docNo,
    responsible: resp,
    title,
    date,
    pageNumber: page,
    classification: secret,
  };
}

// ========== 保存 ==========
async function handleSave(): Promise<void> {
  try {
    const data: Record<string, ArchiveEntry[]> = {};
    for (const vol of Object.keys(volumesData.value)) {
      data[vol] = volumesData.value[vol];
    }
    const res = await window.electronAPI.stages.updateData(
      props.projectId,
      'archive_catalog',
      JSON.stringify(data),
      'completed'
    );
    if (res.success) {
      hasUnsavedChanges.value = false;
      alert('档案目录已保存');
    } else {
      alert('保存失败：' + (res.message || '未知错误'));
    }
  } catch (e: unknown) {
    alert('保存失败：' + (e as Error).message);
  }
}

// ========== 导出 Excel ==========
async function handleExport(): Promise<void> {
  if (Object.keys(volumesData.value).length === 0) {
    alert('暂无数据可导出，请先生成档案目录');
    return;
  }

  try {
    const res = await window.electronAPI.documents.openSaveDialog('审计档案目录.xlsx');
    if (res.success && res.data) {
      // 直接使用 xlsx 库生成多 sheet 工作簿
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const volLabels: Record<string, string> = {
        '1': '卷一',
        '2': '卷二',
        '5': '卷五',
        '9': '卷九',
      };

      for (const [volNum, entries] of Object.entries(volumesData.value)) {
        // 表头
        const rows: string[][] = [
          ['审计档案卷内目录'],
          ['案卷题名', '', props.projectInfo?.name || ''],
          ['序号', '文号', '责任者', '题名', '日期', '页号', '密级'],
        ];

        // 数据行
        let seq = 0;
        for (const entry of entries) {
          if (entry.isSection) {
            rows.push([entry.title, '', '', '', '', '', '']);
            continue;
          }
          seq++;
          rows.push([
            entry.sequenceNo || String(seq),
            entry.documentNumber,
            entry.responsible,
            entry.title,
            entry.date,
            entry.pageNumber,
            entry.classification,
          ]);
        }

        const ws = XLSX.utils.aoa_to_sheet(rows);
        // 设置列宽
        ws['!cols'] = [
          { wch: 8 },   // 序号
          { wch: 18 },  // 文号
          { wch: 14 },  // 责任者
          { wch: 50 },  // 题名
          { wch: 12 },  // 日期
          { wch: 8 },   // 页号
          { wch: 8 },   // 密级
        ];

        const sheetName = volLabels[volNum] || `卷${volNum}`;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }

      XLSX.writeFile(wb, res.data.filePath);
      alert('档案目录已导出：' + res.data!.filePath);
    }
  } catch (e: unknown) {
    alert('导出失败：' + (e as Error).message);
  }
}

// ========== 初始化：加载阶段数据和底稿 ==========
async function init(): Promise<void> {
  await loadAllStageData();
  const papers = await loadWorkingPapers();

  // 如果已有保存的数据，加载它
  try {
    const res = await window.electronAPI.stages.getByProjectId(props.projectId);
    if (res.success && res.data) {
      const stageData = res.data.find((s: { stage: string }) => s.stage === 'archive_catalog');
      if (stageData && stageData.dataJson && stageData.dataJson !== '{}') {
        try {
          const parsed = JSON.parse(stageData.dataJson);
          if (parsed && Object.keys(parsed).length > 0) {
            volumesData.value = parsed;
            return; // 已有保存的数据，直接使用
          }
        } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }

  // 没有保存的数据，根据阶段数据自动生成
  const targetName = props.projectInfo?.name || '***';
  const auditedTarget = props.projectInfo?.auditedTarget || '***';

  // 用底稿数据填充卷二和卷五
  const vol2 = generateVolume2FromPapers(papers, auditedTarget);
  const vol5 = generateVolume5FromPapers(papers, auditedTarget);
  const vol1 = generateVolume1(targetName);
  const vol9 = generateVolume9(targetName, auditedTarget);

  volumesData.value = {
    '1': vol1,
    '2': vol2,
    '5': vol5,
    '9': vol9,
  };
}

/** 从底稿列表生成卷二数据 */
function generateVolume2FromPapers(
  papers: Array<{ indexNumber: string; auditMatter: string; compileDate: string }>,
  auditedTarget: string
): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];
  entries.push(sectionRow('第二单元'));
  if (papers.length > 0) {
    papers.forEach((p, i) => {
      entries.push(dataRow(
        String(i + 1),
        p.indexNumber || '',
        '审计组',
        `审计工作底稿-${p.auditMatter || auditedTarget}`,
        formatToDate(p.compileDate),
        ''
      ));
    });
  } else {
    for (let i = 0; i < 5; i++) {
      entries.push(dataRow(String(i + 1), '', '审计组', `审计工作底稿-**情况`, '', ''));
    }
  }
  return entries;
}

/** 从底稿列表生成卷五数据 */
function generateVolume5FromPapers(
  papers: Array<{ indexNumber: string; auditMatter: string; compileDate: string }>,
  auditedTarget: string
): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];
  entries.push(sectionRow('第二单元'));
  if (papers.length > 0) {
    // 取后部分底稿作为卷五
    const startIdx = Math.max(0, papers.length - 3);
    papers.slice(startIdx).forEach((p, i) => {
      entries.push(dataRow(
        String(i + 1),
        p.indexNumber || '',
        '审计组',
        `审计工作底稿-${p.auditMatter || auditedTarget}`,
        formatToDate(p.compileDate),
        ''
      ));
    });
  } else {
    entries.push(dataRow('1', '', '审计组', '审计工作底稿-**', '', ''));
  }
  return entries;
}

/** 格式化日期为 YYYYMMDD */
function formatToDate(dateStr: string): string {
  if (!dateStr) return '';
  // 如果已经是 YYYYMMDD 格式直接返回
  if (/^\d{8}$/.test(dateStr)) return dateStr;
  // 如果是 YYYY-MM-DD 格式，转换为 YYYYMMDD
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[1]}${match[2]}${match[3]}`;
  return dateStr;
}

onMounted(() => { init(); });
</script>

<style scoped>
.gov-archive-catalog {
  background: #fff;
  border: 1px solid #e8d5b7;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(139, 0, 0, 0.06);
  padding: 20px 24px;
}

.gov-archive-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.gov-archive-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.gov-archive-actions {
  display: flex;
  gap: 8px;
}

.gov-btn-auto {
  padding: 6px 14px;
  background: #fff;
  border: 1px solid #8B0000;
  border-radius: 6px;
  color: #8B0000;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.gov-btn-auto:hover {
  background: #fff5f0;
  border-color: #c2410c;
}

.gov-btn-export {
  padding: 6px 16px;
  background: linear-gradient(135deg, #8B0000, #B22222);
  color: #FFD700;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(139, 0, 0, 0.2);
}

.gov-btn-export:hover {
  background: linear-gradient(135deg, #a00000, #c42828);
  transform: translateY(-1px);
}

.gov-btn-save {
  padding: 6px 16px;
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.gov-btn-save:hover {
  background: linear-gradient(135deg, #047857, #059669);
}

.gov-archive-loading {
  text-align: center;
  padding: 24px;
  color: #8B0000;
  font-size: 14px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  margin-bottom: 16px;
}

.gov-archive-empty {
  text-align: center;
  padding: 48px 24px;
  color: #9ca3af;
  font-size: 14px;
}

/* 卷标签页 */
.gov-volume-tabs {
  display: flex;
  gap: 0;
  background: linear-gradient(180deg, #8B0000 0%, #B22222 100%);
  border-radius: 8px 8px 0 0;
  border-bottom: 2px solid #FFD700;
  margin-bottom: 0;
}

.gov-volume-tab {
  flex: 1;
  padding: 12px 8px;
  background: transparent;
  border: none;
  color: rgba(255, 215, 0, 0.7);
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  font-weight: 500;
  position: relative;
}

.gov-volume-tab:hover {
  background: rgba(255, 215, 0, 0.1);
  color: rgba(255, 215, 0, 0.9);
}

.gov-volume-tab-active {
  background: rgba(255, 215, 0, 0.15);
  color: #FFD700;
}

.gov-volume-tab-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: #FFD700;
}

.gov-volume-num {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 215, 0, 0.2);
  color: rgba(255, 215, 0, 0.8);
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  line-height: 20px;
  margin-right: 4px;
}

.gov-volume-tab-active .gov-volume-num {
  background: #FFD700;
  color: #8B0000;
}

/* 档案信息 */
.gov-archive-meta {
  padding: 12px 16px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0 0 6px 6px;
  margin-bottom: 0;
  font-size: 13px;
  color: #92400e;
}

.gov-archive-meta-item label {
  font-weight: 500;
}

.gov-archive-meta-value {
  font-weight: 400;
}

/* 表格 */
.gov-archive-table-wrapper {
  overflow-x: auto;
  margin-top: 0;
}

.gov-archive-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.gov-archive-table th {
  background: #faf8f5;
  border: 1px solid #e8d5b7;
  padding: 8px 12px;
  font-weight: 600;
  color: #374151;
  text-align: left;
  white-space: nowrap;
}

.gov-archive-table td {
  border: 1px solid #e8d5b7;
  padding: 4px 6px;
  height: 32px;
}

.gov-archive-table .col-seq {
  width: 48px;
  text-align: center;
}

.gov-archive-table .col-docno {
  width: 100px;
}

.gov-archive-table .col-resp {
  width: 100px;
}

.gov-archive-table .col-title {
  min-width: 280px;
}

.gov-archive-table .col-date {
  width: 90px;
}

.gov-archive-table .col-page {
  width: 70px;
}

.gov-archive-table .col-secret {
  width: 60px;
}

.gov-archive-table .col-action {
  width: 40px;
  text-align: center;
}

.tbl-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 2px 4px;
  font-size: 13px;
  color: #374151;
  outline: none;
}

.tbl-input:focus {
  background: #fff8f0;
  border-bottom: 1px solid #8B0000;
}

.row-section td {
  background: #fef3c7;
  font-weight: 600;
  color: #8B0000;
  padding: 8px 12px;
  font-size: 13px;
}

.row-data:hover {
  background: #fff8f0;
}

/* 添加行按钮 */
.gov-btn-add {
  padding: 6px 14px;
  background: #fff;
  border: 1px solid #059669;
  border-radius: 6px;
  color: #059669;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.gov-btn-add:hover {
  background: #ecfdf5;
}

/* 表格删除按钮 */
.tbl-btn-delete {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #dc2626;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.tbl-btn-delete:hover {
  background: #fef2f2;
}
</style>
