<template>
  <div class="card gov-stage-card">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <span class="gov-step-badge">{{ step.stepNumber }}</span>
        <h2 class="gov-step-title">{{ config.title }}</h2>
      </div>
      <div class="flex gap-2">
        <button v-if="stepStatus !== 'completed'" class="gov-btn-complete" @click="handleMarkComplete">标记完成</button>
        <span v-if="stepStatus === 'completed'" class="gov-status-complete">已完成</span>
        <button v-if="activeTabConfig.fields.length > 0 && hasSavedData && !isEditing" class="gov-btn-edit" @click="doEdit">修改</button>
        <button v-if="activeTabConfig.fields.length > 0 && isEditing" class="gov-btn-primary" @click="handleSave">
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <button
          class="gov-btn-export"
          :disabled="exportState.disabled"
          :title="exportState.hint"
          @click="handleExport"
        >导出文档</button>
      </div>
    </div>

    <!-- 无模板时给出明确说明，避免误以为导出功能可用 -->
    <div v-if="exportState.disabled" class="gov-export-unavailable mb-3">
      {{ exportState.hint }}
    </div>

    <!-- Tab 页签 -->
    <div class="gov-tabs mb-4">
      <button
        v-for="tab in config.tabs"
        :key="tab.key"
        :class="['gov-tab', { 'gov-tab-active': activeTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 纯导出页面提示 -->
    <div v-if="activeTabConfig.fields.length === 0" class="gov-export-hint mb-3">
      <svg class="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>
      <span>当前页签为纯导出模式，占位符（被测评人、测评日期等）将自动从审计通知书引用，无需手动填写。请直接点击上方「导出文档」按钮导出。</span>
    </div>

    <!-- 数据引用提示 -->
    <div v-if="activeTabConfig.importFrom && activeTabConfig.importFrom.length > 0 && activeTabConfig.fields.length > 0" class="gov-import-hint mb-3">
      <span class="font-medium">数据来源：</span>
      <span v-for="srcKey in activeTabConfig.importFrom" :key="srcKey">{{ getStepLabel(srcKey) }} </span>
    </div>

    <!-- 表单 -->
    <div class="gov-form-grid">
      <div v-for="field in activeTabConfig.fields" :key="field.key" :class="field.fullSpan ? 'gov-span-2' : ''">
        <label class="gov-field-label">{{ field.label }}</label>
        <textarea
          v-if="field.type === 'textarea'"
          v-model="formData[field.key]"
          class="gov-input"
          :rows="field.rows || 3"
          :placeholder="field.placeholder || ''"
          :readonly="!isEditing"
          @input="formTouched = true"
        />
        <input
          v-else-if="field.type === 'date'"
          v-model="formData[field.key]"
          type="date"
          class="gov-input"
          :placeholder="field.placeholder || ''"
          :readonly="!isEditing"
          @input="formTouched = true"
        />
        <input
          v-else
          v-model="formData[field.key]"
          class="gov-input"
          :placeholder="field.placeholder || ''"
          :readonly="!isEditing"
          @input="formTouched = true"
        />
      </div>
    </div>

    <div v-if="saveError" class="gov-error-msg mt-3">{{ saveError }}</div>
    <div v-if="saveSuccess" class="text-green-600 mt-3">保存成功</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { WorkflowStep } from '@shared/types';
import { STAGE_FORM_CONFIGS } from './stageConfigs';
import type { InterviewTabConfig } from './stageConfigs';
import { formatDateToChinese, getExportButtonState, importTabDataFromStages } from './formDataUtils';

import { WORKFLOW_STEPS } from '@shared/types';

const props = defineProps<{
  projectId: number;
  projectInfo?: { name: string; auditedTarget: string; auditType: string };
  stage?: string;
}>();

const stageKey = computed(() => props.stage || 'interview_record');
const step = computed(() => WORKFLOW_STEPS.find(s => s.key === stageKey.value) || { key: stageKey.value, label: '谈话记录', stepNumber: 0 } as WorkflowStep);

const config = STAGE_FORM_CONFIGS[stageKey.value];
if (!config || !config.tabs) throw new Error(`未找到步骤 ${stageKey.value} 的 Tab 配置`);

const activeTab = ref(config.tabs[0].key);
const formData = ref<Record<string, string>>({});
const saving = ref(false);
const saveError = ref<string | null>(null);
const saveSuccess = ref(false);
const hasSavedData = ref(false);
const isEditing = ref(true);
const formTouched = ref(false);  // 用户是否已触碰表单（防止异步加载覆盖用户输入）
const stepStatus = ref<'not_started' | 'in_progress' | 'completed'>('not_started');

// 所有 tab 的数据存储（key → 该 tab 的 formData）
const allTabData = ref<Record<string, Record<string, string>>>({});

const activeTabConfig = computed(() => config.tabs!.find(t => t.key === activeTab.value) || config.tabs![0]);
const noticeFields = ref<Record<string, string>>({});
const exportState = computed(() =>
  getExportButtonState(activeTabConfig.value.template, `「${activeTabConfig.value.label}」页签`)
);

function initFormFields(tab: InterviewTabConfig): void {
  const data: Record<string, string> = {};
  for (const field of tab.fields) {
    data[field.key] = (tab.defaultValues as Record<string, string>)?.[field.key] || '';
  }
  formData.value = data;
}

function switchTab(key: string): void {
  // 保存当前 tab 数据
  allTabData.value[activeTab.value] = { ...formData.value };
  // 切换到新 tab
  activeTab.value = key;
  // 恢复新 tab 数据
  if (allTabData.value[key]) {
    formData.value = { ...allTabData.value[key] };
  } else {
    initFormFields(activeTabConfig.value);
  }
  saveError.value = null;
  saveSuccess.value = false;
}

onMounted(async () => {
  // 初始化所有 tab 的默认值
  for (const tab of config.tabs!) {
    const data: Record<string, string> = {};
    for (const field of tab.fields) {
      data[field.key] = (tab.defaultValues as Record<string, string>)?.[field.key] || '';
    }
    allTabData.value[tab.key] = data;
  }
  formData.value = { ...allTabData.value[activeTab.value] };

  // 按页签配置从前序步骤导入（来源、映射、排除项均由配置声明）
  await importFromPreviousStages();

  // 加载已保存的数据（其优先级高于自动导入）
  await loadSavedData();

  // 项目信息仅作为空字段兜底，避免覆盖导入值或用户输入
  if (props.projectInfo && !formTouched.value) {
    for (const tab of config.tabs!) {
      if (!tab.autoFillFromProject) continue;
      for (const [formKey, projectKey] of Object.entries(tab.autoFillFromProject)) {
        if (!allTabData.value[tab.key][formKey]) {
          allTabData.value[tab.key][formKey] = (props.projectInfo as Record<string, string>)[projectKey] || '';
        }
      }
    }
    formData.value = { ...allTabData.value[activeTab.value] };
  }
});

async function importFromPreviousStages(): Promise<void> {
  try {
    const res = await window.electronAPI.stages.getByProjectId(props.projectId);
    if (!res.success || !res.data) return;
    // 异步返回时用户可能已开始填写，此时不得覆盖输入
    if (formTouched.value) return;
    const result = importTabDataFromStages(
      config.tabs!,
      allTabData.value,
      res.data as Array<{ stage: string; dataJson?: string }>
    );
    allTabData.value = result.tabData;
    noticeFields.value = result.noticeFields;
    formData.value = { ...allTabData.value[activeTab.value] };
  } catch (error) {
    // 导入失败不阻塞页面，保留空表单并记录日志
    console.error('导入前序步骤数据失败：', error);
  }
}

async function loadSavedData(): Promise<void> {
  try {
    const res = await window.electronAPI.stages.getByProjectId(props.projectId);
    if (!res.success || !res.data) return;
    const stageData = res.data.find((s: { stage: string }) => s.stage === stageKey.value);
    if (stageData?.status) {
      stepStatus.value = stageData.status as typeof stepStatus.value;
    }
    if (stageData && stageData.dataJson && stageData.dataJson !== '{}') {
      const parsed = JSON.parse(stageData.dataJson);
      // 仅当用户尚未触碰表单时才恢复已保存数据（防止异步加载竞态覆盖用户输入）
      if (!formTouched.value) {
        for (const tab of config.tabs!) {
          if (parsed[tab.key]) {
            const tabData = parsed[tab.key];
            for (const field of tab.fields) {
              if (tabData[field.key] !== undefined) {
                allTabData.value[tab.key][field.key] = tabData[field.key];
              }
            }
          }
        }
        formData.value = { ...allTabData.value[activeTab.value] };
      }
      // 仅当存在有意义的填写内容时才进入只读态（防止误保存空表单导致页面锁定）
      const hasContent = (() => {
        for (const tab of config.tabs!) {
          const tabData = allTabData.value[tab.key];
          if (tabData && Object.values(tabData).some(v => v && String(v).trim() !== '')) return true;
        }
        return false;
      })();
      if (hasContent && !formTouched.value) {
        hasSavedData.value = true;
        isEditing.value = false;
      }
    }
  } catch {
    // ignore
  }
}

async function handleSave(): Promise<void> {
  if (activeTabConfig.value.fields.length === 0) return; // 纯导出页面无需保存
  saving.value = true;
  saveError.value = null;
  saveSuccess.value = false;
  // 确保当前 tab 数据已存入 allTabData
  allTabData.value[activeTab.value] = { ...formData.value };
  try {
    const data: Record<string, Record<string, string>> = {};
    for (const tab of config.tabs!) {
      const tabData = allTabData.value[tab.key] || {};
      // 过滤空值
      const cleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(tabData)) {
        if (v) cleaned[k] = v;
      }
      data[tab.key] = cleaned;
    }
    const res = await window.electronAPI.stages.updateData(
      props.projectId, stageKey.value, JSON.stringify(data), 'in_progress'
    );
    if (res.success) {
      hasSavedData.value = true;
      isEditing.value = false;
      stepStatus.value = 'in_progress';
      saveSuccess.value = true;
      setTimeout(() => { saveSuccess.value = false; }, 2000);
    } else {
      saveError.value = res.message || '保存失败';
    }
  } catch (e: unknown) {
    saveError.value = `保存失败：${(e as Error).message}`;
  } finally {
    saving.value = false;
  }
}

/** 标记完成：保留已填写内容，仅将本步骤置为完成状态 */
async function handleMarkComplete(): Promise<void> {
  allTabData.value[activeTab.value] = { ...formData.value };
  try {
    const data: Record<string, Record<string, string>> = {};
    for (const tab of config.tabs!) {
      const tabData = allTabData.value[tab.key] || {};
      // 过滤空值
      const cleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(tabData)) {
        if (v) cleaned[k] = v;
      }
      data[tab.key] = cleaned;
    }
    const res = await window.electronAPI.stages.updateData(
      props.projectId, stageKey.value, JSON.stringify(data), 'completed'
    );
    if (res.success) {
      hasSavedData.value = true;
      isEditing.value = false;
      stepStatus.value = 'completed';
      saveSuccess.value = true;
      setTimeout(() => { saveSuccess.value = false; }, 2000);
    } else {
      saveError.value = res.message || '操作失败';
    }
  } catch (e: unknown) {
    saveError.value = `操作失败：${(e as Error).message}`;
  }
}

function doEdit(): void {
  isEditing.value = true;
  saveError.value = null;
}

async function handleExport(): Promise<void> {
  const tab = activeTabConfig.value;
  if (exportState.value.disabled) {
    alert(exportState.value.hint);
    return;
  }
  allTabData.value[activeTab.value] = { ...formData.value };
  const tabData = allTabData.value[activeTab.value];
  try {
    // 每个字段独立传入（模板中已注入对应的 {fieldKey} 占位符）
    const exportData: Record<string, string> = {};
    for (const field of tab.fields) {
      const value = tabData[field.key] || '';
      // 日期字段统一转为中文日期，避免导出文档显示 ISO 日期
      exportData[field.key] = field.type === 'date' ? formatDateToChinese(value) : value;
    }

    // 纯导出页签（民主测评表等）的占位符直接引用通知书快照；
    // 快照在页面初始化时由 importFrom 配置统一采集
    if (noticeFields.value.auditedLeaderName) {
      exportData.auditedLeaderName = noticeFields.value.auditedLeaderName;
    }

    if (props.projectInfo) {
      if (!exportData.projectName) exportData.projectName = props.projectInfo.name;
      if (!exportData.auditedUnit) exportData.auditedUnit = props.projectInfo.auditedTarget;
    }

    const res = await window.electronAPI.documents.openSaveDialog(tab.exportFile);
    if (res.success && res.data) {
      const genRes = await window.electronAPI.documents.generate(tab.template, exportData, res.data.filePath);
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

function getStepLabel(key: string): string {
  const labels: Record<string, string> = {
    notice: '审计通知', survey: '调查了解记录', plan: '审计实施方案',
    task_list: '任务清单', evidence: '审计取证单', working_paper: '审计底稿',
  };
  return labels[key] || key;
}
</script>

<style scoped>
/* Tab 页签 */
.gov-tabs {
  display: flex;
  border-bottom: 2px solid #e8d5b7;
  gap: 0;
}
.gov-tab {
  padding: 8px 16px;
  font-size: 14px;
  color: #6b7280;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.2s;
}
.gov-tab:hover {
  color: #8B0000;
}
.gov-tab-active {
  color: #8B0000;
  border-bottom-color: #8B0000;
  font-weight: 600;
}

/* 表单 */
.gov-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.gov-span-2 {
  grid-column: span 2;
}
.gov-field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}
.gov-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  color: #1f2937;
  background: #faf8f5;
  transition: border-color 0.2s;
  font-family: inherit;
}
.gov-input:focus {
  outline: none;
  border-color: #8B0000;
  box-shadow: 0 0 0 2px rgba(139, 0, 0, 0.1);
}
.gov-input[readonly] {
  background: #f3f4f6;
  color: #6b7280;
  cursor: default;
}

/* 按钮 */
.gov-btn-primary {
  padding: 6px 16px;
  background: linear-gradient(135deg, #8B0000, #B22222);
  color: #FFD700;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}
.gov-btn-export {
  padding: 6px 16px;
  background: #fff;
  color: #8B0000;
  border: 1px solid #e8d5b7;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}
.gov-btn-export:disabled {
  color: #9ca3af;
  background: #f3f4f6;
  border-color: #e5e7eb;
  cursor: not-allowed;
}
.gov-btn-edit {
  padding: 6px 16px;
  background: #fff7ed;
  border: 1px solid #fdba74;
  color: #c2410c;
  border-radius: 4px;
  cursor: pointer;
}

/* 标题 */
.gov-step-badge {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #8B0000;
  color: #FFD700;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: bold;
}
.gov-step-title { font-size: 18px; font-weight: bold; color: #1f2937; margin: 0; }
.gov-stage-card { background: #fff; border: 1px solid #e8d5b7; border-radius: 8px; padding: 20px 24px; }

/* 提示 */
.gov-import-hint {
  padding: 6px 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  font-size: 13px;
  color: #1d4ed8;
}
.gov-error-msg { color: #dc2626; font-size: 13px; }
.gov-export-hint {
  padding: 8px 14px;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 4px;
  font-size: 13px;
  color: #92400e;
  display: flex;
  align-items: flex-start;
}
.gov-export-unavailable {
  padding: 6px 12px;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  color: #6b7280;
}

/* 标记完成按钮 */
.gov-btn-complete {
  padding: 6px 16px;
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
}
.gov-btn-complete:hover {
  background: linear-gradient(135deg, #047857, #059669);
}
.gov-status-complete {
  padding: 6px 14px;
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #6ee7b7;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}
</style>
