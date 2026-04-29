<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- 页面标题栏 -->
    <div class="gov-page-header mb-6">
      <div class="gov-header-row">
        <div>
          <h2 class="gov-page-title">审计项目列表</h2>
          <p class="gov-page-subtitle">管理所有审计项目，点击进入项目详情</p>
        </div>
        <div class="gov-header-actions">
          <div class="gov-search-wrapper">
            <svg class="gov-search-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242.656a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
            </svg>
            <input v-model="searchKeyword" class="gov-search-input" placeholder="根据项目名称模糊搜索" />
          </div>
          <button class="gov-btn-create" @click="showCreateDialog = true">
            <svg class="w-4 h-4 mr-1" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            新建项目
          </button>
        </div>
      </div>
    </div>

    <div v-if="store.loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else-if="store.error" class="card bg-red-50 border-red-200 text-red-700 mb-4">
      {{ store.error }}
    </div>

    <div v-else-if="filteredProjects.length === 0" class="gov-empty-state">
      <svg class="gov-empty-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="8" y="12" width="48" height="40" rx="4"/>
        <path d="M20 24h24M20 34h16M20 44h10" stroke-linecap="round"/>
      </svg>
      <p class="gov-empty-text">{{ searchKeyword ? '未找到匹配的项目' : '暂无项目，点击"新建项目"开始创建' }}</p>
    </div>

    <div v-else class="gov-project-grid">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="gov-project-card"
        @click="openProject(project.id)"
      >
        <div class="gov-card-header">
          <h3 class="gov-card-title">{{ project.name }}</h3>
          <span :class="statusBadge(project.status)">
            {{ statusLabel(project.status) }}
          </span>
        </div>
        <div class="gov-card-body">
          <div class="gov-card-info">
            <span class="gov-info-label">被审计单位</span>
            <span class="gov-info-value">{{ project.auditedTarget }}</span>
          </div>
          <div class="gov-card-info">
            <span class="gov-info-label">审计类型</span>
            <span class="gov-info-value gov-audit-type">{{ project.auditType }}</span>
          </div>
        </div>
        <div class="gov-card-footer">
          <span class="gov-card-date">{{ formatDate(project.createdAt) }}</span>
          <button
            class="gov-btn-delete"
            @click.stop="confirmDelete(project.id, project.name)"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 新建项目对话框 -->
    <div v-if="showCreateDialog" class="gov-modal-overlay" @click.self="showCreateDialog = false">
      <div class="gov-modal">
        <div class="gov-modal-header">
          <h3 class="gov-modal-title">新建审计项目</h3>
          <button class="gov-modal-close" @click="showCreateDialog = false">
            <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="gov-modal-body">
          <div class="gov-form-group">
            <label class="gov-form-label">项目名称 <span class="text-red-500">*</span></label>
            <input v-model="newProject.name" class="gov-form-input" placeholder="请输入项目名称" />
          </div>
          <div class="gov-form-group">
            <label class="gov-form-label">被审计单位</label>
            <input v-model="newProject.auditedTarget" class="gov-form-input" placeholder="请输入被审计单位名称" />
          </div>
          <div class="gov-form-group">
            <label class="gov-form-label">审计类型</label>
            <select v-model="newProject.auditType" class="gov-form-select">
              <option value="经济责任审计">经济责任审计</option>
              <option value="预算执行审计">预算执行审计</option>
              <option value="专项审计调查">专项审计调查</option>
            </select>
          </div>
        </div>
        <div class="gov-modal-footer">
          <button class="gov-btn-cancel" @click="showCreateDialog = false">取消</button>
          <button class="gov-btn-confirm" @click="handleCreate" :disabled="!newProject.name">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '@stores/project';
import type { Project } from '@shared/types';

const router = useRouter();
const store = useProjectStore();

const showCreateDialog = ref(false);
const searchKeyword = ref('');
const newProject = reactive({
  name: '',
  auditedTarget: '',
  auditType: '经济责任审计',
});

const filteredProjects = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase();
  if (!kw) return store.projects;
  return store.projects.filter((p: Project) => p.name.toLowerCase().includes(kw));
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
    active: 'gov-status-tag gov-tag-active',
    archived: 'gov-status-tag gov-tag-archived',
    draft: 'gov-status-tag gov-tag-draft',
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

<style scoped>
/* 页面标题栏 */
.gov-page-header {
  background: linear-gradient(135deg, #fff 0%, #fff8f0 100%);
  border: 1px solid #e8d5b7;
  border-left: 4px solid #8B0000;
  border-radius: 8px;
  padding: 16px 24px;
  box-shadow: 0 2px 12px rgba(139, 0, 0, 0.06);
}

.gov-page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px;
}

.gov-page-subtitle {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
}

.gov-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.gov-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gov-search-wrapper {
  display: flex;
  align-items: center;
  background: #faf8f5;
  border: 1px solid #e8d5b7;
  border-radius: 6px;
  padding: 0 12px;
  transition: border-color 0.2s;
}

.gov-search-wrapper:focus-within {
  border-color: #8B0000;
  box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
}

.gov-search-icon {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  flex-shrink: 0;
}

.gov-search-input {
  border: none;
  background: transparent;
  padding: 8px 8px;
  font-size: 14px;
  color: #1f2937;
  outline: none;
  width: 220px;
}

.gov-search-input::placeholder {
  color: #9ca3af;
}

.gov-btn-create {
  display: flex;
  align-items: center;
  padding: 8px 20px;
  background: linear-gradient(135deg, #8B0000, #B22222);
  color: #FFD700;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(139, 0, 0, 0.2);
}

.gov-btn-create:hover {
  background: linear-gradient(135deg, #a00000, #c42828);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 0, 0, 0.3);
}

/* 空状态 */
.gov-empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border: 1px solid #e8d5b7;
  border-radius: 8px;
}

.gov-empty-icon {
  width: 80px;
  height: 80px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.gov-empty-text {
  color: #9ca3af;
  font-size: 15px;
  margin: 0;
}

/* 项目网格 */
.gov-project-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(1, 1fr);
}

@media (min-width: 640px) {
  .gov-project-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .gov-project-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 项目卡片 */
.gov-project-card {
  background: linear-gradient(135deg, #fff 0%, #fffaf5 100%);
  border: 1px solid #e8d5b7;
  border-radius: 8px;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(139, 0, 0, 0.04);
  overflow: hidden;
}

.gov-project-card:hover {
  border-color: #c2410c;
  box-shadow: 0 4px 16px rgba(139, 0, 0, 0.12);
  transform: translateY(-2px);
}

.gov-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 20px 12px;
  background: linear-gradient(135deg, rgba(139, 0, 0, 0.03) 0%, rgba(255, 248, 240, 0.5) 100%);
  border-bottom: 1px solid #f0e0cc;
}

.gov-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
  margin-right: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gov-status-tag {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.gov-tag-active {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.gov-tag-archived {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.gov-tag-draft {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fdba74;
}

.gov-card-body {
  padding: 12px 20px;
}

.gov-card-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.gov-card-info:last-child {
  margin-bottom: 0;
}

.gov-info-label {
  font-size: 12px;
  color: #9ca3af;
  min-width: 60px;
}

.gov-info-value {
  font-size: 13px;
  color: #4b5563;
}

.gov-audit-type {
  background: rgba(139, 0, 0, 0.08);
  color: #8B0000;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.gov-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #f0e0cc;
}

.gov-card-date {
  font-size: 12px;
  color: #9ca3af;
}

.gov-btn-delete {
  font-size: 12px;
  color: #dc2626;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.gov-btn-delete:hover {
  background: #fef2f2;
  color: #b91c1c;
}

/* 弹窗 */
.gov-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.gov-modal {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(139, 0, 0, 0.2);
  width: 100%;
  max-width: 480px;
  margin: 0 16px;
  overflow: hidden;
}

.gov-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(135deg, #8B0000, #B22222);
  color: #FFD700;
}

.gov-modal-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 2px;
}

.gov-modal-close {
  background: none;
  border: none;
  color: rgba(255, 215, 0, 0.7);
  cursor: pointer;
  padding: 4px;
  display: flex;
  transition: color 0.2s;
}

.gov-modal-close:hover {
  color: #FFD700;
}

.gov-modal-body {
  padding: 24px;
}

.gov-form-group {
  margin-bottom: 16px;
}

.gov-form-group:last-child {
  margin-bottom: 0;
}

.gov-form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.gov-form-input,
.gov-form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #1f2937;
  background: #faf8f5;
  transition: border-color 0.2s;
}

.gov-form-input:focus,
.gov-form-select:focus {
  outline: none;
  border-color: #8B0000;
  box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
}

.gov-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #faf8f5;
  border-top: 1px solid #e8d5b7;
}

.gov-btn-cancel {
  padding: 8px 20px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.gov-btn-cancel:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.gov-btn-confirm {
  padding: 8px 24px;
  background: linear-gradient(135deg, #8B0000, #B22222);
  color: #FFD700;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(139, 0, 0, 0.2);
}

.gov-btn-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #a00000, #c42828);
  transform: translateY(-1px);
}

.gov-btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>