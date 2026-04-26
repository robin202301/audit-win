<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <span class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
          {{ step.stepNumber }}
        </span>
        <h2 class="text-xl font-bold">{{ step.label }}</h2>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary" @click="handleUploadTemplate">上传模板</button>
        <button class="btn-secondary" @click="handleResetTemplate">重置为模板</button>
        <button class="btn-primary" @click="handleSave">保存</button>
        <button class="btn-primary" @click="handleExport">导出文档</button>
      </div>
    </div>

    <!-- 数据引用提示 -->
    <div v-if="step.importFrom && step.importFrom.length > 0" class="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
      <span class="font-medium">数据来源：</span>
      <span v-for="srcKey in step.importFrom" :key="srcKey">{{ getStepLabel(srcKey) }} </span>
    </div>

    <!-- 项目名称、审计单位、审计类型信息栏 -->
    <div v-if="projectInfo" class="mb-3 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600 flex gap-6">
      <span><strong>项目名称：</strong>{{ projectInfo.name }}</span>
      <span><strong>被审计单位：</strong>{{ projectInfo.auditedTarget }}</span>
      <span><strong>审计类型：</strong>{{ projectInfo.auditType }}</span>
    </div>

    <!-- 大输入框 -->
    <textarea
      v-model="content"
      class="input-base w-full font-mono text-sm leading-relaxed"
      rows="24"
      placeholder="模板内容将在此显示，可编辑修改..."
    />

    <div v-if="saving" class="mt-3 text-blue-600">保存中...</div>
    <div v-if="saveError" class="mt-3 text-red-600">{{ saveError }}</div>
    <div v-if="saveSuccess" class="mt-3 text-green-600">保存成功</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { WorkflowStep } from '@shared/types';

const props = defineProps<{
  projectId: number;
  step: WorkflowStep;
  projectInfo: { name: string; auditedTarget: string; auditType: string };
}>();

const content = ref('');
const saving = ref(false);
const saveError = ref<string | null>(null);
const saveSuccess = ref(false);
const templateText = ref(''); // 原始模板文本

onMounted(async () => {
  // 1. 加载模板文本
  await loadTemplateText();
  // 2. 替换占位符
  applyPlaceholders();
  // 3. 加载已保存的内容（覆盖模板内容）
  await loadSavedContent();
});

async function loadTemplateText(): Promise<void> {
  if (!props.step.template) {
    templateText.value = '';
    return;
  }
  try {
    // 通过 IPC 读取模板文件文本内容
    const res = await window.electronAPI.templates.readTemplateText(props.step.template);
    if (res.success && res.data) {
      templateText.value = res.data;
    }
  } catch {
    templateText.value = '';
  }
}

function applyPlaceholders(): Promise<void> {
  let text = templateText.value;
  if (!text) return;
  // 替换项目相关占位符
  text = text.replace(/\{projectName\}/g, props.projectInfo.name);
  text = text.replace(/\{auditedUnit\}/g, props.projectInfo.auditedTarget);
  text = text.replace(/\{auditProjectName\}/g, props.projectInfo.name);
  text = text.replace(/\{auditedLeaderUnit\}/g, props.projectInfo.auditedTarget);
  text = text.replace(/\{auditedLeaderName\}/g, props.projectInfo.auditedTarget);
  text = text.replace(/\{auditType\}/g, props.projectInfo.auditType);
  content.value = text;
  return;
}

async function loadSavedContent(): Promise<void> {
  try {
    const res = await window.electronAPI.stages.getByProjectId(props.projectId);
    if (res.success && res.data) {
      const stageData = res.data.find((s: { stage: string }) => s.stage === props.step.key);
      if (stageData && stageData.dataJson && stageData.dataJson !== '{}') {
        const parsed = JSON.parse(stageData.dataJson);
        if (parsed.content) {
          content.value = parsed.content;
        }
      }
    }
  } catch {
    // ignore
  }
}

async function handleSave(): Promise<void> {
  saving.value = true;
  saveError.value = null;
  saveSuccess.value = false;
  try {
    const data = { content: content.value };
    const res = await window.electronAPI.stages.updateData(
      props.projectId,
      props.step.key,
      JSON.stringify(data),
      'in_progress'
    );
    if (res.success) {
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

async function handleExport(): Promise<void> {
  if (!props.step.template) {
    alert('该步骤暂无导出模板');
    return;
  }
  try {
    const res = await window.electronAPI.documents.openSaveDialog(`${props.step.label}.docx`);
    if (res.success && res.data) {
      const exportData = { content: content.value };
      // 注入项目信息
      exportData.projectName = props.projectInfo.name;
      exportData.auditedUnit = props.projectInfo.auditedTarget;
      exportData.auditProjectName = props.projectInfo.name;
      exportData.auditedLeaderName = props.projectInfo.auditedTarget;
      exportData.auditType = props.projectInfo.auditType;

      const genRes = await window.electronAPI.documents.generate(props.step.template, exportData, res.data.filePath);
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

async function handleUploadTemplate(): Promise<void> {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.docx,.doc';
  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.electronAPI.documents.parseWord(arrayBuffer);
      if (result.success && result.data) {
        content.value = (result.data as Record<string, string>).content || result.data.text || JSON.stringify(result.data);
        templateText.value = content.value;
      } else {
        alert('解析失败：' + (result.message || '未知错误'));
      }
    } catch (err: unknown) {
      alert('解析失败：' + (err as Error).message);
    }
  };
  input.click();
}

function handleResetTemplate(): Promise<void> {
  if (!confirm('确定要重置为模板默认内容吗？当前编辑的内容将丢失。')) return;
  applyPlaceholders();
  return;
}

function getStepLabel(key: string): string {
  const allSteps: Record<string, string> = {
    work_plan: '审计工作方案',
    notice: '审计通知',
    survey: '调查了解记录',
    plan: '审计实施方案',
    task_list: '任务清单',
    interview_record: '谈话记录',
    evidence: '审计取证单',
    working_paper: '审计底稿',
    task_list_completion: '任务清单完成情况',
    report: '审计组审计报告',
    report_consultation: '审计报告征求意见书',
    audit_opinion: '审核意见',
    review_opinion: '复核意见',
    adjudication_opinion: '审理意见',
    adjudication_meeting: '审理会纪要',
    external_report: '对外报告',
    result_report: '经责审计结果报告',
    issues_not_reflected: '未反映问题清单',
    audit_decision: '审计决定书',
    issue_ledger: '审计问题台账',
    archive_catalog: '审计档案目录',
  };
  return allSteps[key] || key;
}
</script>

<style scoped>
.input-base {
  font-family: "仿宋", "FangSong", monospace;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
