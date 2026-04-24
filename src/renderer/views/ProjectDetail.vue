<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div v-if="store.loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else-if="store.error" class="card bg-red-50 border-red-200 text-red-700 mb-4">{{ store.error }}</div>
    <template v-else-if="store.currentProject">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800">{{ store.currentProject.name }}</h2>
        <p class="text-sm text-gray-500 mt-1">
          {{ store.currentProject.auditedTarget }} | {{ store.currentProject.auditType }}
        </p>
      </div>

      <!-- 阶段分组 -->
      <div class="card mb-6">
        <div class="flex gap-2 mb-4 border-b border-gray-200">
          <button
            v-for="phase in phaseTabs"
            :key="phase.num"
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 transition-all',
              currentPhase === phase.num
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
            @click="currentPhase = phase.num"
          >
            {{ phase.label }}
          </button>
        </div>

        <!-- 当前阶段的步骤列表 -->
        <div class="grid gap-2">
          <button
            v-for="step in phases[currentPhase]"
            :key="step.key"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
            @click="goToStep(step.key)"
          >
            <div class="flex items-center gap-3">
              <span class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold">
                {{ step.stepNumber }}
              </span>
              <span class="text-sm text-gray-700">{{ step.label }}</span>
              <span v-if="step.importFrom && step.importFrom.length > 0" class="text-xs text-blue-400">（引用前序数据）</span>
            </div>
            <span :class="getStatusClass(step.key)" class="text-xs">
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

// 按阶段分组
const phases = computed(() => {
  const groups: Record<number, typeof WORKFLOW_STEPS> = {};
  for (const step of WORKFLOW_STEPS) {
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
  const base = 'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all min-w-[140px] text-center border';
  switch (status) {
    case 'completed':
      return `${base} border-green-400 bg-green-50 text-green-700`;
    case 'in_progress':
      return `${base} border-blue-400 bg-blue-50 text-blue-700`;
    default:
      return `${base} border-gray-200 bg-gray-50 text-gray-500`;
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

const phaseTabs = [
  { num: 1, label: '审计准备' },
  { num: 2, label: '审计实施' },
  { num: 3, label: '审计报告' },
  { num: 4, label: '审计处理' },
  { num: 5, label: '审计归档' },
];
</script>
