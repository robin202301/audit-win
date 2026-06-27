<template>
  <div class="card gov-stage-card">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <span class="gov-step-badge">
          {{ props.step.stepNumber }}
        </span>
        <h2 class="gov-step-title">{{ config.title }}</h2>
      </div>
      <div class="flex gap-2">
        <button v-if="config.fields.length > 0 && step.importFrom && step.importFrom.length > 0" class="gov-btn-secondary" @click="handleImport">
          导入前序数据
        </button>
        <button v-if="config.fields.length > 0 && hasSavedData && !isEditing" class="gov-btn-edit" @click="doEdit">修改</button>
        <button v-if="config.fields.length > 0 && isEditing" class="gov-btn-primary" @click="handleSave">
          <svg v-if="saving" class="w-3 h-3 mr-1 animate-spin" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="20 12"/>
          </svg>
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <button v-if="config.fields.length > 0 && hasSavedData && stepStatus !== 'completed' && !isEditing" class="gov-btn-complete" @click="handleMarkComplete">
          标记完成
        </button>
        <span v-if="stepStatus === 'completed'" class="gov-status-complete">已完成</span>
        <button class="gov-btn-export" @click="handleExport">导出文档</button>
      </div>
    </div>

    <!-- 数据引用提示 -->
    <div v-if="config.fields.length > 0 && step.importFrom && step.importFrom.length > 0" class="gov-import-hint">
      <span class="font-medium">数据来源：</span>
      <span v-for="srcKey in step.importFrom" :key="srcKey">
        {{ getStepLabel(srcKey) }}
      </span>
    </div>

    <!-- 纯导出页面提示 -->
    <div v-if="config.fields.length === 0" class="gov-export-hint">
      <svg class="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>
      <span>当前页面无需输入，请直接点击上方「导出文档」按钮导出模板。</span>
    </div>

    <!-- 编辑态：表单输入 -->
    <div v-if="config.fields.length > 0 && isEditing" :key="'edit-' + editKey" class="gov-form-grid">
      <div v-for="field in visibleFields" :key="field.key" :class="field.fullSpan ? 'gov-span-2' : ''">
        <label class="gov-field-label">{{ field.label }}</label>
        <textarea
          v-if="field.type === 'textarea'"
          v-model="formData[field.key]"
          class="gov-input gov-input-editable"
          :rows="field.rows || 3"
          :placeholder="field.placeholder || ''"
        />
        <input
          v-else-if="field.type === 'date'"
          v-model="formData[field.key]"
          type="date"
          class="gov-input gov-input-editable"
          :placeholder="field.placeholder || ''"
          @change="validateDateField(field.key)"
        />
        <input
          v-else
          v-model="formData[field.key]"
          class="gov-input gov-input-editable"
          :placeholder="field.placeholder || '请输入' + field.label"
        />
      </div>
    </div>

    <!-- 只读态：纯文本展示 -->
    <div v-else-if="config.fields.length > 0" :key="'view-' + editKey" class="gov-form-grid">
      <div v-for="field in visibleFields" :key="field.key" :class="field.fullSpan ? 'gov-span-2' : ''">
        <label class="gov-field-label">{{ field.label }}</label>
        <div class="gov-input gov-input-display">
          {{ displayValue(field) }}
        </div>
      </div>
    </div>

    <div v-if="saveError" class="gov-error-msg">{{ saveError }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import type { WorkflowStep } from '@shared/types';
import { STAGE_FORM_CONFIGS } from './stageConfigs';
import { NOTICE_TEMPLATES } from '@shared/types';

const props = defineProps<{
  projectId: number;
  step: WorkflowStep;
  projectInfo?: { name: string; auditedTarget: string; auditType: string };
}>();

const config = STAGE_FORM_CONFIGS[props.step.key];
if (!config) throw new Error(`未找到步骤 ${props.step.key} 的表单配置`);

// 动态解析模板（通知书根据审计类型选择模板）
const activeTemplate = computed(() => {
  if (props.step.key === 'notice' && props.projectInfo?.auditType) {
    return NOTICE_TEMPLATES[props.projectInfo.auditType as keyof typeof NOTICE_TEMPLATES] || config.template;
  }
  return config.template;
});

// 根据审计类型过滤字段
const visibleFields = computed(() => {
  if (!props.projectInfo?.auditType) return config.fields;
  return config.fields.filter(f => !f.auditTypes || f.auditTypes.includes(props.projectInfo!.auditType));
});

const formData = ref<Record<string, string>>({});
const saving = ref(false);
const saveError = ref<string | null>(null);
const hasSavedData = ref(false);
const isEditing = ref(true);
const editKey = ref(0);  // 用于强制 DOM 重新渲染
const stepStatus = ref<'not_started' | 'in_progress' | 'completed'>('not_started');

// 初始化表单字段（优先使用配置中的默认值）
for (const field of config.fields) {
  formData.value[field.key] = (config.defaultValues as Record<string, string>)?.[field.key] || '';
}

onMounted(async () => {
  // 从项目信息自动填充
  if (props.projectInfo && config.autoFillFromProject) {
    for (const [formKey, projectKey] of Object.entries(config.autoFillFromProject)) {
      if (!formData.value[formKey] && props.projectInfo) {
        formData.value[formKey] = (props.projectInfo as Record<string, string>)[projectKey] || '';
      }
    }
  }

  // 加载已保存的阶段数据
  try {
    const res = await window.electronAPI.stages.getByProjectId(props.projectId);
    if (res.success && res.data) {
      // 先自动导入前序步骤数据
      if (props.step.importFrom && props.step.importFrom.length > 0) {
        autoImportFromPreviousStages(res.data);
      }

      // 审计报告：跨表聚合底稿事实摘要到"发现的主要问题"
      if (props.step.key === 'report' && !formData.value['problemsFound']) {
        try {
          const wpRes = await window.electronAPI.workingPapers.getByProjectId(props.projectId);
          if (wpRes.success && wpRes.data && Array.isArray(wpRes.data) && wpRes.data.length > 0) {
            const sorted = (wpRes.data as Array<Record<string, unknown>>).sort((a, b) => {
              const ia = Number(a.indexNumber) || 0;
              const ib = Number(b.indexNumber) || 0;
              return ia - ib;
            });
            const lines = sorted.map((wp, i) => {
              const idx = wp.indexNumber || String(i + 1);
              const summary = (wp.factSummary as string) || '';
              const conclusion = (wp.auditConclusion as string) || '';
              if (!summary && !conclusion) return '';
              return `${idx}. ${summary}${conclusion ? '（结论：' + conclusion + '）' : ''}`;
            }).filter(Boolean);
            if (lines.length > 0) {
              formData.value['problemsFound'] = lines.join('\n');
            }
          }
        } catch {
          // ignore
        }
      }
      // 再加载当前步骤已保存数据（覆盖导入的数据）
      const stageData = res.data.find((s: { stage: string }) => s.stage === props.step.key);
      if (stageData && stageData.dataJson && stageData.dataJson !== '{}') {
        const parsed = JSON.parse(stageData.dataJson);
        for (const key of Object.keys(formData.value)) {
          if (parsed[key] !== undefined) {
            formData.value[key] = parsed[key];
          }
        }
        hasSavedData.value = true;
        isEditing.value = false;
        if (stageData.status) {
          stepStatus.value = stageData.status;
        }
      }
    }
  } catch {
    // ignore
  }
});

/** 自动从前序步骤导入数据（匹配同名字段） */
function autoImportFromPreviousStages(allData: { stage: string; dataJson: string }[]): void {
  if (!props.step.importFrom) return;
  for (const srcKey of props.step.importFrom) {
    const srcData = allData.find((s: { stage: string }) => s.stage === srcKey);
    if (srcData && srcData.dataJson && srcData.dataJson !== '{}') {
      try {
        const parsed = JSON.parse(srcData.dataJson);
        for (const key of Object.keys(parsed)) {
          if (formData.value[key] !== undefined && !formData.value[key] && parsed[key]) {
            formData.value[key] = parsed[key];
          }
        }
      } catch {
        // ignore
      }
    }
  }
}

/** 显示字段值（空值提示） */
function displayValue(field: { key: string; type?: string }): string {
  const val = formData.value[field.key];
  if (!val || val.trim() === '') return '（未填写）';
  return val;
}

/** 进入编辑模式 */
function doEdit(): void {
  isEditing.value = true;
  editKey.value++;  // 强制 DOM 重新创建元素
  saveError.value = null;
  nextTick(() => {
    const firstInput = document.querySelector('.gov-input-editable') as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
      // 对于非 textarea 和 date 的 input，尝试 select
      if (firstInput.tagName === 'INPUT' && firstInput.type !== 'date') {
        firstInput.select();
      }
    }
  });
}

/** 将 ISO 日期（2026-01-01）转换为中文格式（2026年1月1日） */
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

async function handleExport(): Promise<void> {
  const tmpl = activeTemplate.value;
  if (!tmpl) {
    alert('该步骤暂无导出模板');
    return;
  }
  try {
    const exportData: Record<string, string> = {};
    for (const field of config.fields) {
      const val = formData.value[field.key] || '';
      if (field.type === 'date' && val) {
        exportData[field.key] = formatDateToChinese(val);
      } else {
        exportData[field.key] = val;
      }
    }
    if (props.projectInfo) {
      if (!exportData.auditedUnit) exportData.auditedUnit = props.projectInfo.auditedTarget;
      // 被审计领导干部所在单位 = 被审计单位（避免重复字段）
      if (!exportData.auditedLeaderUnit) exportData.auditedLeaderUnit = exportData.auditedUnit || props.projectInfo.auditedTarget;
      if (!exportData.auditProject) exportData.auditProject = props.projectInfo.name;
      if (!exportData.projectName) exportData.projectName = props.projectInfo.name;
    }
    if (!exportData.content) exportData.content = '';
    if (!exportData.text) exportData.text = '';
    if (!exportData.name) exportData.name = '';
    if (!exportData.val) exportData.val = '';
    if (!exportData.shortText) exportData.shortText = '';
    if (!exportData.mediumText) exportData.mediumText = '';
    if (!exportData.shortContent) exportData.shortContent = '';

    const validRes = await window.electronAPI.templates.validate(tmpl, exportData);
    if (validRes.success && validRes.data && validRes.data.missing && validRes.data.missing.length > 0) {
      const missingList = validRes.data.missing.join('、');
      if (!confirm(`以下占位符为空：${missingList}\n\n是否仍要继续导出？`)) {
        return;
      }
    }

    const isExcel = config.exportFile.endsWith('.xls') || config.exportFile.endsWith('.xlsx');
    const res = await window.electronAPI.documents.openSaveDialog(config.exportFile);
    if (res.success && res.data) {
      let genRes;
      if (isExcel) {
        genRes = await window.electronAPI.documents.generateExcel(tmpl, exportData, res.data.filePath);
      } else {
        genRes = await window.electronAPI.documents.generate(tmpl, exportData, res.data.filePath);
      }
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

async function handleImport(): Promise<void> {
  if (!props.step.importFrom || props.step.importFrom.length === 0) return;
  try {
    const res = await window.electronAPI.stages.getByProjectId(props.projectId);
    if (!res.success || !res.data) {
      alert('无已保存的前序数据');
      return;
    }
    let imported = 0;
    for (const srcKey of props.step.importFrom) {
      const srcData = res.data.find((s: { stage: string }) => s.stage === srcKey);
      if (srcData && srcData.dataJson && srcData.dataJson !== '{}') {
        const parsed = JSON.parse(srcData.dataJson);
        for (const key of Object.keys(parsed)) {
          if (formData.value[key] !== undefined && !formData.value[key]) {
            formData.value[key] = parsed[key];
            imported++;
          }
        }
      }
    }
    if (imported > 0) {
      alert(`已导入 ${imported} 个字段的数据`);
    } else {
      alert('无可导入的数据（字段已填写或前序步骤无数据）');
    }
  } catch (e: unknown) {
    alert('导入失败：' + (e as Error).message);
  }
}

function getStepLabel(key: string): string {
  const allSteps = [
    { key: 'work_plan', label: '审计工作方案' },
    { key: 'notice', label: '审计通知' },
    { key: 'survey', label: '被审计单位基本情况表' },
    { key: 'survey_assessment', label: '评估重要性可能性' },
    { key: 'survey_measures', label: '确定审计事项和应对措施' },
    { key: 'plan', label: '审计实施方案' },
    { key: 'task_list', label: '任务清单' },
    { key: 'evidence', label: '审计取证单' },
    { key: 'working_paper', label: '审计底稿' },
    { key: 'task_list_completion', label: '任务清单完成情况' },
    { key: 'report', label: '审计组审计报告' },
    { key: 'report_consultation', label: '审计报告征求意见书' },
    { key: 'audit_opinion', label: '审核意见' },
    { key: 'review_opinion', label: '复核意见' },
    { key: 'adjudication_opinion', label: '审理意见' },
    { key: 'adjudication_meeting', label: '审理会纪要' },
    { key: 'external_report', label: '对外报告' },
  ];
  const found = allSteps.find(s => s.key === key);
  return found ? found.label : key;
}

// ========== 日期校验 ==========
const noticeSaveDate = ref<string | null>(null);

function validateDateField(_fieldKey: string): void {
  if (props.step.key === 'notice') return;
  if (!noticeSaveDate.value) return;

  const noticeDate = new Date(noticeSaveDate.value);
  const dateFields = config.fields.filter(f => f.type === 'date');
  for (const field of dateFields) {
    // 送达回证的送达日期应早于审计开始日期，走专属校验逻辑
    if (props.step.key === 'delivery_receipt' && field.key === 'deliveryDate') continue;
    const val = formData.value[field.key];
    if (val && new Date(val) < noticeDate) {
      saveError.value = `${field.label} 不能早于审计通知书的审计开始日期`;
      return;
    }
  }

  // 送达回证：送达日期须在审计开始日期前至少3天
  if (props.step.key === 'delivery_receipt') {
    const deliveryVal = formData.value['deliveryDate'];
    if (deliveryVal) {
      const diff = noticeDate.getTime() - new Date(deliveryVal).getTime();
      const daysDiff = diff / (1000 * 60 * 60 * 24);
      if (daysDiff < 3) {
        saveError.value = '送达日期须在审计开始日期前至少3天';
        return;
      }
    }
  }

  saveError.value = null;
}

async function checkNoticeSaved(): Promise<boolean> {
  if (props.step.key === 'notice') return true;
  try {
    const res = await window.electronAPI.stages.getByProjectId(props.projectId);
    if (res.success && res.data) {
      const noticeData = res.data.find((s: { stage: string }) => s.stage === 'notice');
      if (noticeData && noticeData.dataJson && noticeData.dataJson !== '{}') {
        const parsed = JSON.parse(noticeData.dataJson);
        if (parsed.auditStartDate) {
          noticeSaveDate.value = parsed.auditStartDate;
          return true;
        }
      }
    }
  } catch { /* ignore */ }
  return false;
}

function validateAllDates(): boolean {
  if (props.step.key === 'notice') return true;
  if (!noticeSaveDate.value) return true;

  const noticeDate = new Date(noticeSaveDate.value);
  const dateFields = config.fields.filter(f => f.type === 'date');
  for (const field of dateFields) {
    // 送达回证的送达日期应早于审计开始日期，走专属校验逻辑
    if (props.step.key === 'delivery_receipt' && field.key === 'deliveryDate') continue;
    const val = formData.value[field.key];
    if (val && new Date(val) < noticeDate) {
      saveError.value = `${field.label} 不能早于审计通知书的审计开始日期`;
      return false;
    }
  }

  // 送达回证：送达日期须在审计开始日期前至少3天
  if (props.step.key === 'delivery_receipt') {
    const deliveryVal = formData.value['deliveryDate'];
    if (deliveryVal) {
      const diff = noticeDate.getTime() - new Date(deliveryVal).getTime();
      const daysDiff = diff / (1000 * 60 * 60 * 24);
      if (daysDiff < 3) {
        saveError.value = '送达日期须在审计开始日期前至少3天';
        return false;
      }
    }
  }

  return true;
}

/** 保存前校验 */
async function handleSave(): Promise<void> {
  if (props.step.key !== 'notice') {
    const noticeOk = await checkNoticeSaved();
    if (!noticeOk) {
      saveError.value = '请先保存审计通知书后才能开启后续阶段';
      return;
    }
    if (!validateAllDates()) return;
  }

  saving.value = true;
  saveError.value = null;
  try {
    const res = await window.electronAPI.stages.updateData(
      props.projectId,
      props.step.key,
      JSON.stringify(formData.value),
      'in_progress'
    );
    if (res.success) {
      hasSavedData.value = true;
      isEditing.value = false;
      stepStatus.value = 'in_progress';
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

async function handleMarkComplete(): Promise<void> {
  try {
    const res = await window.electronAPI.stages.updateData(
      props.projectId,
      props.step.key,
      JSON.stringify(formData.value),
      'completed'
    );
    if (res.success) {
      stepStatus.value = 'completed';
      alert('已标记为完成');
    } else {
      alert('操作失败：' + (res.message || '未知错误'));
    }
  } catch (e: unknown) {
    alert('操作失败：' + (e as Error).message);
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

.gov-btn-secondary {
  padding: 6px 14px;
  background: #fff;
  border: 1px solid #e8d5b7;
  border-radius: 6px;
  color: #8B0000;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.gov-btn-secondary:hover {
  background: #fff8f0;
  border-color: #c2410c;
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

.gov-btn-complete {
  padding: 6px 14px;
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
}

.gov-btn-complete:hover {
  background: linear-gradient(135deg, #047857, #059669);
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

.gov-export-hint {
  margin-bottom: 16px;
  padding: 16px 20px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  font-size: 14px;
  color: #166534;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.gov-form-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(1, 1fr);
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
</style>
