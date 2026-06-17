import { Database } from 'sqlite';
import { SurveyRecord } from '@shared/types';

export class SurveyRepo {
  constructor(private db: Database) {}

  async getByProjectId(projectId: number): Promise<SurveyRecord | undefined> {
    return this.db.get<SurveyRecord>(
      'SELECT * FROM survey_records WHERE project_id = ?',
      projectId
    );
  }

  async upsert(projectId: number, data: Partial<SurveyRecord>): Promise<number> {
    // 使用原子 UPSERT，避免 select-then-insert 竞态条件
    // 先尝试插入（让数据库处理冲突），再更新字段
    const insertResult = await this.db.run(
      `INSERT INTO survey_records (project_id) VALUES (?)
       ON CONFLICT(project_id) DO NOTHING`,
      projectId
    );

    // 获取记录 ID（新插入的用 lastID，已存在的从数据库查）
    let recordId: number;
    if (insertResult.lastID && insertResult.lastID > 0) {
      recordId = insertResult.lastID;
    } else {
      const existing = await this.getByProjectId(projectId);
      if (!existing) throw new Error('调查记录创建失败');
      recordId = existing.id;
    }

    // 更新字段（仅传入的非空字段）
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt' || key === 'projectId') continue;
      if (value === undefined) continue;
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${col} = ?`);
      values.push(value);
    }
    if (fields.length > 0) {
      fields.push(`updated_at = datetime('now')`);
      values.push(recordId);
      await this.db.run(`UPDATE survey_records SET ${fields.join(', ')} WHERE id = ?`, ...values);
    }
    return recordId;
  }
}
