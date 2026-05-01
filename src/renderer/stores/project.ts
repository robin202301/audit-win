import { defineStore } from 'pinia';
import { markRaw, ref, shallowRef } from 'vue';
import type { Project, StageProgress, IPCResponse } from '@shared/types';

declare global {
  interface Window {
    electronAPI: {
      projects: {
        getAll: () => Promise<IPCResponse<Project[]>>;
        getById: (id: number) => Promise<IPCResponse<Project>>;
        create: (data: { name: string; auditedTarget?: string; auditType?: string }) => Promise<IPCResponse<{ id: number }>>;
        update: (id: number, data: Record<string, unknown>) => Promise<IPCResponse>;
        delete: (id: number) => Promise<IPCResponse>;
      };
      stages: {
        getByProjectId: (projectId: number) => Promise<IPCResponse<StageProgress[]>>;
        updateData: (projectId: number, stage: string, dataJson: string, status?: string) => Promise<IPCResponse>;
      };
      evidence: {
        getByProjectId: (projectId: number) => Promise<IPCResponse>;
        getById: (id: number) => Promise<IPCResponse>;
        create: (data: Record<string, unknown>) => Promise<IPCResponse<{ id: number }>>;
        update: (id: number, data: Record<string, unknown>) => Promise<IPCResponse>;
        delete: (id: number) => Promise<IPCResponse>;
      };
      workingPapers: {
        getByProjectId: (projectId: number) => Promise<IPCResponse>;
        getById: (id: number) => Promise<IPCResponse>;
        create: (data: Record<string, unknown>) => Promise<IPCResponse<{ id: number }>>;
        update: (id: number, data: Record<string, unknown>) => Promise<IPCResponse>;
        delete: (id: number) => Promise<IPCResponse>;
      };
      survey: {
        getByProjectId: (projectId: number) => Promise<IPCResponse>;
        upsert: (projectId: number, data: Record<string, unknown>) => Promise<IPCResponse>;
      };
      files: {
        upload: (data: Record<string, unknown>) => Promise<IPCResponse>;
        getByEntity: (entityType: string, entityId: number) => Promise<IPCResponse>;
        delete: (id: number) => Promise<IPCResponse>;
      };
      documents: {
        generate: (templateName: string, data: Record<string, unknown>, outputPath: string) => Promise<IPCResponse>;
        openSaveDialog: (defaultName: string) => Promise<IPCResponse<{ filePath: string }>>;
        generateExcel: (templateName: string, data: Record<string, unknown>, outputPath: string) => Promise<IPCResponse>;
        parseWord: (arrayBuffer: ArrayBuffer) => Promise<IPCResponse>;
      };
      settings: {
        getAll: () => Promise<IPCResponse<Record<string, string>>>;
        set: (key: string, value: string) => Promise<IPCResponse>;
      };
    };
  }
}

export const useProjectStore = defineStore('project', () => {
  const projects = shallowRef<Project[]>([]);
  const currentProject = ref<Project | null>(null);
  const stageProgress = shallowRef<StageProgress[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadProjects(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const res = await window.electronAPI.projects.getAll();
      if (res.success && res.data) {
        projects.value = markRaw(res.data);
      } else {
        error.value = res.message || '加载项目列表失败';
      }
    } catch (e: unknown) {
      error.value = `加载项目列表失败：${(e as Error).message}`;
    } finally {
      loading.value = false;
    }
  }

  async function loadProject(id: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const res = await window.electronAPI.projects.getById(id);
      if (res.success && res.data) {
        currentProject.value = res.data;
      } else {
        error.value = res.message || '加载项目失败';
      }
    } catch (e: unknown) {
      error.value = `加载项目失败：${(e as Error).message}`;
    } finally {
      loading.value = false;
    }
  }

  async function createProject(data: { name: string; auditedTarget?: string; auditType?: string }): Promise<number | null> {
    loading.value = true;
    error.value = null;
    try {
      const res = await window.electronAPI.projects.create(data);
      if (res.success && res.data) {
        await loadProjects();
        return res.data.id;
      }
      error.value = res.message || '创建项目失败';
      return null;
    } catch (e: unknown) {
      error.value = `创建项目失败：${(e as Error).message}`;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function deleteProject(id: number): Promise<boolean> {
    try {
      const res = await window.electronAPI.projects.delete(id);
      if (res.success) {
        await loadProjects();
        return true;
      }
      error.value = res.message || '删除项目失败';
      return false;
    } catch (e: unknown) {
      error.value = `删除项目失败：${(e as Error).message}`;
      return false;
    }
  }

  async function loadStages(projectId: number): Promise<void> {
    try {
      const res = await window.electronAPI.stages.getByProjectId(projectId);
      if (res.success && res.data) {
        stageProgress.value = markRaw(res.data);
      }
    } catch (e: unknown) {
      error.value = `加载阶段数据失败：${(e as Error).message}`;
    }
  }

  async function saveStageData(projectId: number, stage: string, data: Record<string, unknown>, status?: string): Promise<boolean> {
    try {
      const res = await window.electronAPI.stages.updateData(
        projectId,
        stage,
        JSON.stringify(data),
        status
      );
      if (res.success) {
        await loadStages(projectId);
        return true;
      }
      error.value = res.message || '保存阶段数据失败';
      return false;
    } catch (e: unknown) {
      error.value = `保存阶段数据失败：${(e as Error).message}`;
      return false;
    }
  }

  function getStageStatus(stage: string): string {
    return stageProgress.value.find((s) => s.stage === stage)?.status || 'not_started';
  }

  return {
    projects,
    currentProject,
    stageProgress,
    loading,
    error,
    loadProjects,
    loadProject,
    createProject,
    deleteProject,
    loadStages,
    saveStageData,
    getStageStatus,
  };
});
