import { Database } from 'sqlite';
import { FileAttachment } from '@shared/types';

export class FileRepo {
  constructor(private db: Database) {}

  async getByEntity(entityType: string, entityId: number): Promise<FileAttachment[]> {
    return this.db.all<FileAttachment[]>(
      'SELECT * FROM file_attachments WHERE entity_type = ? AND entity_id = ?',
      entityType,
      entityId
    );
  }

  async create(data: {
    projectId: number;
    entityType: string;
    entityId: number;
    filePath: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO file_attachments (project_id, entity_type, entity_id, file_path, file_name, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?, ?)',
      data.projectId,
      data.entityType,
      data.entityId,
      data.filePath,
      data.fileName,
      data.fileType,
      data.fileSize
    );
    return result.lastID!;
  }

  async getById(id: number): Promise<FileAttachment | undefined> {
    return this.db.get<FileAttachment>(
      'SELECT * FROM file_attachments WHERE id = ?',
      id
    );
  }

  async delete(id: number): Promise<void> {
    await this.db.run('DELETE FROM file_attachments WHERE id = ?', id);
  }
}
