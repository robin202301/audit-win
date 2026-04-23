<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800">审计项目列表</h2>
      <button class="btn-primary" @click="showCreateDialog = true">
        新建项目
      </button>
    </div>

    <div v-if="store.loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else-if="store.error" class="card bg-red-50 border-red-200 text-red-700 mb-4">
      {{ store.error }}
    </div>

    <div v-else-if="store.projects.length === 0" class="text-center py-12 text-gray-400">
      暂无项目，点击右上角"新建项目"开始创建
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="project in store.projects"
        :key="project.id"
        class="card cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
        @click="openProject(project.id)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-800 truncate">{{ project.name }}</h3>
            <p class="text-sm text-gray-500 mt-1">{{ project.auditedTarget }}</p>
            <p class="text-xs text-gray-400 mt-2">{{ project.auditType }}</p>
          </div>
          <span :class="statusBadge(project.status)">
            {{ statusLabel(project.status) }}
          </span>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span class="text-xs text-gray-400">{{ formatDate(project.createdAt) }}</span>
          <button
            class="text-xs text-red-500 hover:text-red-700"
            @click.stop="confirmDelete(project.id, project.name)"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 新建项目对话框 -->
    <div v-if="showCreateDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h3 class="text-lg font-bold mb-4">新建审计项目</h3>
        <div class="space-y-4">
          <div>
            <label class="label-base">项目名称 <span class="text-red-500">*</span></label>
            <input v-model="newProject.name" class="input-base" placeholder="请输入项目名称" />
          </div>
          <div>
            <label class="label-base">被审计单位/个人</label>
            <input v-model="newProject.auditedTarget" class="input-base" placeholder="请输入被审计单位或个人名称" />
          </div>
          <div>
            <label class="label-base">审计类型</label>
            <select v-model="newProject.auditType" class="input-base">
              <option value="经济责任审计">经济责任审计</option>
              <option value="预算执行审计">预算执行审计</option>
              <option value="财政收支审计">财政收支审计</option>
              <option value="预算执行和其他财政收支审计">预算执行和其他财政收支审计</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn-secondary" @click="showCreateDialog = false">取消</button>
          <button class="btn-primary" @click="handleCreate" :disabled="!newProject.name">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '@stores/project';
import type { Project } from '@shared/types';

const router = useRouter();
const store = useProjectStore();

const showCreateDialog = ref(false);
const newProject = reactive({
  name: '',
  auditedTarget: '',
  auditType: '经济责任审计',
});

onMounted(() => {
  store.loadProjects();
});

function openProject(id: number): void {
  router.push({ name: 'project-detail', params: { id: id.toString() } });
}

async function handleCreate(): Promise<void> {
  if (!newProject.name.trim()) return;
  const id = await store.createProject({
    name: newProject.name.trim(),
    auditedTarget: newProject.auditedTarget.trim(),
    auditType: newProject.auditType,
  });
  if (id) {
    showCreateDialog.value = false;
    newProject.name = '';
    newProject.auditedTarget = '';
  }
}

async function confirmDelete(id: number, name: string): Promise<void> {
  if (confirm(`确定要删除项目"${name}"吗？此操作不可恢复。`)) {
    await store.deleteProject(id);
  }
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700 px-2 py-1 rounded text-xs',
    archived: 'bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs',
    draft: 'bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs',
  };
  return map[status] || map.draft;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = { active: '进行中', archived: '已归档', draft: '草稿' };
  return map[status] || status;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
</script>
