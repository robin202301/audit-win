<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold">审计调查记录</h2>
      <div class="flex gap-2">
        <button class="btn-primary" @click="handleSave">保存</button>
        <button class="btn-primary" @click="handleExportExcel">导出Excel表格</button>
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
import { onMounted, ref } from 'vue';
import { AuditStage } from '@shared/types';

const props = defineProps<{ projectId: number; stage: AuditStage }>();

const form = ref({
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

function loadFormData(data: Record<string, unknown>): void {
  form.value.unitName = (data.unit_name as string) || '';
  form.value.unitNature = (data.unit_nature as string) || '';
  form.value.legalRepresentative = (data.legal_representative as string) || '';
  form.value.supervisingUnit = (data.supervising_unit as string) || '';
  form.value.staffQuota = (data.staff_quota as number) || 0;
  form.value.currentStaffCount = (data.current_staff_count as number) || 0;
  form.value.orgStructure = (data.org_structure as string) || '';
  form.value.responsibilityScope = (data.responsibility_scope as string) || '';
  form.value.lawExecution = (data.law_execution as string) || '';
  form.value.financialSystem = (data.financial_system as string) || '';
  form.value.performanceIndicators = (data.performance_indicators as string) || '';
  form.value.internalControl = (data.internal_control as string) || '';
  form.value.infoSystems = (data.info_systems as string) || '';
  form.value.economicEnvironment = (data.economic_environment as string) || '';
  form.value.previousAudit = (data.previous_audit as string) || '';
  form.value.otherInfo = (data.other_info as string) || '';
  form.value.fillerName = (data.filler_name as string) || '';
  form.value.fillDate = (data.fill_date as string) || '';
}

onMounted(async () => {
  try {
    const res = await window.electronAPI.survey.getByProjectId(props.projectId);
    if (res.success && res.data) {
      loadFormData(res.data);
    }
  } catch {
    // ignore
  }
});

async function handleSave(): Promise<void> {
  saving.value = true;
  saveError.value = null;
  try {
    const dbData = {
      unit_name: form.value.unitName,
      unit_nature: form.value.unitNature,
      legal_representative: form.value.legalRepresentative,
      supervising_unit: form.value.supervisingUnit,
      staff_quota: form.value.staffQuota,
      current_staff_count: form.value.currentStaffCount,
      org_structure: form.value.orgStructure,
      responsibility_scope: form.value.responsibilityScope,
      law_execution: form.value.lawExecution,
      financial_system: form.value.financialSystem,
      performance_indicators: form.value.performanceIndicators,
      internal_control: form.value.internalControl,
      info_systems: form.value.infoSystems,
      economic_environment: form.value.economicEnvironment,
      previous_audit: form.value.previousAudit,
      other_info: form.value.otherInfo,
      filler_name: form.value.fillerName,
      fill_date: form.value.fillDate,
    };
    const res = await window.electronAPI.survey.upsert(props.projectId, dbData);
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

async function handleExportExcel(): Promise<void> {
  try {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    const wsData = [
      ['被审计单位基本情况表'],
      ['单位名称：', form.value.unitName, '', '截止：', form.value.fillDate || '年  月  日'],
      ['单位性质', form.value.unitNature],
      ['法人代表', form.value.legalRepresentative],
      ['主管单位', form.value.supervisingUnit],
      ['人员编制', form.value.staffQuota],
      ['期末人数', form.value.currentStaffCount],
      ['机构设置情况', form.value.orgStructure],
      ['职责范围/经营范围', form.value.responsibilityScope],
      ['法律法规、政策及其执行情况', form.value.lawExecution],
      ['财政财务管理体制和业务管理体制', form.value.financialSystem],
      ['适用的业绩指标体系及业绩评价情况', form.value.performanceIndicators],
      ['相关内部控制及其执行情况', form.value.internalControl],
      ['相关信息系统及其电子数据情况', form.value.infoSystems],
      ['经济环境、行业状况及其他外部因素', form.value.economicEnvironment],
      ['以往接受审计情况', form.value.previousAudit],
      ['其他需要了解的情况', form.value.otherInfo],
      ['填表人', form.value.fillerName, '', '日期', form.value.fillDate],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 20 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, ws, '审计调查记录');

    const res = await window.electronAPI.documents.openSaveDialog('审计调查记录.xlsx');
    if (res.success && res.data) {
      XLSX.writeFile(wb, res.data.filePath);
      alert('表格已导出：' + res.data.filePath);
    }
  } catch (e: unknown) {
    alert('导出失败：' + (e as Error).message);
  }
}
</script>
