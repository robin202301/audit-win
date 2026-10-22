<template>
  <div>
    <!-- 底稿列表 -->
    <div class="card gov-stage-card">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <span class="gov-step-badge">11</span>
          <h2 class="gov-step-title">审计工作底稿</h2>
        </div>
        <button class="gov-btn-primary" @click="openForm">新增底稿</button>
      </div>

      <div v-if="loading" class="text-center py-4 text-gray-500">加载中...</div>
      <div v-else-if="paperList.length === 0" class="text-center py-8 text-gray-400">暂无底稿，请从取证单生成或手动新增</div>
      <table v-else class="gov-table">
        <thead>
          <tr>
            <th class="text-left">索引号</th>
            <th class="text-left">审计事项</th>
            <th class="text-left">审计人员</th>
            <th class="text-left">编制日期</th>
            <th class="text-left">审核意见</th>
            <th class="text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paperList" :key="item.id" class="border-b hover:bg-gray-50">
            <td class="gov-td">{{ item.indexNumber }}</td>
            <td class="gov-td max-w-xs truncate">{{ item.auditMatter }}</td>
            <td class="gov-td">{{ item.auditorName }}</td>
            <td class="gov-td">{{ item.compileDate }}</td>
            <td class="gov-td">{{ item.reviewerOpinion || '待审核' }}</td>
            <td class="gov-td">
              <div class="flex gap-2">
                <button class="gov-btn-link gov-btn-link-edit" @click="editPaper(item)">编辑</button>
                <button class="gov-btn-link gov-btn-link-export" @click="exportPaper(item)">导出</button>
                <button class="gov-btn-link gov-btn-link-delete" @click="deletePaper(item.id)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 底稿编辑弹窗 -->
    <div v-if="showForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold mb-4">{{ formTitle }}</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="gov-field-label">索引号</label>
            <input v-model="formData.indexNumber" class="gov-input gov-input-editable" placeholder="请输入索引号" />
          </div>
          <div>
            <label class="gov-field-label">项目名称</label>
            <input v-model="formData.projectName" class="gov-input gov-input-editable" placeholder="请输入项目名称" />
          </div>
          <div class="md:col-span-2">
            <label class="gov-field-label">引用取证单摘要</label>
            <select v-model="summarySelect" class="gov-input gov-input-editable" @change="applySummaryReference">
              <option value="">不引用（手动填写下方审计事项）</option>
              <option v-for="(opt, i) in evidenceSummaries" :key="i" :value="String(i)">{{ opt.label }}</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="gov-field-label">审计（调查）事项</label>
            <textarea v-model="formData.auditMatter" class="gov-input gov-input-editable" rows="2" placeholder="请输入审计事项" />
          </div>
          <div>
            <label class="gov-field-label">审计人员</label>
            <input v-model="formData.auditorName" class="gov-input gov-input-editable" placeholder="请输入审计人员" />
          </div>
          <div>
            <label class="gov-field-label">编制日期</label>
            <input v-model="formData.compileDate" type="date" class="gov-input gov-input-editable" />
          </div>
          <div class="md:col-span-2">
            <label class="gov-field-label">审计过程</label>
            <textarea v-model="formData.auditProcess" class="gov-input gov-input-editable" rows="4" placeholder="说明实施审计的主要步骤和方法、所取得的审计证据" />
          </div>
          <div class="md:col-span-2">
            <label class="gov-field-label">审计认定的事实摘要</label>
            <textarea v-model="formData.factSummary" class="gov-input gov-input-editable" rows="3" placeholder="请输入审计认定的事实摘要" />
          </div>
          <div class="md:col-span-2">
            <label class="gov-field-label">审计结论</label>
            <textarea v-model="formData.auditConclusion" class="gov-input gov-input-editable" rows="3" placeholder="请输入审计结论" />
          </div>
          <div>
            <label class="gov-field-label">审核人员</label>
            <input v-model="formData.reviewerName" class="gov-input gov-input-editable" placeholder="请输入审核人员" />
          </div>
          <div>
            <label class="gov-field-label">审核日期</label>
            <input v-model="formData.reviewDate" type="date" class="gov-input gov-input-editable" />
          </div>
          <div class="md:col-span-2">
            <label class="gov-field-label">审核意见</label>
            <select v-model="formData.reviewerOpinion" class="gov-input gov-input-editable">
              <option value="">请选择审核意见</option>
              <option value="予以认可">予以认可</option>
              <option value="责成采取进一步审计措施">责成采取进一步审计措施，获取适当、充分的审计证据</option>
              <option value="纠正或责成纠正">纠正或者责成纠正不恰当的审计结论</option>
            </select>
          </div>
          <div>
            <label class="gov-field-label">附件页数</label>
            <input v-model.number="formData.attachmentCount" type="number" class="gov-input gov-input-editable" placeholder="请输入附件页数" />
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn-secondary" @click="closeForm">取消</button>
          <button class="btn-primary" @click="handleSaveForm">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { buildWorkingPaperExportData, computeNextIndexNumber, parseSummaryItems } from './paperUtils';

const props = defineProps<{ projectId: number; projectInfo?: { name: string; auditedTarget: string; auditType: string } }>();

const route = useRoute();

interface PaperRow {
  id: number;
  indexNumber: string;
  projectName: string;
  auditMatter: string;
  auditorName: string;
  compileDate: string;
  auditProcess: string;
  factSummary: string;
  auditConclusion: string;
  reviewerOpinion: string;
  reviewerName: string;
  reviewDate: string;
  attachmentCount: number;
}

const paperList = ref<PaperRow[]>([]);
const loading = ref(false);
const showForm = ref(false);
const editingId = ref<number | null>(null);
/** 当前项目取证单摘要选项（label 用于展示，content 引用后填入审计事项） */
const evidenceSummaries = ref<Array<{ label: string; content: string }>>([]);
const summarySelect = ref('');

const formData = ref({
  indexNumber: '',
  projectName: '',
  auditMatter: '',
  auditorName: '',
  compileDate: '',
  auditProcess: '',
  factSummary: '',
  auditConclusion: '',
  reviewerOpinion: '',
  reviewerName: '',
  reviewDate: '',
  attachmentCount: 0,
});

const formTitle = computed(() => {
  return editingId.value ? '编辑底稿' : '新增底稿';
});

/** 通知书中的项目名称/被审计单位（通知书修正值优先于项目初始信息） */
const noticeProjectName = ref('');
const noticeAuditedUnit = ref('');

/** 加载通知书保存的项目名称/被审计单位，供表单与导出兜底引用 */
async function loadNoticeFields(): Promise<void> {
  try {
    const res = await window.electronAPI.stages.getByProjectId(props.projectId);
    if (!res.success || !res.data) return;
    const notice = (res.data as Array<{ stage: string; dataJson: string }>).find(s => s.stage === 'notice');
    if (!notice || !notice.dataJson || notice.dataJson === '{}') return;
    const parsed = JSON.parse(notice.dataJson) as Record<string, string>;
    noticeProjectName.value = parsed.projectName || '';
    noticeAuditedUnit.value = parsed.auditedUnit || '';
  } catch (e) {
    // 通知书读取失败不阻塞底稿表单（回落项目信息）
    console.error('底稿读取通知书数据失败：', e);
  }
}

function resetForm(): void {
  formData.value = {
    indexNumber: '',
    projectName: noticeProjectName.value || props.projectInfo?.name || '',
    auditMatter: '',
    auditorName: '',
    compileDate: '',
    auditProcess: '',
    factSummary: '',
    auditConclusion: '',
    reviewerOpinion: '',
    reviewerName: '',
    reviewDate: '',
    attachmentCount: 0,
  };
}

onMounted(async () => {
  await loadPapers();
  await loadEvidenceSummaries();
  await loadNoticeFields();

  // 检查是否从取证单跳转而来（带预填数据）
  if (route.query.fromEvidence === '1') {
    resetForm();
    if (route.query.projectName) {
      formData.value.projectName = String(route.query.projectName);
    }
    if (route.query.matterContent) {
      formData.value.auditMatter = String(route.query.matterContent);
    }
    if (route.query.matterIndex) {
      formData.value.indexNumber = String(route.query.matterIndex);
    } else {
      formData.value.indexNumber = computeNextIndexNumber(paperList.value.map(p => p.indexNumber));
    }
    showForm.value = true;
  }
});

async function loadPapers(): Promise<void> {
  loading.value = true;
  try {
    const res = await window.electronAPI.workingPapers.getByProjectId(props.projectId);
    if (res.success && res.data) {
      paperList.value = res.data;
    }
  } finally {
    loading.value = false;
  }
}

function openForm(): void {
  resetForm();
  editingId.value = null;
  // 索引号在当前项目内依次递增（不同项目独立计数）
  formData.value.indexNumber = computeNextIndexNumber(paperList.value.map(p => p.indexNumber));
  summarySelect.value = '';
  showForm.value = true;
}

/** 从下拉选项引用取证单摘要 → 填入审计（调查）事项 */
function applySummaryReference(): void {
  const idx = Number(summarySelect.value);
  const opt = evidenceSummaries.value[idx];
  if (opt) {
    formData.value.auditMatter = opt.content;
  }
}

/** 加载当前项目取证单的审计事项摘要，供底稿下拉引用 */
async function loadEvidenceSummaries(): Promise<void> {
  try {
    const res = await window.electronAPI.evidence.getByProjectId(props.projectId);
    if (!res.success || !res.data) return;
    const options: Array<{ label: string; content: string }> = [];
    (res.data as Array<{ serialNumber?: string; summaryText?: string }>).forEach(ev => {
      parseSummaryItems(ev.summaryText || '').forEach((content, i) => {
        const serial = ev.serialNumber || '取证单';
        const preview = content.length > 20 ? content.slice(0, 20) + '…' : content;
        options.push({ label: `${serial} · 摘要${i + 1}：${preview}`, content });
      });
    });
    evidenceSummaries.value = options;
  } catch (e: unknown) {
    // 摘要加载失败不阻塞底稿表单，仅下拉为空
    console.error('加载取证单摘要失败：', e);
  }
}

function closeForm(): void {
  showForm.value = false;
  editingId.value = null;
}

function editPaper(item: PaperRow): void {
  editingId.value = item.id;
  summarySelect.value = '';
  formData.value = {
    indexNumber: item.indexNumber,
    projectName: item.projectName,
    auditMatter: item.auditMatter,
    auditorName: item.auditorName,
    compileDate: item.compileDate,
    auditProcess: item.auditProcess,
    factSummary: item.factSummary,
    auditConclusion: item.auditConclusion,
    reviewerOpinion: item.reviewerOpinion,
    reviewerName: item.reviewerName,
    reviewDate: item.reviewDate,
    attachmentCount: item.attachmentCount,
  };
  showForm.value = true;
}

async function handleSaveForm(): Promise<void> {
  try {
    const data = { projectId: props.projectId, ...formData.value };
    if (editingId.value) {
      const res = await window.electronAPI.workingPapers.update(editingId.value, data);
      if (res.success) {
        closeForm();
        await loadPapers();
      }
    } else {
      const res = await window.electronAPI.workingPapers.create(data);
      if (res.success) {
        // 如果从取证单跳转，建立关联
        const evidenceId = route.query.evidenceId ? Number(route.query.evidenceId) : null;
        if (evidenceId && res.data?.id) {
          await window.electronAPI.evidencePaperLinks.create({
            projectId: props.projectId,
            evidenceId,
            workingPaperId: res.data.id,
          });
        }
        closeForm();
        await loadPapers();
      }
    }
  } catch (e: unknown) {
    alert('保存失败：' + (e as Error).message);
  }
}

async function deletePaper(id: number): Promise<void> {
  if (confirm('确定要删除该底稿吗？')) {
    await window.electronAPI.workingPapers.delete(id);
    await loadPapers();
  }
}

async function exportPaper(item: PaperRow): Promise<void> {
  try {
    const res = await window.electronAPI.documents.openSaveDialog(`审计底稿_${item.indexNumber}.docx`);
    if (res.success && res.data) {
      // 模板占位符 auditedUnit（被审计单位）不在底稿表单字段中，
      // 优先取通知书中的被审计单位（修正值），项目信息兜底；
      // 其余正文/签名/日期字段由纯函数统一映射，日期导出为中文格式
      const exportData = buildWorkingPaperExportData(item, {
        projectName: noticeProjectName.value || props.projectInfo?.name || '',
        auditedUnit: noticeAuditedUnit.value || props.projectInfo?.auditedTarget || '',
      });
      const genRes = await window.electronAPI.documents.generate(
        '16审计工作底稿',
        exportData,
        res.data.filePath
      );
      if (genRes.success) {
        alert('文档已导出：' + res.data!.filePath);
      } else {
        alert('导出失败：' + (genRes.message || '未知错误'));
      }
    }
  } catch (e: unknown) {
    alert('导出失败：' + (e as Error).message);
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

.gov-btn-primary {
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

.gov-btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #a00000, #c42828);
  transform: translateY(-1px);
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
}

.gov-btn-link {
  background: none;
  border: none;
  font-size: 13px;
  cursor: pointer;
  padding: 2px 4px;
}

.gov-btn-link-edit {
  color: #2563eb;
}

.gov-btn-link-edit:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.gov-btn-link-export {
  color: #059669;
}

.gov-btn-link-export:hover {
  color: #047857;
  text-decoration: underline;
}

.gov-btn-link-delete {
  color: #dc2626;
}

.gov-btn-link-delete:hover {
  color: #b91c1c;
  text-decoration: underline;
}

.gov-field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.gov-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #1f2937;
  background: #faf8f5;
  font-family: inherit;
  line-height: 1.6;
  box-sizing: border-box;
  word-break: break-all;
  white-space: pre-wrap;
  min-height: 36px;
}

.gov-input-editable {
  transition: border-color 0.2s;
}

.gov-input-editable:focus {
  outline: none;
  border-color: #8B0000;
  box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
}
</style>
