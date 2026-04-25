<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold">审计方案</h2>
      <div class="flex gap-2">
        <button class="btn-primary" @click="handleSave">保存</button>
        <button class="btn-primary" @click="handleExport">导出文档</button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="md:col-span-2">
        <label class="label-base">项目名称</label>
        <input v-model="form.projectName" class="input-base" placeholder="请输入项目名称" />
      </div>
      <div>
        <label class="label-base">组长</label>
        <input v-model="form.teamLeader" class="input-base" placeholder="请输入组长姓名" />
      </div>
      <div>
        <label class="label-base">开始日期</label>
        <input v-model="form.startDate" type="date" class="input-base" />
      </div>
      <div class="md:col-span-2">
        <label class="label-base">审计组成员及分工</label>
        <textarea v-model="form.teamMembers" class="input-base" rows="3" placeholder="请输入审计组成员及分工"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">审计范围</label>
        <textarea v-model="form.auditScope" class="input-base" rows="2" placeholder="请输入审计范围"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">审计重点</label>
        <textarea v-model="form.auditFocus" class="input-base" rows="3" placeholder="请输入审计重点"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">审计方法</label>
        <textarea v-model="form.auditMethod" class="input-base" rows="2" placeholder="请输入审计方法"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">时间安排</label>
        <textarea v-model="form.schedule" class="input-base" rows="3" placeholder="请输入时间安排"></textarea>
      </div>
      <div>
        <label class="label-base">结束日期</label>
        <input v-model="form.endDate" type="date" class="input-base" />
      </div>
    </div>

    <div v-if="saving" class="mt-4 text-blue-600">保存中...</div>
    <div v-if="saveError" class="mt-4 text-red-600">{{ saveError }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { AuditStage } from '@shared/types';

const props = defineProps<{ projectId: number; stage: AuditStage; projectInfo?: { name: string; auditedTarget: string; auditType: string } }>();

const form = ref({
  projectName: '',
  teamLeader: '',
  teamMembers: '',
  auditScope: '',
  auditFocus: '',
  auditMethod: '',
  schedule: '',
  startDate: '',
  endDate: '',
});

const saving = ref(false);
const saveError = ref<string | null>(null);

function loadFormData(data: Record<string, unknown>): void {
  form.value.projectName = (data.projectName as string) || '';
  form.value.teamLeader = (data.teamLeader as string) || '';
  form.value.teamMembers = (data.teamMembers as string) || '';
  form.value.auditScope = (data.auditScope as string) || '';
  form.value.auditFocus = (data.auditFocus as string) || '';
  form.value.auditMethod = (data.auditMethod as string) || '';
  form.value.schedule = (data.schedule as string) || '';
  form.value.startDate = (data.startDate as string) || '';
  form.value.endDate = (data.endDate as string) || '';
}

onMounted(async () => {
  // 从项目信息自动填充
  if (props.projectInfo) {
    form.value.projectName = form.value.projectName || props.projectInfo.name;
  }
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
    const res = await window.electronAPI.documents.openSaveDialog('审计方案.doc');
    if (res.success && res.data) {
      const genRes = await window.electronAPI.documents.generate('tpl_audit_plan', { ...form.value }, res.data.filePath);
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
