<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-4 flex items-center gap-2 text-sm text-gray-500">
      <button class="hover:text-blue-600" @click="goBack">返回项目</button>
      <span>/</span>
      <span class="text-gray-800 font-medium">{{ stepTitle }}</span>
    </div>

    <!-- Loading placeholder -->
    <div v-if="!projectInfo" class="card text-center py-12 text-gray-500">
      加载中...
    </div>

    <!-- 原有6阶段使用专用组件 -->
    <component
      v-else-if="isLegacyStage"
      :is="legacyComponent"
      :key="`${projectId}-${stage}`"
      :project-id="Number(projectId)"
      :project-info="projectInfo"
      :stage="stage"
      @saved="handleSaved"
    />

    <!-- 新步骤使用通用编辑器 -->
    <UniversalStageEditor
      v-else-if="workflowStep"
      :key="`${projectId}-${stage}`"
      :project-id="Number(projectId)"
      :step="workflowStep"
      :project-info="projectInfo"
    />

    <div v-else class="card text-center py-12 text-gray-500">
      未知步骤：{{ stage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '@stores/project';
import { WORKFLOW_STEPS } from '@shared/types';
import StageNotice from './StageNotice.vue';
import StageSurvey from './StageSurvey.vue';
import StagePlan from './StagePlan.vue';
import StageEvidence from './StageEvidence.vue';
import StageWorkingPaper from './StageWorkingPaper.vue';
import StageReport from './StageReport.vue';
import UniversalStageEditor from './stages/UniversalStageEditor.vue';

const props = defineProps<{ id: string; stage: string }>();
const router = useRouter();
const store = useProjectStore();

const projectId = props.id;
const stage = props.stage;

const workflowStep = computed(() => WORKFLOW_STEPS.find(s => s.key === stage));
const stepTitle = computed(() => workflowStep.value?.label || '未知阶段');

// 阻塞式加载：确保 projectInfo 就绪后才渲染子组件
const projectInfo = shallowRef<{ name: string; auditedTarget: string; auditType: string } | null>(null);

onMounted(async () => {
  await store.loadProject(Number(projectId));
  if (store.currentProject) {
    projectInfo.value = {
      name: store.currentProject.name,
      auditedTarget: store.currentProject.auditedTarget,
      auditType: store.currentProject.auditType,
    };
  }
});

const LEGACY_STAGE_MAP: Record<string, object> = {
  notice: markRaw(StageNotice),
  survey: markRaw(StageSurvey),
  plan: markRaw(StagePlan),
  evidence: markRaw(StageEvidence),
  working_paper: markRaw(StageWorkingPaper),
  report: markRaw(StageReport),
};

const isLegacyStage = computed(() => !!LEGACY_STAGE_MAP[stage]);
const legacyComponent = shallowRef(LEGACY_STAGE_MAP[stage] || null);

function goBack(): void {
  router.push({ name: 'project-detail', params: { id: projectId } });
}

function handleSaved(): void {
  router.push({ name: 'project-detail', params: { id: projectId } });
}
</script>
