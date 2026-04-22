<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div v-if="store.loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else-if="store.error" class="card bg-red-50 border-red-200 text-red-700 mb-4">{{ store.error }}</div>
    <template v-else-if="store.currentProject">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800">{{ store.currentProject.name }}</h2>
        <p class="text-sm text-gray-500 mt-1">
          {{ store.currentProject.auditedUnit }} | {{ store.currentProject.auditType }}
        </p>
      </div>

      <!-- 阶段导航 -->
      <div class="card mb-6">
        <h3 class="text-lg font-semibold mb-4">审计工作流</h3>
        <div class="flex items-center gap-2 overflow-x-auto">
          <div
            v-for="(stageInfo, idx) in stages"
            :key="stageInfo.key"
            class="flex items-center gap-2"
          >
            <button
              :class="[
                'px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all min-w-[120px] text-center',
                stageStatusClass(stageInfo.key),
              ]"
              @click="goToStage(stageInfo.key)"
            >
              <div class="text-base">{{ stageInfo.label }}</div>
              <div class="text-xs mt-0.5 opacity-75">{{ stageStatusLabel(stageInfo.key) }}</div>
            </button>
            <span v-if="idx < stages.length - 1" class="text-gray-300">→</span>
          </div>
        </div>
      </div>

      <!-- 附加文档 -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">附加文档</h3>
        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="doc in additionalDocs"
            :key="doc.template"
            class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
            @click="openDocument(doc.template, doc.label)"
          >
            <svg class="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="text-sm text-gray-700">{{ doc.label }}</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useProjectStore } from '@stores/project';
import { AuditStage } from '@shared/types';

const props = defineProps<{ id: string }>();
const router = useRouter();
const route = useRoute();
const store = useProjectStore();

const stages = [
  { key: AuditStage.NOTICE, label: '一阶段', full: '审计通知' },
  { key: AuditStage.SURVEY, label: '二阶段', full: '审计调查' },
  { key: AuditStage.PLAN, label: '三阶段', full: '审计方案' },
  { key: AuditStage.EVIDENCE, label: '四阶段', full: '审计取证' },
  { key: AuditStage.WORKING_PAPER, label: '五阶段', full: '审计底稿' },
  { key: AuditStage.REPORT, label: '六阶段', full: '审计报告' },
];

const additionalDocs = [
  { template: 'tpl_auditee_commitment', label: '被审计单位承诺书' },
  { template: 'tpl_audit_document_delivery_receipt', label: '审计文书送达回证' },
  { template: 'tpl_audit_eight_prohibitions_requirements', label: '审计八不准工作纪律' },
  { template: 'tpl_er_audit_announcement', label: '审计公示' },
  { template: 'tpl_er_result_report', label: '经济责任审计结果报告' },
  { template: 'tpl_er_audit_report_consultation', label: '审计报告征求意见书' },
  { template: 'tpl_investigation_interview_record', label: '调查谈话笔录' },
  { template: 'tpl_review_opinion', label: '复核意见书' },
  { template: 'tpl_issues_not_reflected_in_audit_report', label: '未反映问题清单' },
  { template: 'tpl_work_report_outline', label: '述职报告提纲' },
  { template: 'tpl_draft_cover', label: '报告代拟稿封面' },
  { template: 'tpl_adjudication_meeting_minutes', label: '审理会议纪要' },
  { template: 'tpl_adjudication_opinion', label: '审理意见书' },
];

onMounted(async () => {
  await store.loadProject(Number(props.id));
  await store.loadStages(Number(props.id));
});

function goToStage(stage: AuditStage): void {
  router.push({ name: 'stage', params: { id: props.id, stage } });
}

function stageStatusClass(stage: AuditStage): string {
  const status = store.getStageStatus(stage);
  const base = 'border';
  switch (status) {
    case 'completed':
      return `${base} border-green-400 bg-green-50 text-green-700`;
    case 'in_progress':
      return `${base} border-blue-400 bg-blue-50 text-blue-700`;
    default:
      return `${base} border-gray-200 bg-gray-50 text-gray-500`;
  }
}

function stageStatusLabel(stage: AuditStage): string {
  const status = store.getStageStatus(stage);
  const map: Record<string, string> = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
  };
  return map[status] || status;
}

async function openDocument(template: string, label: string): Promise<void> {
  try {
    const res = await window.electronAPI.documents.openSaveDialog(`${label}.docx`);
    if (res.success && res.data) {
      const genRes = await window.electronAPI.documents.generate(template, {}, res.data.filePath);
      if (genRes.success) {
        alert('文档已生成：' + res.data!.filePath);
      } else {
        alert('生成失败：' + (genRes.message || '未知错误'));
      }
    }
  } catch (e: unknown) {
    alert('操作失败：' + (e as Error).message);
  }
}
</script>
