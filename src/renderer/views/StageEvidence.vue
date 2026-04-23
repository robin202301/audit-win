<template>
  <div>
    <div class="card mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">审计取证单管理</h2>
        <button class="btn-primary" @click="openForm">新增取证单</button>
      </div>

      <div v-if="loading" class="text-center py-4 text-gray-500">加载中...</div>
      <div v-else-if="evidenceList.length === 0" class="text-center py-4 text-gray-400">暂无取证单，点击上方"新增取证单"添加</div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="text-left py-2 px-3">编号</th>
            <th class="text-left py-2 px-3">被审计单位</th>
            <th class="text-left py-2 px-3">事项摘要</th>
            <th class="text-left py-2 px-3">审计人员</th>
            <th class="text-left py-2 px-3">编制日期</th>
            <th class="text-left py-2 px-3">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in evidenceList" :key="item.id" v-memo="[item.serialNumber, item.auditedUnit, item.matterSummary, item.auditorName, item.compileDate]" class="border-b hover:bg-gray-50">
            <td class="py-2 px-3">{{ item.serialNumber }}</td>
            <td class="py-2 px-3">{{ item.auditedUnit }}</td>
            <td class="py-2 px-3 max-w-xs truncate">{{ item.matterSummary }}</td>
            <td class="py-2 px-3">{{ item.auditorName }}</td>
            <td class="py-2 px-3">{{ item.compileDate }}</td>
            <td class="py-2 px-3 flex gap-2">
              <button class="text-blue-600 hover:text-blue-800" @click="editItem(item)">编辑</button>
              <button class="text-blue-600 hover:text-blue-800" @click="exportItem(item)">导出</button>
              <button class="text-red-600 hover:text-red-800" @click="deleteItem(item.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold mb-4">{{ editingId ? '编辑取证单' : '新增取证单' }}</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="label-base">编号</label>
            <input v-model="formData.serialNumber" class="input-base" placeholder="请输入编号" />
          </div>
          <div>
            <label class="label-base">项目名称</label>
            <input v-model="formData.projectName" class="input-base" placeholder="请输入项目名称" />
          </div>
          <div>
            <label class="label-base">被审计单位或个人</label>
            <input v-model="formData.auditedUnit" class="input-base" placeholder="请输入被审计单位或个人" />
          </div>
          <div>
            <label class="label-base">编制日期</label>
            <input v-model="formData.compileDate" type="date" class="input-base" />
          </div>
          <div class="md:col-span-2">
            <label class="label-base">审计（调查）事项摘要</label>
            <textarea v-model="formData.matterSummary" class="input-base" rows="3" placeholder="请输入事项摘要"></textarea>
          </div>
          <div class="md:col-span-2">
            <label class="label-base">证据内容</label>
            <textarea v-model="formData.evidenceContent" class="input-base" rows="4" placeholder="请输入证据内容"></textarea>
          </div>
          <div class="md:col-span-2">
            <label class="label-base">法律法规依据</label>
            <textarea v-model="formData.legalBasis" class="input-base" rows="3" placeholder="请输入法律法规依据"></textarea>
          </div>
          <div>
            <label class="label-base">审计人员</label>
            <input v-model="formData.auditorName" class="input-base" placeholder="请输入审计人员" />
          </div>
          <div>
            <label class="label-base">反馈截止日期</label>
            <input v-model="formData.feedbackDeadline" type="date" class="input-base" />
          </div>
          <div class="md:col-span-2">
            <label class="label-base">证据提供单位意见</label>
            <textarea v-model="formData.providerOpinion" class="input-base" rows="2" placeholder="请输入证据提供单位意见"></textarea>
          </div>
          <div>
            <label class="label-base">证据提供单位盖章/签名</label>
            <input v-model="formData.providerSignature" class="input-base" placeholder="请输入签名" />
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn-secondary" @click="closeForm">取消</button>
          <button class="btn-primary" @click="handleSaveForm">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { AuditStage } from '@shared/types';

const props = defineProps<{ projectId: number; stage: AuditStage; projectInfo?: { name: string; auditedTarget: string; auditType: string } }>();

interface EvidenceRow {
  id: number;
  serialNumber: string;
  projectName: string;
  auditedUnit: string;
  matterSummary: string;
  evidenceContent: string;
  legalBasis: string;
  auditorName: string;
  compileDate: string;
  providerOpinion: string;
  providerSignature: string;
  feedbackDeadline: string;
}

const evidenceList = ref<EvidenceRow[]>([]);
const loading = ref(false);
const showForm = ref(false);
const editingId = ref<number | null>(null);

const formData = ref({
  serialNumber: '',
  projectName: '',
  auditedUnit: '',
  matterSummary: '',
  evidenceContent: '',
  legalBasis: '',
  auditorName: '',
  compileDate: '',
  providerOpinion: '',
  providerSignature: '',
  feedbackDeadline: '',
});

function resetForm(): void {
  formData.value = {
    serialNumber: '',
    projectName: props.projectInfo?.name || '',
    auditedUnit: props.projectInfo?.auditedTarget || '',
    matterSummary: '',
    evidenceContent: '',
    legalBasis: '',
    auditorName: '',
    compileDate: '',
    providerOpinion: '',
    providerSignature: '',
    feedbackDeadline: '',
  };
}

onMounted(() => {
  loadEvidence();
});

async function loadEvidence(): Promise<void> {
  loading.value = true;
  try {
    const res = await window.electronAPI.evidence.getByProjectId(props.projectId);
    if (res.success && res.data) {
      evidenceList.value = res.data;
    }
  } finally {
    loading.value = false;
  }
}

function openForm(): void {
  resetForm();
  editingId.value = null;
  showForm.value = true;
}

function closeForm(): void {
  showForm.value = false;
  editingId.value = null;
}

function editItem(item: EvidenceRow): void {
  editingId.value = item.id;
  formData.value = {
    serialNumber: item.serialNumber,
    projectName: item.projectName,
    auditedUnit: item.auditedUnit,
    matterSummary: item.matterSummary,
    evidenceContent: item.evidenceContent,
    legalBasis: item.legalBasis,
    auditorName: item.auditorName,
    compileDate: item.compileDate,
    providerOpinion: item.providerOpinion,
    providerSignature: item.providerSignature,
    feedbackDeadline: item.feedbackDeadline,
  };
  showForm.value = true;
}

async function handleSaveForm(): Promise<void> {
  try {
    const data = { projectId: props.projectId, ...formData.value };
    if (editingId.value) {
      const res = await window.electronAPI.evidence.update(editingId.value, data);
      if (res.success) {
        closeForm();
        await loadEvidence();
      }
    } else {
      const res = await window.electronAPI.evidence.create(data);
      if (res.success) {
        closeForm();
        await loadEvidence();
      }
    }
  } catch (e: unknown) {
    alert('保存失败：' + (e as Error).message);
  }
}

async function deleteItem(id: number): Promise<void> {
  if (confirm('确定要删除该取证单吗？')) {
    await window.electronAPI.evidence.delete(id);
    await loadEvidence();
  }
}

async function exportItem(item: EvidenceRow): Promise<void> {
  try {
    const res = await window.electronAPI.documents.openSaveDialog(`审计取证单_${item.serialNumber}.docx`);
    if (res.success && res.data) {
      const genRes = await window.electronAPI.documents.generate('tpl_audit_evidence', { ...item }, res.data.filePath);
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
