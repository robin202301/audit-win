import { ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
// @ts-ignore - mammoth 类型声明待安装
import mammoth from 'mammoth';
import { generateDocument, generateExcel } from '../services/templateService';

export function setupDocumentHandlers(): void {
  ipcMain.handle('documents:generate', async (_event, templateName: string, data: Record<string, unknown>, outputPath: string) => {
    try {
      await generateDocument(templateName, data, outputPath);
      return { success: true, data: { outputPath } };
    } catch (error: unknown) {
      return { success: false, message: `生成文档失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('documents:generate-excel', async (_event, templateName: string, data: Record<string, unknown>, outputPath: string) => {
    try {
      await generateExcel(templateName, data, outputPath);
      return { success: true, data: { outputPath } };
    } catch (error: unknown) {
      return { success: false, message: `生成表格失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('documents:open-save-dialog', async (_event, defaultName: string) => {
    try {
      const result = await dialog.showSaveDialog({
        title: '保存文档',
        defaultPath: defaultName,
        filters: [
          { name: 'Word 文档', extensions: ['docx', 'doc'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, message: '用户取消保存' };
      }
      return { success: true, data: { filePath: result.filePath } };
    } catch (error: unknown) {
      return { success: false, message: `打开保存对话框失败：${(error as Error).message}` };
    }
  });

  ipcMain.handle('documents:parse-word', async (_event, arrayBuffer: ArrayBuffer) => {
    try {
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;

      // 尝试从文本中提取通知书关键字段
      const parsedData: Record<string, string> = {};

      // 提取文号（匹配 审（委）办经责通〔20**〕**号 格式）
      const docNumberMatch = text.match(/[^\s]*审[^\s]*通[^\s]*号/);
      if (docNumberMatch) parsedData.documentNumber = docNumberMatch[0];

      // 提取审计机关（通常是标题行的内容）
      const orgMatch = text.match(/([^\s]+审计[^\s]+(?:办公室|局))/);
      if (orgMatch) parsedData.auditOrg = orgMatch[1];

      // 提取日期
      const dateMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      if (dateMatch) parsedData.issueDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;

      // 提取印发机关
      const issuingMatch = text.match(/([^\s]+(?:委员会办公室|审计局))\s*印发/);
      if (issuingMatch) parsedData.issuingOrg = issuingMatch[1];

      // 提取被审计人
      const personMatch = text.match(/对\s+([^\s]+)\s+同志/);
      if (personMatch) parsedData.auditedLeaderName = personMatch[1];

      parsedData.auditOrg = parsedData.auditOrg || '';
      parsedData.documentNumber = parsedData.documentNumber || '';
      parsedData.auditedLeaderName = parsedData.auditedLeaderName || '';
      parsedData.auditedLeaderUnit = parsedData.auditedLeaderUnit || '';
      parsedData.auditedLeaderPosition = parsedData.auditedLeaderPosition || '';
      parsedData.auditStartDate = parsedData.auditStartDate || '';
      parsedData.auditEndDate = parsedData.auditEndDate || '';
      parsedData.teamLeader = parsedData.teamLeader || '';
      parsedData.teamDeputyLeader = parsedData.teamDeputyLeader || '';
      parsedData.teamMembers = parsedData.teamMembers || '';
      parsedData.ccUnit = parsedData.ccUnit || '';
      parsedData.issuingOrg = parsedData.issuingOrg || '';
      parsedData.issueDate = parsedData.issueDate || '';

      return { success: true, data: parsedData };
    } catch (error: unknown) {
      return { success: false, message: `解析Word文档失败：${(error as Error).message}` };
    }
  });
}
