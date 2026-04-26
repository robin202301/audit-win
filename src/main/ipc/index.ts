import { ipcMain } from 'electron';
import { getDatabase } from '@database/connection';
import { ProjectRepo } from '@database/repositories/projectRepo';
import { StageRepo } from '@database/repositories/stageRepo';
import { EvidenceRepo } from '@database/repositories/evidenceRepo';
import { WorkingPaperRepo } from '@database/repositories/workingPaperRepo';
import { SurveyRepo } from '@database/repositories/surveyRepo';
import { FileRepo } from '@database/repositories/fileRepo';
import { setupDocumentHandlers } from './document';
import { setupFileHandlers } from './file';
import { readTemplateText } from '@main/services/templateService';

export async function setupIpcHandlers(): Promise<void> {
  const db = await getDatabase();
  const projectRepo = new ProjectRepo(db);
  const stageRepo = new StageRepo(db);
  const evidenceRepo = new EvidenceRepo(db);
  const workingPaperRepo = new WorkingPaperRepo(db);
  const surveyRepo = new SurveyRepo(db);
  const fileRepo = new FileRepo(db);

  // 项目管理
  ipcMain.handle('projects:get-all', async () => {
    try {
      const projects = await projectRepo.getAll();
      return { success: true, data: projects };
    } catch (error: unknown) {
      return { success: false, message: `获取项目列表失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('projects:get-by-id', async (_e, id: number) => {
    try {
      const project = await projectRepo.getById(id);
      if (!project) return { success: false, message: '项目不存在' };
      return { success: true, data: project };
    } catch (error: unknown) {
      return { success: false, message: `获取项目失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('projects:create', async (_e, data) => {
    try {
      const id = await projectRepo.create(data);
      return { success: true, data: { id } };
    } catch (error: unknown) {
      return { success: false, message: `创建项目失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('projects:update', async (_e, id: number, data) => {
    try {
      await projectRepo.update(id, data);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, message: `更新项目失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('projects:delete', async (_e, id: number) => {
    try {
      await projectRepo.delete(id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, message: `删除项目失败：${(error as Error).message}` };
    }
  });

  // 阶段管理
  ipcMain.handle('stages:get-by-project-id', async (_e, projectId: number) => {
    try {
      const stages = await stageRepo.getByProjectId(projectId);
      return { success: true, data: stages };
    } catch (error: unknown) {
      return { success: false, message: `获取阶段数据失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('stages:update-data', async (_e, projectId: number, stage: string, dataJson: string, status?: string) => {
    try {
      await stageRepo.updateData(projectId, stage, dataJson, status);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, message: `保存阶段数据失败：${(error as Error).message}` };
    }
  });

  // 取证单
  ipcMain.handle('evidence:get-by-project-id', async (_e, projectId: number) => {
    try {
      const items = await evidenceRepo.getByProjectId(projectId);
      return { success: true, data: items };
    } catch (error: unknown) {
      return { success: false, message: `获取取证单列表失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('evidence:get-by-id', async (_e, id: number) => {
    try {
      const item = await evidenceRepo.getById(id);
      if (!item) return { success: false, message: '取证单不存在' };
      return { success: true, data: item };
    } catch (error: unknown) {
      return { success: false, message: `获取取证单失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('evidence:create', async (_e, data) => {
    try {
      const id = await evidenceRepo.create(data);
      return { success: true, data: { id } };
    } catch (error: unknown) {
      return { success: false, message: `创建取证单失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('evidence:update', async (_e, id: number, data) => {
    try {
      await evidenceRepo.update(id, data);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, message: `更新取证单失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('evidence:delete', async (_e, id: number) => {
    try {
      await evidenceRepo.delete(id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, message: `删除取证单失败：${(error as Error).message}` };
    }
  });

  // 底稿
  ipcMain.handle('working-papers:get-by-project-id', async (_e, projectId: number) => {
    try {
      const papers = await workingPaperRepo.getByProjectId(projectId);
      return { success: true, data: papers };
    } catch (error: unknown) {
      return { success: false, message: `获取底稿列表失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('working-papers:get-by-id', async (_e, id: number) => {
    try {
      const paper = await workingPaperRepo.getById(id);
      if (!paper) return { success: false, message: '底稿不存在' };
      return { success: true, data: paper };
    } catch (error: unknown) {
      return { success: false, message: `获取底稿失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('working-papers:create', async (_e, data) => {
    try {
      const id = await workingPaperRepo.create(data);
      return { success: true, data: { id } };
    } catch (error: unknown) {
      return { success: false, message: `创建底稿失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('working-papers:update', async (_e, id: number, data) => {
    try {
      await workingPaperRepo.update(id, data);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, message: `更新底稿失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('working-papers:delete', async (_e, id: number) => {
    try {
      await workingPaperRepo.delete(id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, message: `删除底稿失败：${(error as Error).message}` };
    }
  });

  // 调查记录
  ipcMain.handle('survey:get-by-project-id', async (_e, projectId: number) => {
    try {
      const record = await surveyRepo.getByProjectId(projectId);
      return { success: true, data: record };
    } catch (error: unknown) {
      return { success: false, message: `获取调查记录失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('survey:upsert', async (_e, projectId: number, data) => {
    try {
      const id = await surveyRepo.upsert(projectId, data);
      return { success: true, data: { id } };
    } catch (error: unknown) {
      return { success: false, message: `保存调查记录失败：${(error as Error).message}` };
    }
  });

  // 文件
  setupFileHandlers(fileRepo);

  // 文档生成
  setupDocumentHandlers();

  // 模板读取
  ipcMain.handle('templates:read-text', async (_e, templateName: string) => {
    try {
      const text = await readTemplateText(templateName);
      return { success: true, data: text };
    } catch (error: unknown) {
      return { success: false, message: `读取模板失败：${(error as Error).message}` };
    }
  });
}
