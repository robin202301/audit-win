<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold">审计调查记录</h2>
      <div class="flex gap-2">
        <button class="btn-primary" @click="handleSave">保存</button>
        <button class="btn-primary" @click="handleExport">导出表格</button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <label class="label-base">单位名称</label>
        <input v-model="form.unitName" class="input-base" placeholder="请输入单位名称" />
      </div>
      <div>
        <label class="label-base">单位性质</label>
        <input v-model="form.unitNature" class="input-base" placeholder="请输入单位性质" />
      </div>
      <div>
        <label class="label-base">法人代表</label>
        <input v-model="form.legalRepresentative" class="input-base" placeholder="请输入法人代表" />
      </div>
      <div>
        <label class="label-base">主管单位</label>
        <input v-model="form.supervisingUnit" class="input-base" placeholder="请输入主管单位" />
      </div>
      <div>
        <label class="label-base">人员编制</label>
        <input v-model.number="form.staffQuota" type="number" class="input-base" placeholder="请输入人员编制数" />
      </div>
      <div>
        <label class="label-base">期末人数</label>
        <input v-model.number="form.currentStaffCount" type="number" class="input-base" placeholder="请输入期末人数" />
      </div>
      <div class="md:col-span-2">
        <label class="label-base">机构设置情况</label>
        <textarea v-model="form.orgStructure" class="input-base" rows="2" placeholder="请输入机构设置情况"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">职责范围/经营范围</label>
        <textarea v-model="form.responsibilityScope" class="input-base" rows="2" placeholder="请输入职责范围或经营范围"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">法律法规、政策及其执行情况</label>
        <textarea v-model="form.lawExecution" class="input-base" rows="2" placeholder="请输入法律法规政策及其执行情况"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">财政财务管理体制和业务管理体制</label>
        <textarea v-model="form.financialSystem" class="input-base" rows="2" placeholder="请输入财政财务管理体制和业务管理体制"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">适用的业绩指标体系及业绩评价情况</label>
        <textarea v-model="form.performanceIndicators" class="input-base" rows="2" placeholder="请输入适用的业绩指标体系及业绩评价情况"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">相关内部控制及其执行情况</label>
        <textarea v-model="form.internalControl" class="input-base" rows="2" placeholder="请输入相关内部控制及其执行情况"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">相关信息系统及其电子数据情况</label>
        <textarea v-model="form.infoSystems" class="input-base" rows="2" placeholder="请输入相关信息系统及其电子数据情况"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">经济环境、行业状况及其他外部因素</label>
        <textarea v-model="form.economicEnvironment" class="input-base" rows="2" placeholder="请输入经济环境、行业状况及其他外部因素"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">以往接受审计情况</label>
        <textarea v-model="form.previousAudit" class="input-base" rows="2" placeholder="请输入以往接受审计情况"></textarea>
      </div>
      <div class="md:col-span-2">
        <label class="label-base">其他需要了解的情况</label>
        <textarea v-model="form.otherInfo" class="input-base" rows="2" placeholder="请输入其他需要了解的情况"></textarea>
      </div>
      <div>
        <label class="label-base">填表人</label>
        <input v-model="form.fillerName" class="input-base" placeholder="请输入填表人" />
      </div>
      <div>
        <label class="label-base">填报日期</label>
        <input v-model="form.fillDate" type="date" class="input-base" />
      </div>
    </div>

    <div v-if="saving" class="mt-4 text-blue-600">保存中...</div>
    <div v-if="saveError" class="mt-4 text-red-600">{{ saveError }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { AuditStage } from '@shared/types';

const props = defineProps<{ projectId: number; stage: AuditStage }>();
const emit = defineEmits<{ saved: [] }>();

const form = reactive({
  unitName: '',
  unitNature: '',
  legalRepresentative: '',
  supervisingUnit: '',
  staffQuota: 0,
  currentStaffCount: 0,
  orgStructure: '',
  responsibilityScope: '',
  lawExecution: '',
  financialSystem: '',
  performanceIndicators: '',
  internalControl: '',
  infoSystems: '',
  economicEnvironment: '',
  previousAudit: '',
  otherInfo: '',
  fillerName: '',
  fillDate: '',
});

const saving = ref(false);
const saveError = ref<string | null>(null);

onMounted(async () => {
  try {
    const res = await window.electronAPI.survey.getByProjectId(props.projectId);
    if (res.success && res.data) {
      const data = res.data;
      for (const key of Object.keys(form)) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (data[dbKey] !== undefined) {
          (form as Record<string, unknown>)[key] = data[dbKey];
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
    const dbData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(form)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      dbData[dbKey] = value;
    }
    const res = await window.electronAPI.survey.upsert(props.projectId, dbData);
    if (res.success) {
      await window.electronAPI.stages.updateData(props.projectId, props.stage, JSON.stringify(form), 'in_progress');
      alert('保存成功');
      emit('saved');
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
  alert('导出Excel功能开发中');
}
</script>
