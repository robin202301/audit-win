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

    <!-- 审计类型不匹配的步骤 -->
    <div v-else-if="workflowStep && workflowStep.auditType && !isStepValidForAuditType" class="card text-center py-12 text-gray-500">
      <p class="text-lg mb-4">该步骤不适用于当前审计类型（{{ workflowStep.auditType }}）</p>
      <button class="btn-primary" @click="goBack">返回项目</button>
    </div>

    <!-- 取证单/底稿使用专用列表管理组件（1:N关系） -->
    <component
      v-else-if="isListComponent"
      :is="listComponent"
      :key="`${projectId}-${stage}`"
      :project-id="Number(projectId)"
      :project-info="projectInfo"
      :stage="stage"
    />

    <!-- 模板型步骤（0字段）使用大输入框编辑器，支持模板内容编辑 -->
    <UniversalStageEditor
      v-else-if="isTemplateOnlyStep"
      :key="`${projectId}-${stage}`"
      :project-id="Number(projectId)"
      :step="workflowStep!"
      :project-info="projectInfo!"
    />

    <!-- 其余所有有字段的步骤使用通用表单（结构化字段 + 自动导入前序数据） -->
    <GenericStageForm
      v-else-if="workflowStep"
      :key="`${projectId}-${stage}`"
      :project-id="Number(projectId)"
      :step="workflowStep"
      :project-info="projectInfo!"
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
import { WORKFLOW_STEPS, AuditStage } from '@shared/types';
import StageEvidence from './StageEvidence.vue';
import StageWorkingPaper from './StageWorkingPaper.vue';
import StageArchiveCatalog from './StageArchiveCatalog.vue';
import StageInterviewRecord from './stages/StageInterviewRecord.vue';
import GenericStageForm from './stages/GenericStageForm.vue';
import UniversalStageEditor from './stages/UniversalStageEditor.vue';
import { STAGE_FORM_CONFIGS } from './stages/stageConfigs';

const props = defineProps<{ id: string; stage: string }>();
const router = useRouter();
const store = useProjectStore();

const projectId = props.id;
const stage = props.stage;

const workflowStep = computed(() => WORKFLOW_STEPS.find(s => s.key === stage));
const isStepValidForAuditType = computed(() => {
  const step = WORKFLOW_STEPS.find(s => s.key === stage);
  if (!step || !step.auditType) return true; // 通用步骤
  return projectInfo.value?.auditType === step.auditType;
});
// 模板型步骤：有配置但无表单字段，使用大输入框编辑器编辑模板内容
const isTemplateOnlyStep = computed(() => {
  const config = STAGE_FORM_CONFIGS[stage];
  return config && config.fields.length === 0;
});
const stepTitle = computed(() => workflowStep.value?.label || '未知阶段');

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

// 仅取证单和底稿使用专用列表组件（1:N 关系，需要关联管理）
const LIST_STAGES: Record<string, object> = {
  evidence: markRaw(StageEvidence),
  working_paper: markRaw(StageWorkingPaper),
  archive_catalog: markRaw(StageArchiveCatalog),
  interview_record: markRaw(StageInterviewRecord),
};

const isListComponent = computed(() => !!LIST_STAGES[stage]);
const listComponent = shallowRef(LIST_STAGES[stage] || null);

function goBack(): void {
  router.push({ name: 'project-detail', params: { id: projectId } });
}
</script>
