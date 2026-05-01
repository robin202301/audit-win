import { ipcMain, dialog } from 'electron';
import { FileRepo } from '@database/repositories/fileRepo';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export function setupFileHandlers(fileRepo: FileRepo): void {
  ipcMain.handle('files:upload', async (_event, data: {
    projectId: number;
    entityType: string;
    entityId: number;
    fileName: string;
    fileData: string; // base64
  }) => {
    try {
      const uploadDir = path.join(app.getPath('userData'), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const timestamp = Date.now();
      const ext = path.extname(data.fileName);
      const baseName = path.basename(data.fileName, ext);
      const safeFileName = `${baseName}_${timestamp}${ext}`;
      const filePath = path.join(uploadDir, safeFileName);

      const buffer = Buffer.from(data.fileData, 'base64');
      fs.writeFileSync(filePath, buffer);

      const fileType = ext.replace('.', '').toLowerCase();
      const id = await fileRepo.create({
        projectId: data.projectId,
        entityType: data.entityType,
        entityId: data.entityId,
        filePath,
        fileName: data.fileName,
        fileType,
        fileSize: buffer.length,
      });

      return { success: true, data: { id, filePath, fileName: data.fileName } };
    } catch (error: unknown) {
      return { success: false, message: `文件上传失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('files:get-by-entity', async (_event, entityType: string, entityId: number) => {
    try {
      const files = await fileRepo.getByEntity(entityType, entityId);
      return { success: true, data: files };
    } catch (error: unknown) {
      return { success: false, message: `获取附件列表失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('files:delete', async (_event, id: number) => {
    try {
      const file = await fileRepo.getById(id);
      if (file && fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }
      await fileRepo.delete(id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, message: `删除附件失败：${(error as Error).message}` };
    }
  });
}
