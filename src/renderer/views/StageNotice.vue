<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold">审计通知书</h2>
      <div class="flex gap-2">
        <button class="btn-secondary" @click="handleUploadWord">上传Word解析</button>
        <button class="btn-primary" @click="handleSave">保存</button>
        <button class="btn-primary" @click="handleExport">导出文档</button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="md:col-span-2">
        <label class="label-base">审计项目名称</label>
        <input v-model="form.auditProjectName" class="input-base" placeholder="例：关于开展XX同志经济责任审计的通知" />
      </div>
      <div>
        <label class="label-base">审计机关全称</label>
        <input v-model="form.auditOrg" class="input-base" placeholder="请输入审计机关全称" />
      </div>
      <div>
        <label class="label-base">文号</label>
        <input v-model="form.documentNumber" class="input-base" placeholder="例：审（委）办经责通〔2024〕1号" />
      </div>
      <div>
        <label class="label-base">被审计领导干部姓名</label>
        <input v-model="form.auditedLeaderName" class="input-base" placeholder="请输入被审计领导干部姓名" />
      </div>
      <div>
        <label class="label-base">被审计领导干部所在单位</label>
        <input v-model="form.auditedLeaderUnit" class="input-base" placeholder="请输入所在单位" />
      </div>
      <div>
        <label class="label-base">被审计领导干部职务</label>
        <input v-model="form.auditedLeaderPosition" class="input-base" placeholder="请输入职务" />
      </div>
      <div>
        <label class="label-base">审计开始日期</label>
        <input v-model="form.auditStartDate" type="date" class="input-base" />
      </div>
      <div>
        <label class="label-base">审计组组长</label>
        <input v-model="form.teamLeader" class="input-base" placeholder="请输入组长姓名" />
      </div>
      <div>
        <label class="label-base">副组长</label>
        <input v-model="form.teamDeputyLeader" class="input-base" placeholder="请输入副组长姓名" />
      </div>
      <div class="md:col-span-2">
        <label class="label-base">审计组成员（逗号分隔）</label>
        <input v-model="form.teamMembers" class="input-base" placeholder="请输入成员姓名，用逗号分隔" />
      </div>
      <div>
        <label class="label-base">抄送</label>
        <input v-model="form.ccUnit" class="input-base" placeholder="请输入抄送单位" />
      </div>
      <div>
        <label class="label-base">印发机关</label>
        <input v-model="form.issuingOrg" class="input-base" placeholder="请输入印发机关" />
      </div>
      <div>
        <label class="label-base">印发日期</label>
        <input v-model="form.issueDate" type="date" class="input-base" />
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
  auditProjectName: '',
  auditOrg: '',
  documentNumber: '',
  auditedLeaderName: '',
  auditedLeaderUnit: '',
  auditedLeaderPosition: '',
  auditStartDate: '',
  auditEndDate: '',
  teamLeader: '',
  teamDeputyLeader: '',
  teamMembers: '',
  ccUnit: '',
  issuingOrg: '',
  issueDate: '',
});

const saving = ref(false);
const saveError = ref<string | null>(null);

onMounted(async () => {
  // 从项目信息自动填充
  if (props.projectInfo) {
    form.value.auditProjectName = form.value.auditProjectName || props.projectInfo.name;
    form.value.auditedLeaderUnit = form.value.auditedLeaderUnit || props.projectInfo.auditedTarget;
  }
  try {
    const res = await window.electronAPI.stages.getByProjectId(props.projectId);
    if (res.success && res.data) {
      const stageData = res.data.find((s: { stage: string }) => s.stage === props.stage);
      if (stageData && stageData.dataJson && stageData.dataJson !== '{}') {
        const parsed = JSON.parse(stageData.dataJson);
        for (const key of Object.keys(form.value)) {
          if (parsed[key] !== undefined) {
            (form.value as Record<string, unknown>)[key] = parsed[key];
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
    const res = await window.electronAPI.documents.openSaveDialog('审计通知书.docx');
    if (res.success && res.data) {
      const data = { ...form.value, projectName: form.value.auditProjectName };
      const genRes = await window.electronAPI.documents.generate('tpl_audit_notice', data, res.data.filePath);
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

async function handleUploadWord(): Promise<void> {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.docx';
  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.electronAPI.documents.parseWord(arrayBuffer);
      if (result.success && result.data) {
        for (const key of Object.keys(form.value)) {
          if ((result.data as Record<string, unknown>)[key] !== undefined) {
            (form.value as Record<string, unknown>)[key] = (result.data as Record<string, unknown>)[key];
          }
        }
      } else {
        alert('解析失败：' + (result.message || '未知错误'));
      }
    } catch (err: unknown) {
      alert('解析失败：' + (err as Error).message);
    }
  };
  input.click();
}
</script>
