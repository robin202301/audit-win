<template>
  <div class="card gov-stage-card">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <span class="gov-step-badge">10</span>
        <h2 class="gov-step-title">审计取证单</h2>
      </div>
      <div class="flex gap-2">
        <button v-if="hasSavedData && !isEditing" class="gov-btn-edit" @click="doEdit">修改</button>
        <button v-if="isEditing" class="gov-btn-primary" @click="handleSave">
          <svg v-if="saving" class="w-3 h-3 mr-1 animate-spin" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="20 12"/>
          </svg>
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <span v-if="stepStatus === 'completed'" class="gov-status-complete">已完成</span>
        <button class="gov-btn-export" @click="handleExport">导出文档</button>
      </div>
    </div>

    <!-- 数据来源提示 -->
    <div class="gov-import-hint">
      <span class="font-medium">数据来源：</span>审计通知书
    </div>

    <!-- 编辑态 -->
    <div v-if="isEditing" :key="'edit-' + editKey">
      <!-- 基础信息 -->
      <div class="gov-form-grid">
        <div>
          <label class="gov-field-label">编号</label>
          <input v-model="formData.serialNumber" class="gov-input gov-input-editable" placeholder="请输入编号" />
        </div>
        <div>
          <label class="gov-field-label">项目名称</label>
          <input v-model="formData.projectName" class="gov-input gov-input-editable" placeholder="请输入项目名称" />
        </div>
        <div>
          <label class="gov-field-label">被审计（调查）单位</label>
          <input v-model="formData.auditedUnit" class="gov-input gov-input-editable" placeholder="请输入被审计单位" />
        </div>
        <div>
          <label class="gov-field-label">审计人员</label>
          <input v-model="formData.auditorName" class="gov-input gov-input-editable" placeholder="请输入审计人员" />
        </div>
        <div>
          <label class="gov-field-label">编制日期</label>
          <input v-model="formData.compileDate" type="date" class="gov-input gov-input-editable" />
        </div>
        <div>
          <label class="gov-field-label">反馈截止日期</label>
          <input v-model="formData.feedbackDeadline" type="date" class="gov-input gov-input-editable" />
        </div>
        <div class="gov-span-2">
          <label class="gov-field-label">法律法规依据</label>
          <textarea v-model="formData.legalBasis" class="gov-input gov-input-editable" rows="3" placeholder="请输入法律法规依据" />
        </div>
        <div class="gov-span-2">
          <label class="gov-field-label">证据提供单位意见</label>
          <textarea v-model="formData.providerOpinion" class="gov-input gov-input-editable" rows="2" placeholder="请输入证据提供单位意见" />
        </div>
        <div>
          <label class="gov-field-label">证据提供单位盖章/签名</label>
          <input v-model="formData.providerSignature" class="gov-input gov-input-editable" placeholder="请输入签名" />
        </div>
      </div>

      <!-- 审计事项列表 -->
      <div class="gov-matters-section">
        <div class="gov-matters-header">
          <h3 class="gov-matters-title">审计（调查）事项</h3>
          <button class="gov-btn-add-matter" @click="addMatter">+ 添加事项</button>
        </div>
        <div v-if="matters.length === 0" class="gov-matters-empty">
          暂无审计事项，请点击上方"添加事项"开始录入
        </div>
        <div v-for="(matter, index) in matters" :key="index" class="gov-matter-item">
          <div class="gov-matter-item-header">
            <span class="gov-matter-item-number">事项 {{ index + 1 }}</span>
            <button class="gov-btn-remove-matter" @click="removeMatter(index)" :disabled="matters.length <= 1">删除</button>
          </div>
          <textarea
            v-model="matter.content"
            class="gov-input gov-input-editable gov-matter-textarea"
            rows="4"
            :placeholder="'请输入第 ' + (index + 1) + ' 个审计事项的内容'"
          />
        </div>
      </div>
    </div>

    <!-- 只读态 -->
    <div v-else :key="'view-' + editKey">
      <!-- 基础信息 -->
      <div class="gov-form-grid">
        <div>
          <label class="gov-field-label">编号</label>
          <div class="gov-input gov-input-display">{{ formData.serialNumber || '（未填写）' }}</div>
        </div>
        <div>
          <label class="gov-field-label">项目名称</label>
          <div class="gov-input gov-input-display">{{ formData.projectName || '（未填写）' }}</div>
        </div>
        <div>
          <label class="gov-field-label">被审计（调查）单位</label>
          <div class="gov-input gov-input-display">{{ formData.auditedUnit || '（未填写）' }}</div>
        </div>
        <div>
          <label class="gov-field-label">审计人员</label>
          <div class="gov-input gov-input-display">{{ formData.auditorName || '（未填写）' }}</div>
        </div>
        <div>
          <label class="gov-field-label">编制日期</label>
          <div class="gov-input gov-input-display">{{ formData.compileDate || '（未填写）' }}</div>
        </div>
        <div>
          <label class="gov-field-label">反馈截止日期</label>
          <div class="gov-input gov-input-display">{{ formData.feedbackDeadline || '（未填写）' }}</div>
        </div>
        <div class="gov-span-2">
          <label class="gov-field-label">法律法规依据</label>
          <div class="gov-input gov-input-display">{{ formData.legalBasis || '（未填写）' }}</div>
        </div>
        <div class="gov-span-2">
          <label class="gov-field-label">证据提供单位意见</label>
          <div class="gov-input gov-input-display">{{ formData.providerOpinion || '（未填写）' }}</div>
        </div>
        <div>
          <label class="gov-field-label">证据提供单位盖章/签名</label>
          <div class="gov-input gov-input-display">{{ formData.providerSignature || '（未填写）' }}</div>
        </div>
      </div>

      <!-- 审计事项列表（只读） -->
      <div class="gov-matters-section">
        <h3 class="gov-matters-title">审计（调查）事项</h3>
        <div v-if="matters.length === 0" class="gov-matters-empty">
          暂无审计事项
        </div>
        <div v-for="(matter, index) in matters" :key="index" class="gov-matter-item-readonly">
          <div class="gov-matter-item-header">
            <span class="gov-matter-item-number">事项 {{ index + 1 }}</span>
          </div>
          <div class="gov-input gov-input-display gov-matter-textarea-readonly">{{ matter.content || '（未填写）' }}</div>
          <div class="gov-matter-actions">
            <span v-if="paperStatus[index]" class="gov-paper-status-done">已生成底稿</span>
            <button v-else class="gov-btn-generate-paper" @click="generatePaper(index)">生成底稿</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="saveError" class="gov-error-msg">{{ saveError }}</div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  projectId: number;
  projectInfo?: { name: string; auditedTarget: string; auditType: string };
}>();

const router = useRouter();

interface MatterItem {
  content: string;
}

const formData = ref({
  serialNumber: '',
  projectName: '',
  auditedUnit: '',
  legalBasis: '',
  auditorName: '',
  compileDate: '',
  providerOpinion: '',
  providerSignature: '',
  feedbackDeadline: '',
});

const matters = ref<MatterItem[]>([{ content: '' }]);
const saving = ref(false);
const saveError = ref<string | null>(null);
const hasSavedData = ref(false);
const isEditing = ref(true);
const editKey = ref(0);
const stepStatus = ref<'not_started' | 'in_progress' | 'completed'>('not_started');
const paperStatus = ref<Record<number, boolean>>({});
const evidenceId = ref<number | null>(null);

onMounted(async () => {
  // 自动填充项目信息
  if (props.projectInfo) {
    formData.value.projectName = props.projectInfo.name;
    formData.value.auditedUnit = props.projectInfo.auditedTarget;
  }

  // 加载已保存的取证单
  try {
    const res = await window.electronAPI.evidence.getByProjectId(props.projectId);
    if (res.success && res.data && res.data.length > 0) {
      const item = res.data[0];
      evidenceId.value = item.id;
      formData.value = {
        serialNumber: item.serialNumber || '',
        projectName: item.projectName || props.projectInfo?.name || '',
        auditedUnit: item.auditedUnit || props.projectInfo?.auditedTarget || '',
        legalBasis: item.legalBasis || '',
        auditorName: item.auditorName || '',
        compileDate: item.compileDate || '',
        providerOpinion: item.providerOpinion || '',
        providerSignature: item.providerSignature || '',
        feedbackDeadline: item.feedbackDeadline || '',
      };
      // 解析事项列表
      if (item.matterSummary) {
        try {
          const parsed = JSON.parse(item.matterSummary);
          if (Array.isArray(parsed) && parsed.length > 0) {
            matters.value = parsed.map((m: { content: string }) => ({ content: m.content || '' }));
          } else if (typeof parsed === 'string' && parsed) {
            matters.value = [{ content: parsed }];
          }
        } catch {
          if (item.matterSummary) {
            matters.value = [{ content: item.matterSummary }];
          }
        }
      }
      if (matters.value.length === 0) {
        matters.value = [{ content: '' }];
      }
      hasSavedData.value = true;
      isEditing.value = false;

      // 加载底稿关联状态
      await loadPaperStatus();
    }
  } catch {
    // ignore
  }
});

async function loadPaperStatus(): Promise<void> {
  if (!evidenceId.value) return;
  try {
    const res = await window.electronAPI.evidencePaperLinks.getByEvidence(evidenceId.value);
    if (res.success && res.data) {
      const status: Record<number, boolean> = {};
      for (let i = 0; i < matters.value.length; i++) {
        status[i] = (res.data as any[]).length > i;
      }
      paperStatus.value = status;
    }
  } catch {
    // ignore
  }
}

function doEdit(): void {
  isEditing.value = true;
  editKey.value++;
  saveError.value = null;
  nextTick(() => {
    const firstInput = document.querySelector('.gov-input-editable') as HTMLInputElement;
    if (firstInput) firstInput.focus();
  });
}

function addMatter(): void {
  matters.value.push({ content: '' });
}

function removeMatter(index: number): void {
  if (matters.value.length <= 1) return;
  matters.value.splice(index, 1);
}

function formatDateToChinese(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  } catch {
    return dateStr;
  }
}

/** 将事项列表拼接为导出文本 */
function buildAuditedItems(): string {
  return matters.value
    .filter(m => m.content && m.content.trim())
    .map((m, i) => `${i + 1}. ${m.content.trim()}`)
    .join('\n');
}

async function handleSave(): Promise<void> {
  saving.value = true;
  saveError.value = null;
  try {
    const data = {
      projectId: props.projectId,
      ...formData.value,
      matterSummary: JSON.stringify(matters.value),
    };

    let res;
    if (evidenceId.value) {
      res = await window.electronAPI.evidence.update(evidenceId.value, data);
    } else {
      res = await window.electronAPI.evidence.create(data);
      if (res.success && res.data?.id) {
        evidenceId.value = res.data.id;
      }
    }

    if (res.success) {
      hasSavedData.value = true;
      isEditing.value = false;
      stepStatus.value = 'in_progress';
      await loadPaperStatus();
      alert('保存成功');
    } else {
      saveError.value = res.message || '保存失败';
    }
  } catch (e: unknown) {
    saveError.value = `保存失败：${(e as Error).message}`;
  } finally {
    saving.value = false;
  }
}

async function handleExport(): Promise<void> {
  try {
    const exportData: Record<string, string> = {
      serialNumber: formData.value.serialNumber || '',
      projectName: formData.value.projectName || '',
      auditedUnit: formData.value.auditedUnit || '',
      auditedItems: buildAuditedItems(),
      legalBasis: formData.value.legalBasis || '',
      auditorName: formData.value.auditorName || '',
      compileDate: formatDateToChinese(formData.value.compileDate),
      providerOpinion: formData.value.providerOpinion || '',
      providerSignature: formData.value.providerSignature || '',
      feedbackDeadline: formatDateToChinese(formData.value.feedbackDeadline),
    };

    const res = await window.electronAPI.documents.openSaveDialog('审计取证单.docx');
    if (res.success && res.data) {
      const genRes = await window.electronAPI.documents.generate('11审计取证单', exportData, res.data.filePath);
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

/** 从事项生成底稿 — 跳转到底稿页面并预填 */
function generatePaper(index: number): void {
  const matterContent = matters.value[index]?.content || '';
  router.push({
    path: `/stage/${props.projectId}/working_paper`,
    query: {
      fromEvidence: '1',
      evidenceId: String(evidenceId.value || ''),
      matterIndex: String(index + 1),
      matterContent,
    },
  });
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

.gov-btn-edit {
  padding: 6px 14px;
  background: #fff7ed;
  border: 1px solid #fdba74;
  border-radius: 6px;
  color: #c2410c;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.gov-btn-edit:hover {
  background: #ffedd5;
  border-color: #f97316;
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

.gov-btn-export {
  padding: 6px 14px;
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

.gov-status-complete {
  padding: 6px 14px;
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #6ee7b7;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.gov-import-hint {
  margin-bottom: 16px;
  padding: 10px 14px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  font-size: 13px;
  color: #92400e;
}

.gov-form-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(1, 1fr);
  margin-bottom: 24px;
}

@media (min-width: 768px) {
  .gov-form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.gov-span-2 {
  grid-column: 1 / -1;
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

.gov-input-display {
  background: #f3f4f6;
  color: #6b7280;
  cursor: default;
  border-color: #e5e7eb;
}

.gov-error-msg {
  margin-top: 16px;
  color: #dc2626;
  font-size: 13px;
}

/* 审计事项区域 */
.gov-matters-section {
  margin-top: 8px;
  padding: 16px;
  background: #fffaf5;
  border: 1px solid #e8d5b7;
  border-radius: 8px;
}

.gov-matters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.gov-matters-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.gov-btn-add-matter {
  padding: 4px 12px;
  background: linear-gradient(135deg, #8B0000, #B22222);
  color: #FFD700;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.gov-btn-add-matter:hover {
  background: linear-gradient(135deg, #a00000, #c42828);
}

.gov-matters-empty {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 14px;
}

.gov-matter-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e8d5b7;
  border-radius: 6px;
}

.gov-matter-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.gov-matter-item-number {
  font-size: 14px;
  font-weight: 600;
  color: #8B0000;
}

.gov-btn-remove-matter {
  padding: 2px 8px;
  background: #fff;
  border: 1px solid #fecaca;
  border-radius: 4px;
  color: #dc2626;
  font-size: 12px;
  cursor: pointer;
}

.gov-btn-remove-matter:hover:not(:disabled) {
  background: #fef2f2;
}

.gov-btn-remove-matter:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.gov-matter-textarea {
  min-height: 80px;
  resize: vertical;
}

.gov-matter-item-readonly {
  margin-bottom: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e8d5b7;
  border-radius: 6px;
}

.gov-matter-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 8px;
  gap: 8px;
}

.gov-paper-status-done {
  padding: 4px 12px;
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #6ee7b7;
  border-radius: 4px;
  font-size: 12px;
}

.gov-btn-generate-paper {
  padding: 4px 12px;
  background: linear-gradient(135deg, #8B0000, #B22222);
  color: #FFD700;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.gov-btn-generate-paper:hover {
  background: linear-gradient(135deg, #a00000, #c42828);
}

.gov-matter-textarea-readonly {
  min-height: 60px;
}
</style>
