export {};

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

import type { IPCResponse, Project, StageProgress } from '@shared/types';
