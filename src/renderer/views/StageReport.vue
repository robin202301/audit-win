<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold">审计报告</h2>
      <div class="flex gap-2">
        <button class="btn-primary" @click="handleSave">保存</button>
        <button class="btn-primary" @click="handleExport">导出报告</button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <label class="label-base">文号</label>
        <input v-model="form.documentNumber" class="input-base" placeholder="例：*审（委）办经责报〔20**〕**号" />
      </div>
      <div>
        <label class="label-base">被审计单位</label>
        <input v-model="form.auditedUnit" class="input-base" placeholder="请输入被审计单位" />
      </div>
      <div>
        <label class="label-base">被审计领导干部</label>
        <input v-model="form.auditedLeaderName" class="input-base" placeholder="请输入被审计领导干部" />
      </div>
      <div>
        <label class="label-base">审计项目</label>
        <input v-model="form.auditProject" class="input-base" placeholder="请输入审计项目名称" />
      </div>
      <div>
        <label class="label-base">审计开始日期</label>
        <input v-model="form.auditStartDate" type="date" class="input-base" />
      </div>
      <div>
        <label class="label-base">审计结束日期</label>
        <input v-model="form.auditEndDate" type="date" class="input-base" />
      </div>
      <div>
        <label class="label-base">被审计领导职务（一）</label>
        <input v-model="form.leaderPosition1" class="input-base" placeholder="请输入职务" />
      </div>
      <div>
        <label class="label-base">被审计领导职务（二）</label>
        <input v-model="form.leaderPosition2" class="input-base" placeholder="请输入职务" />
      </div>
      <div class="md:col-span-2">
        <label class="label-base">被审计单位基本情况</label>
        <textarea v-model="form.basicInfo" class="input-base" rows="6" placeholder="简要表述被审计单位的背景信息、性质、组织结构、职责范围、财政财务管理体制、相关内部控制及信息系统情况、主要财务指标及变化情况等"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">履行经济责任所做的主要工作</label>
        <textarea v-model="form.mainWork" class="input-base" rows="6" placeholder="被审计领导干部任职期间所做的主要工作"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">总体评价</label>
        <textarea v-model="form.overallEvaluation" class="input-base" rows="4" placeholder="从审计情况看，被审计领导干部任职期间履行经济责任的总体评价"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">审计发现的主要问题</label>
        <textarea v-model="form.problemsFound" class="input-base" rows="8" placeholder="分类列举审计发现的主要问题及责任认定"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">责任认定</label>
        <textarea v-model="form.responsibility" class="input-base" rows="3" placeholder="对审计发现问题的责任认定（直接责任、主管责任、领导责任）"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">审计建议</label>
        <textarea v-model="form.auditSuggestions" class="input-base" rows="4" placeholder="针对审计发现的问题提出审计建议"></textarea>
      </div>
    </div>

    <div v-if="saving" class="mt-4 text-blue-600">保存中...</div>
    <div v-if="saveError" class="mt-4 text-red-600">{{ saveError }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { AuditStage } from '@shared/types';

const props = defineProps<{ projectId: number; stage: AuditStage }>();

const form = ref({
  documentNumber: '',
  auditedUnit: '',
  auditedLeaderName: '',
  auditProject: '',
  auditStartDate: '',
  auditEndDate: '',
  leaderPosition1: '',
  leaderPosition2: '',
  basicInfo: '',
  mainWork: '',
  overallEvaluation: '',
  problemsFound: '',
  responsibility: '',
  auditSuggestions: '',
});

const saving = ref(false);
const saveError = ref<string | null>(null);

function loadFormData(data: Record<string, unknown>): void {
  form.value.documentNumber = (data.documentNumber as string) || '';
  form.value.auditedUnit = (data.auditedUnit as string) || '';
  form.value.auditedLeaderName = (data.auditedLeaderName as string) || '';
  form.value.auditProject = (data.auditProject as string) || '';
  form.value.auditStartDate = (data.auditStartDate as string) || '';
  form.value.auditEndDate = (data.auditEndDate as string) || '';
  form.value.leaderPosition1 = (data.leaderPosition1 as string) || '';
  form.value.leaderPosition2 = (data.leaderPosition2 as string) || '';
  form.value.basicInfo = (data.basicInfo as string) || '';
  form.value.mainWork = (data.mainWork as string) || '';
  form.value.overallEvaluation = (data.overallEvaluation as string) || '';
  form.value.problemsFound = (data.problemsFound as string) || '';
  form.value.responsibility = (data.responsibility as string) || '';
  form.value.auditSuggestions = (data.auditSuggestions as string) || '';
}

onMounted(async () => {
  try {
    const res = await window.electronAPI.stages.getByProjectId(props.projectId);
    if (res.success && res.data) {
      const stageData = res.data.find((s: { stage: string }) => s.stage === props.stage);
      if (stageData && stageData.dataJson && stageData.dataJson !== '{}') {
        loadFormData(JSON.parse(stageData.dataJson));
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
      props.stage,
      JSON.stringify(form.value),
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
  try {
    const res = await window.electronAPI.documents.openSaveDialog('审计报告.docx');
    if (res.success && res.data) {
      const genRes = await window.electronAPI.documents.generate('tpl_final_report', { ...form.value }, res.data.filePath);
      if (genRes.success) {
        alert('报告已导出：' + res.data!.filePath);
      } else {
        alert('导出失败：' + (genRes.message || '未知错误'));
      }
    }
  } catch (e: unknown) {
    alert('导出失败：' + (e as Error).message);
  }
}
</script>
