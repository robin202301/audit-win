import { contextBridge, ipcRenderer } from 'electron';
import { IPCResponse } from '@shared/types';

const api = {
  // 项目管理
  projects: {
    getAll: (): Promise<IPCResponse> => ipcRenderer.invoke('projects:get-all'),
    getById: (id: number): Promise<IPCResponse> => ipcRenderer.invoke('projects:get-by-id', id),
    create: (data: { name: string; auditedTarget?: string; auditType?: string }): Promise<IPCResponse> =>
      ipcRenderer.invoke('projects:create', data),
    update: (id: number, data: Record<string, unknown>): Promise<IPCResponse> =>
      ipcRenderer.invoke('projects:update', id, data),
    delete: (id: number): Promise<IPCResponse> => ipcRenderer.invoke('projects:delete', id),
  },
  // 阶段管理
  stages: {
    getByProjectId: (projectId: number): Promise<IPCResponse> =>
      ipcRenderer.invoke('stages:get-by-project-id', projectId),
    updateData: (projectId: number, stage: string, dataJson: string, status?: string): Promise<IPCResponse> =>
      ipcRenderer.invoke('stages:update-data', projectId, stage, dataJson, status),
  },
  // 取证单
  evidence: {
    getByProjectId: (projectId: number): Promise<IPCResponse> =>
      ipcRenderer.invoke('evidence:get-by-project-id', projectId),
    getById: (id: number): Promise<IPCResponse> => ipcRenderer.invoke('evidence:get-by-id', id),
    create: (data: Record<string, unknown>): Promise<IPCResponse> =>
      ipcRenderer.invoke('evidence:create', data),
    update: (id: number, data: Record<string, unknown>): Promise<IPCResponse> =>
      ipcRenderer.invoke('evidence:update', id, data),
    delete: (id: number): Promise<IPCResponse> => ipcRenderer.invoke('evidence:delete', id),
  },
  // 底稿
  workingPapers: {
    getByProjectId: (projectId: number): Promise<IPCResponse> =>
      ipcRenderer.invoke('working-papers:get-by-project-id', projectId),
    getById: (id: number): Promise<IPCResponse> => ipcRenderer.invoke('working-papers:get-by-id', id),
    create: (data: Record<string, unknown>): Promise<IPCResponse> =>
      ipcRenderer.invoke('working-papers:create', data),
    update: (id: number, data: Record<string, unknown>): Promise<IPCResponse> =>
      ipcRenderer.invoke('working-papers:update', id, data),
    delete: (id: number): Promise<IPCResponse> => ipcRenderer.invoke('working-papers:delete', id),
  },
  // 调查记录
  survey: {
    getByProjectId: (projectId: number): Promise<IPCResponse> =>
      ipcRenderer.invoke('survey:get-by-project-id', projectId),
    upsert: (projectId: number, data: Record<string, unknown>): Promise<IPCResponse> =>
      ipcRenderer.invoke('survey:upsert', projectId, data),
  },
  // 文件
  files: {
    upload: (data: Record<string, unknown>): Promise<IPCResponse> =>
      ipcRenderer.invoke('files:upload', data),
    getByEntity: (entityType: string, entityId: number): Promise<IPCResponse> =>
      ipcRenderer.invoke('files:get-by-entity', entityType, entityId),
    delete: (id: number): Promise<IPCResponse> => ipcRenderer.invoke('files:delete', id),
  },
  // 取证单与底稿关联
  evidencePaperLinks: {
    getByProjectId: (projectId: number): Promise<IPCResponse> =>
      ipcRenderer.invoke('evidence-paper-links:get-by-project-id', projectId),
    getByEvidence: (evidenceId: number): Promise<IPCResponse> =>
      ipcRenderer.invoke('evidence-paper-links:get-by-evidence', evidenceId),
    getByPaper: (workingPaperId: number): Promise<IPCResponse> =>
      ipcRenderer.invoke('evidence-paper-links:get-by-paper', workingPaperId),
    create: (data: { projectId: number; evidenceId: number; workingPaperId: number }): Promise<IPCResponse> =>
      ipcRenderer.invoke('evidence-paper-links:create', data),
  },
  // 文档生成
  documents: {
    generate: (templateName: string, data: Record<string, unknown>, outputPath: string): Promise<IPCResponse> =>
      ipcRenderer.invoke('documents:generate', templateName, data, outputPath),
    openSaveDialog: (defaultName: string): Promise<IPCResponse> =>
      ipcRenderer.invoke('documents:open-save-dialog', defaultName),
    generateExcel: (templateName: string, data: Record<string, unknown>, outputPath: string): Promise<IPCResponse> =>
      ipcRenderer.invoke('documents:generate-excel', templateName, data, outputPath),
    parseWord: (arrayBuffer: ArrayBuffer): Promise<IPCResponse> =>
      ipcRenderer.invoke('documents:parse-word', arrayBuffer),
  },
  // 模板读取
  templates: {
    readTemplateText: (templateName: string): Promise<IPCResponse> =>
      ipcRenderer.invoke('templates:read-text', templateName),
    validate: (templateName: string, data: Record<string, unknown>): Promise<IPCResponse> =>
      ipcRenderer.invoke('templates:validate', templateName, data),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
