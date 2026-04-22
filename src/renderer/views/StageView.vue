<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-4 flex items-center gap-2 text-sm text-gray-500">
      <button class="hover:text-blue-600" @click="goBack">返回项目</button>
      <span>/</span>
      <span class="text-gray-800 font-medium">{{ stageTitle }}</span>
    </div>

    <component
      :is="stageComponent"
      :project-id="Number(projectId)"
      :stage="stage"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, markRaw, shallowRef, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { AuditStage, STAGE_LABELS } from '@shared/types';
import StageNotice from './StageNotice.vue';
import StageSurvey from './StageSurvey.vue';
import StagePlan from './StagePlan.vue';
import StageEvidence from './StageEvidence.vue';
import StageWorkingPaper from './StageWorkingPaper.vue';
import StageReport from './StageReport.vue';

const props = defineProps<{ id: string; stage: string }>();
const router = useRouter();
const route = useRoute();

const projectId = props.id;
const stage = props.stage as AuditStage;

const stageTitle = computed(() => STAGE_LABELS[stage] || '未知阶段');

const componentMap: Record<AuditStage, object> = {
  [AuditStage.NOTICE]: markRaw(StageNotice),
  [AuditStage.SURVEY]: markRaw(StageSurvey),
  [AuditStage.PLAN]: markRaw(StagePlan),
  [AuditStage.EVIDENCE]: markRaw(StageEvidence),
  [AuditStage.WORKING_PAPER]: markRaw(StageWorkingPaper),
  [AuditStage.REPORT]: markRaw(StageReport),
};

const stageComponent = shallowRef(componentMap[stage] || null);

watch(() => props.stage, (newStage) => {
  const key = newStage as AuditStage;
  stageComponent.value = componentMap[key] || null;
});

function goBack(): void {
  router.push({ name: 'project-detail', params: { id: projectId } });
}

function handleSaved(): void {
  router.push({ name: 'project-detail', params: { id: projectId } });
}
</script>
