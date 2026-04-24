<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <span class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
          {{ config.stepNumber }}
        </span>
        <h2 class="text-xl font-bold">{{ config.title }}</h2>
      </div>
      <div class="flex gap-2">
        <button v-if="step.importFrom && step.importFrom.length > 0" class="btn-secondary" @click="handleImport">
          导入前序数据
        </button>
        <button class="btn-primary" @click="handleSave">保存</button>
        <button class="btn-primary" @click="handleExport">导出文档</button>
      </div>
    </div>

    <!-- 数据引用提示 -->
    <div v-if="step.importFrom && step.importFrom.length > 0" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
      <span class="font-medium">数据来源：</span>
      <span v-for="srcKey in step.importFrom" :key="srcKey">
        {{ getStepLabel(srcKey) }}
      </span>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div v-for="field in config.fields" :key="field.key" :class="field.fullSpan ? 'md:col-span-2' : ''">
        <label class="label-base">{{ field.label }}</label>
        <textarea
          v-if="field.type === 'textarea'"
          v-model="formData[field.key]"
          class="input-base"
          :rows="field.rows || 3"
          :placeholder="field.placeholder || ''"
        />
        <input
          v-else-if="field.type === 'date'"
          v-model="formData[field.key]"
          type="date"
          class="input-base"
          :placeholder="field.placeholder || ''"
        />
        <input
          v-else
          v-model="formData[field.key]"
          class="input-base"
          :placeholder="field.placeholder || '请输入' + field.label"
        />
      </div>
    </div>

    <div v-if="saving" class="mt-4 text-blue-600">保存中...</div>
    <div v-if="saveError" class="mt-4 text-red-600">{{ saveError }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { WorkflowStep } from '@shared/types';
import { STAGE_FORM_CONFIGS } from './stageConfigs';

const props = defineProps<{
  projectId: number;
  step: WorkflowStep;
  projectInfo?: { name: string; auditedTarget: string; auditType: string };
}>();

const config = STAGE_FORM_CONFIGS[props.step.key];
if (!config) throw new Error(`未找到步骤 ${props.step.key} 的表单配置`);

const formData = ref<Record<string, string>>({});
const saving = ref(false);
const saveError = ref<string | null>(null);

// 初始化表单字段
for (const field of config.fields) {
  formData.value[field.key] = '';
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
      const stageData = res.data.find((s: { stage: string }) => s.stage === props.step.key);
      if (stageData && stageData.dataJson && stageData.dataJson !== '{}') {
        const parsed = JSON.parse(stageData.dataJson);
        for (const key of Object.keys(formData.value)) {
          if (parsed[key] !== undefined) {
            formData.value[key] = parsed[key];
          }
        }
      }
    }
  } catch {
    // ignore
  }
});

async function handleSave(): Promise<void> {
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
  if (!config.template) {
    alert('该步骤暂无导出模板');
    return;
  }
  try {
    const res = await window.electronAPI.documents.openSaveDialog(config.exportFile);
    if (res.success && res.data) {
      // 自动注入项目基本信息和通用占位符
      const exportData = { ...formData.value };
      if (props.projectInfo) {
        if (!exportData.projectName) exportData.projectName = props.projectInfo.name;
        if (!exportData.auditedUnit) exportData.auditedUnit = props.projectInfo.auditedTarget;
        if (!exportData.auditProjectName) exportData.auditProjectName = props.projectInfo.name;
        if (!exportData.auditedLeaderName) exportData.auditedLeaderName = props.projectInfo.auditedTarget;
      }
      // 通用占位符默认值：空字符串替换，避免模板原样输出
      if (!exportData.content) exportData.content = '';
      if (!exportData.text) exportData.text = '';
      if (!exportData.name) exportData.name = '';
      if (!exportData.val) exportData.val = '';
      if (!exportData.shortText) exportData.shortText = '';
      if (!exportData.mediumText) exportData.mediumText = '';
      if (!exportData.shortContent) exportData.shortContent = '';
      const genRes = await window.electronAPI.documents.generate(config.template, exportData, res.data.filePath);
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
        // 自动匹配同名字段
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
  const step = props.step;
  const allSteps = [
    { key: 'work_plan', label: '审计工作方案' },
    { key: 'notice', label: '审计通知' },
    { key: 'survey', label: '调查了解记录' },
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
</script>
