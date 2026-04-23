<template>
  <div>
    <div class="card mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">审计底稿管理</h2>
        <button class="btn-primary" @click="openForm">新增底稿</button>
      </div>

      <div v-if="loading" class="text-center py-4 text-gray-500">加载中...</div>
      <div v-else-if="paperList.length === 0" class="text-center py-4 text-gray-400">暂无底稿，点击上方"新增底稿"添加</div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="text-left py-2 px-3">索引号</th>
            <th class="text-left py-2 px-3">审计事项</th>
            <th class="text-left py-2 px-3">审计人员</th>
            <th class="text-left py-2 px-3">编制日期</th>
            <th class="text-left py-2 px-3">审核意见</th>
            <th class="text-left py-2 px-3">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paperList" :key="item.id" v-memo="[item.indexNumber, item.auditMatter, item.auditorName, item.compileDate, item.reviewerOpinion]" class="border-b hover:bg-gray-50">
            <td class="py-2 px-3">{{ item.indexNumber }}</td>
            <td class="py-2 px-3 max-w-xs truncate">{{ item.auditMatter }}</td>
            <td class="py-2 px-3">{{ item.auditorName }}</td>
            <td class="py-2 px-3">{{ item.compileDate }}</td>
            <td class="py-2 px-3">{{ item.reviewerOpinion || '待审核' }}</td>
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
        <h3 class="text-lg font-bold mb-4">{{ editingId ? '编辑底稿' : '新增底稿' }}</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="label-base">索引号</label>
            <input v-model="formData.indexNumber" class="input-base" placeholder="请输入索引号" />
          </div>
          <div>
            <label class="label-base">项目名称</label>
            <input v-model="formData.projectName" class="input-base" placeholder="请输入项目名称" />
          </div>
          <div class="md:col-span-2">
            <label class="label-base">审计（调查）事项</label>
            <input v-model="formData.auditMatter" class="input-base" placeholder="请输入审计事项" />
          </div>
          <div>
            <label class="label-base">审计人员</label>
            <input v-model="formData.auditorName" class="input-base" placeholder="请输入审计人员" />
          </div>
          <div>
            <label class="label-base">编制日期</label>
            <input v-model="formData.compileDate" type="date" class="input-base" />
          </div>
          <div class="md:col-span-2">
            <label class="label-base">审计过程</label>
            <textarea v-model="formData.auditProcess" class="input-base" rows="4" placeholder="说明实施审计的主要步骤和方法、所取得的审计证据"></textarea>
          </div>
          <div class="md:col-span-2">
            <label class="label-base">审计认定的事实摘要</label>
            <textarea v-model="formData.factSummary" class="input-base" rows="3" placeholder="请输入审计认定的事实摘要"></textarea>
          </div>
          <div class="md:col-span-2">
            <label class="label-base">审计结论</label>
            <textarea v-model="formData.auditConclusion" class="input-base" rows="3" placeholder="请输入审计结论"></textarea>
          </div>
          <div>
            <label class="label-base">审核人员</label>
            <input v-model="formData.reviewerName" class="input-base" placeholder="请输入审核人员" />
          </div>
          <div>
            <label class="label-base">审核日期</label>
            <input v-model="formData.reviewDate" type="date" class="input-base" />
          </div>
          <div class="md:col-span-2">
            <label class="label-base">审核意见</label>
            <select v-model="formData.reviewerOpinion" class="input-base">
              <option value="">请选择审核意见</option>
              <option value="予以认可">予以认可</option>
              <option value="责成采取进一步审计措施">责成采取进一步审计措施，获取适当、充分的审计证据</option>
              <option value="纠正或责成纠正">纠正或者责成纠正不恰当的审计结论</option>
            </select>
          </div>
          <div>
            <label class="label-base">附件页数</label>
            <input v-model.number="formData.attachmentCount" type="number" class="input-base" placeholder="请输入附件页数" />
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

const props = defineProps<{ projectId: number; stage: AuditStage }>();

interface PaperRow {
  id: number;
  indexNumber: string;
  projectName: string;
  auditMatter: string;
  auditorName: string;
  compileDate: string;
  auditProcess: string;
  factSummary: string;
  auditConclusion: string;
  reviewerOpinion: string;
  reviewerName: string;
  reviewDate: string;
  attachmentCount: number;
}

const paperList = ref<PaperRow[]>([]);
const loading = ref(false);
const showForm = ref(false);
const editingId = ref<number | null>(null);

const formData = ref({
  indexNumber: '',
  projectName: '',
  auditMatter: '',
  auditorName: '',
  compileDate: '',
  auditProcess: '',
  factSummary: '',
  auditConclusion: '',
  reviewerOpinion: '',
  reviewerName: '',
  reviewDate: '',
  attachmentCount: 0,
});

function resetForm(): void {
  formData.value = {
    indexNumber: '',
    projectName: '',
    auditMatter: '',
    auditorName: '',
    compileDate: '',
    auditProcess: '',
    factSummary: '',
    auditConclusion: '',
    reviewerOpinion: '',
    reviewerName: '',
    reviewDate: '',
    attachmentCount: 0,
  };
}

onMounted(() => {
  loadPapers();
});

async function loadPapers(): Promise<void> {
  loading.value = true;
  try {
    const res = await window.electronAPI.workingPapers.getByProjectId(props.projectId);
    if (res.success && res.data) {
      paperList.value = res.data;
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

function editItem(item: PaperRow): void {
  editingId.value = item.id;
  formData.value = {
    indexNumber: item.indexNumber,
    projectName: item.projectName,
    auditMatter: item.auditMatter,
    auditorName: item.auditorName,
    compileDate: item.compileDate,
    auditProcess: item.auditProcess,
    factSummary: item.factSummary,
    auditConclusion: item.auditConclusion,
    reviewerOpinion: item.reviewerOpinion,
    reviewerName: item.reviewerName,
    reviewDate: item.reviewDate,
    attachmentCount: item.attachmentCount,
  };
  showForm.value = true;
}

async function handleSaveForm(): Promise<void> {
  try {
    const data = { projectId: props.projectId, ...formData.value };
    if (editingId.value) {
      const res = await window.electronAPI.workingPapers.update(editingId.value, data);
      if (res.success) {
        closeForm();
        await loadPapers();
      }
    } else {
      const res = await window.electronAPI.workingPapers.create(data);
      if (res.success) {
        closeForm();
        await loadPapers();
      }
    }
  } catch (e: unknown) {
    alert('保存失败：' + (e as Error).message);
  }
}

async function deleteItem(id: number): Promise<void> {
  if (confirm('确定要删除该底稿吗？')) {
    await window.electronAPI.workingPapers.delete(id);
    await loadPapers();
  }
}

async function exportItem(item: PaperRow): Promise<void> {
  try {
    const res = await window.electronAPI.documents.openSaveDialog(`审计底稿_${item.indexNumber}.docx`);
    if (res.success && res.data) {
      const genRes = await window.electronAPI.documents.generate('tpl_working_paper', { ...item }, res.data.filePath);
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
