<template>
  <div class="card gov-stage-card">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <span class="gov-step-badge">12</span>
        <div>
          <h2 class="gov-step-title">审计底稿汇总表</h2>
          <p class="text-sm text-gray-500 mt-1">汇总当前项目全部审计工作底稿，按索引号顺序导出</p>
        </div>
      </div>
      <button class="btn-primary" :disabled="exporting || paperList.length === 0" @click="handleExport">
        {{ exporting ? '导出中...' : '导出汇总表' }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-500">加载中...</div>
    <div v-else-if="paperList.length === 0" class="text-center py-8 text-gray-400">
      暂无底稿，请先在“审计工作底稿”步骤录入底稿
    </div>
    <div v-else class="overflow-x-auto">
      <table class="gov-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>索引号</th>
            <th>审计（调查）事项</th>
            <th>审计人员</th>
            <th>编制日期</th>
            <th>审计认定的事实摘要</th>
            <th>审计结论</th>
            <th>审核意见</th>
            <th>审核人员</th>
            <th>审核日期</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in summaryRows" :key="item.seq" v-memo="[item]">
            <td class="gov-td">{{ item.seq }}</td>
            <td class="gov-td">{{ item.indexNumber }}</td>
            <td class="gov-td max-w-xs">{{ item.auditMatter }}</td>
            <td class="gov-td">{{ item.auditorName }}</td>
            <td class="gov-td whitespace-nowrap">{{ item.compileDate }}</td>
            <td class="gov-td max-w-xs">{{ item.factSummary }}</td>
            <td class="gov-td max-w-xs">{{ item.auditConclusion }}</td>
            <td class="gov-td max-w-xs">{{ item.reviewerOpinion }}</td>
            <td class="gov-td">{{ item.reviewerName }}</td>
            <td class="gov-td whitespace-nowrap">{{ item.reviewDate }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="successMessage" class="mt-3 text-green-600">{{ successMessage }}</div>
    <div v-if="errorMessage" class="mt-3 text-red-600">{{ errorMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue';
import { buildWorkingPaperSummaryData, type SummaryPaper } from './stages/paperSummary';

const props = defineProps<{
  projectId: number;
  projectInfo?: { name: string; auditedTarget: string; auditType: string };
}>();

const paperList = shallowRef<SummaryPaper[]>([]);
const noticeInfo = shallowRef<{ name: string; auditedTarget: string }>({ name: '', auditedTarget: '' });
const loading = ref(false);
const exporting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const summaryRows = computed(() =>
  buildWorkingPaperSummaryData(
    paperList.value,
    {
      name: props.projectInfo?.name || '',
      auditedTarget: props.projectInfo?.auditedTarget || '',
    },
    noticeInfo.value
  ).workingPapers
);

onMounted(async () => {
  await loadNoticeInfo();
  await loadPapers();
});

async function loadPapers(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    const res = await window.electronAPI.workingPapers.getByProjectId(props.projectId);
    if (res.success && Array.isArray(res.data)) {
      paperList.value = res.data as SummaryPaper[];
    } else {
      errorMessage.value = res.message || '加载审计底稿失败';
    }
  } catch (e: unknown) {
    errorMessage.value = `加载审计底稿失败：${(e as Error).message}`;
  } finally {
    loading.value = false;
  }
}

/** 通知书中的项目名称、被审计单位优先于项目初始信息 */
async function loadNoticeInfo(): Promise<void> {
  try {
    const res = await window.electronAPI.stages.getByProjectId(props.projectId);
    if (!res.success || !Array.isArray(res.data)) return;
    const notice = (res.data as Array<{ stage: string; dataJson: string }>).find(s => s.stage === 'notice');
    if (!notice || !notice.dataJson || notice.dataJson === '{}') return;
    const parsed = JSON.parse(notice.dataJson) as Record<string, string>;
    noticeInfo.value = {
      // 通知书表单无 projectName 字段，专项审计调查的项目名称为 auditProject
      name: parsed.projectName || parsed.auditProject || '',
      auditedTarget: parsed.auditedUnit || '',
    };
  } catch (e: unknown) {
    // 通知书读取失败不阻塞汇总表展示，改用项目初始信息
    console.error('汇总表读取通知书数据失败：', e);
  }
}

async function handleExport(): Promise<void> {
  if (paperList.value.length === 0) {
    errorMessage.value = '暂无底稿，无法导出汇总表';
    return;
  }
  exporting.value = true;
  successMessage.value = '';
  errorMessage.value = '';
  try {
    const data = buildWorkingPaperSummaryData(
      paperList.value,
      {
        name: props.projectInfo?.name || '',
        auditedTarget: props.projectInfo?.auditedTarget || '',
      },
      noticeInfo.value
    );
    const saveRes = await window.electronAPI.documents.openSaveDialog('审计底稿汇总表.xlsx');
    if (!saveRes.success) {
      errorMessage.value = saveRes.message || '打开保存对话框失败';
      return;
    }
    const filePath = (saveRes.data as { filePath?: string } | null)?.filePath;
    if (!filePath) return;

    const genRes = await window.electronAPI.documents.generateExcel(
      '29审计底稿汇总表',
      data as unknown as Record<string, unknown>,
      filePath
    );
    if (genRes.success) {
      successMessage.value = '汇总表已导出：' + filePath;
    } else {
      errorMessage.value = genRes.message || '导出失败';
    }
  } catch (e: unknown) {
    errorMessage.value = `导出失败：${(e as Error).message}`;
  } finally {
    exporting.value = false;
  }
}
</script>

<style scoped>
.gov-stage-card {
  background: linear-gradient(135deg, #fff 0%, #fffaf5 100%);
  border: 1px solid #e8d5b7;
  border-left: 4px solid #8B0000;
  border-radius: 8px;
}

.gov-step-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B0000, #B22222);
  color: #FFD700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(139, 0, 0, 0.2);
}

.gov-step-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.gov-table {
  width: 100%;
  font-size: 14px;
}

.gov-table thead {
  background: #fef3c7;
  border-bottom: 2px solid #e8d5b7;
}

.gov-table thead th {
  padding: 10px 12px;
  font-weight: 600;
  color: #374151;
  font-size: 13px;
  text-align: left;
  white-space: nowrap;
}

.gov-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
}

.gov-table tbody tr:hover {
  background: #fffaf5;
}

.gov-td {
  padding: 10px 12px;
  font-size: 14px;
  color: #1f2937;
  vertical-align: top;
  word-break: break-all;
}
</style>
