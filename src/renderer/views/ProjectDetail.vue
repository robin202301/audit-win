<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- 项目信息卡片 -->
    <div v-if="store.currentProject" class="gov-project-card mb-6">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="gov-project-title">{{ store.currentProject.name }}</h2>
          <div class="gov-project-meta">
            <span class="gov-meta-tag">{{ store.currentProject.auditType }}</span>
            <span class="gov-meta-text">{{ store.currentProject.auditedTarget }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <span :class="statusBadgeClass(store.currentProject.status)">
            {{ statusLabel(store.currentProject.status) }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="store.loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else-if="store.error" class="card bg-red-50 border-red-200 text-red-700 mb-4">{{ store.error }}</div>
    <template v-else-if="store.currentProject">
      <!-- 阶段分组 -->
      <div class="gov-stage-panel mb-6">
        <div class="gov-phase-tabs">
          <button
            v-for="phase in phaseTabs"
            :key="phase.num"
            :class="[
              'gov-phase-tab',
              currentPhase === phase.num ? 'gov-phase-tab-active' : '',
            ]"
            @click="currentPhase = phase.num"
          >
            <span class="gov-phase-num">{{ phase.num }}</span>
            <span class="gov-phase-label">{{ phase.label }}</span>
          </button>
        </div>

        <!-- 当前阶段的步骤列表 -->
        <div class="gov-steps-list">
          <button
            v-for="step in phases[currentPhase]"
            :key="step.key"
            class="gov-step-item"
            @click="goToStep(step.key)"
          >
            <div class="flex items-center gap-3">
              <span class="gov-step-number">{{ step.stepNumber }}</span>
              <div class="gov-step-info">
                <span class="gov-step-label">{{ step.label }}</span>
                <span v-if="step.auditType" class="gov-step-type">（仅{{ step.auditType }}）</span>
                <span v-if="step.importFrom && step.importFrom.length > 0" class="gov-step-hint">（引用前序数据）</span>
              </div>
            </div>
            <span :class="getStatusClass(step.key)" class="gov-step-status">
              {{ getStatusLabel(step.key) }}
            </span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '@stores/project';
import { WORKFLOW_STEPS } from '@shared/types';

const props = defineProps<{ id: string }>();
const router = useRouter();
const store = useProjectStore();

// 按阶段分组（根据审计类型过滤）
const phases = computed(() => {
  const groups: Record<number, typeof WORKFLOW_STEPS> = {};
  const auditType = store.currentProject?.auditType;
  for (const step of WORKFLOW_STEPS) {
    // 仅经济责任审计类型的步骤才显示
    if (step.auditType && auditType !== step.auditType) continue;
    if (!groups[step.phase]) groups[step.phase] = [];
    groups[step.phase].push(step);
  }
  return groups;
});

const currentPhase = ref(1);

onMounted(async () => {
  await store.loadProject(Number(props.id));
  await store.loadStages(Number(props.id));
});

function goToStep(stepKey: string): void {
  router.push({ name: 'stage', params: { id: props.id, stage: stepKey } });
}

function getStatusClass(stepKey: string): string {
  const status = store.getStageStatus(stepKey as any);
  const base = 'gov-status-tag';
  switch (status) {
    case 'completed':
      return `${base} gov-status-done`;
    case 'in_progress':
      return `${base} gov-status-active`;
    default:
      return `${base} gov-status-pending`;
  }
}

function getStatusLabel(stepKey: string): string {
  const status = store.getStageStatus(stepKey as any);
  const map: Record<string, string> = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
  };
  return map[status] || '未开始';
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    active: 'gov-status-badge gov-badge-active',
    archived: 'gov-status-badge gov-badge-archived',
    draft: 'gov-status-badge gov-badge-draft',
  };
  return map[status] || map.draft;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = { active: '实施中', archived: '已归档', draft: '草稿' };
  return map[status] || status;
}

const phaseTabs = [
  { num: 1, label: '审计准备' },
  { num: 2, label: '审计实施' },
  { num: 3, label: '审计报告' },
  { num: 4, label: '审计处理' },
  { num: 5, label: '审计归档' },
];
</script>

<style scoped>
/* 项目信息卡片 */
.gov-project-card {
  background: linear-gradient(135deg, #fff 0%, #fff8f0 100%);
  border: 1px solid #e8d5b7;
  border-left: 4px solid #8B0000;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(139, 0, 0, 0.08);
}

.gov-project-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.gov-project-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gov-meta-tag {
  background: linear-gradient(135deg, #8B0000, #B22222);
  color: #FFD700;
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.gov-meta-text {
  font-size: 13px;
  color: #6b7280;
}

.gov-status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.gov-badge-active {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.gov-badge-archived {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.gov-badge-draft {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fdba74;
}

/* 阶段面板 */
.gov-stage-panel {
  background: #fff;
  border: 1px solid #e8d5b7;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(139, 0, 0, 0.06);
  overflow: hidden;
}

.gov-phase-tabs {
  display: flex;
  gap: 0;
  background: linear-gradient(180deg, #8B0000 0%, #B22222 100%);
  padding: 0;
  border-bottom: 2px solid #FFD700;
}

.gov-phase-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 8px;
  background: transparent;
  border: none;
  color: rgba(255, 215, 0, 0.7);
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  position: relative;
}

.gov-phase-tab:hover {
  background: rgba(255, 215, 0, 0.1);
  color: rgba(255, 215, 0, 0.9);
}

.gov-phase-tab-active {
  background: rgba(255, 215, 0, 0.15);
  color: #FFD700;
}

.gov-phase-tab-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: #FFD700;
}

.gov-phase-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 215, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}

.gov-phase-tab-active .gov-phase-num {
  background: #FFD700;
  color: #8B0000;
}

.gov-phase-label {
  font-weight: 500;
  letter-spacing: 1px;
}

/* 步骤列表 */
.gov-steps-list {
  padding: 16px;
  display: grid;
  gap: 8px;
}

.gov-step-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #faf8f5 0%, #fff 100%);
  border: 1px solid #e8d5b7;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.gov-step-item:hover {
  background: linear-gradient(135deg, #fff5f0 0%, #fff8f0 100%);
  border-color: #c2410c;
  box-shadow: 0 2px 8px rgba(139, 0, 0, 0.1);
  transform: translateX(2px);
}

.gov-step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B0000, #B22222);
  color: #FFD700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(139, 0, 0, 0.2);
}

.gov-step-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  margin-left: 12px;
}

.gov-step-label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.gov-step-type {
  font-size: 11px;
  color: #dc2626;
  background: #fef2f2;
  padding: 1px 6px;
  border-radius: 3px;
}

.gov-step-hint {
  font-size: 11px;
  color: #92400e;
}

/* 状态标签 */
.gov-status-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  min-width: 72px;
  text-align: center;
}

.gov-status-done {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.gov-status-active {
  background: #fff7ed;
  color: #9a3412;
  border: 1px solid #fdba74;
}

.gov-status-pending {
  background: #f3f4f6;
  color: #9ca3af;
  border: 1px solid #d1d5db;
}
</style>