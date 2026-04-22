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

  async create(data: { projectId: number }): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO survey_records (project_id) VALUES (?)',
      data.projectId
    );
    return result.lastID!;
  }

  async update(id: number, data: Partial<SurveyRecord>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${col} = ?`);
      values.push(value);
    }
    if (fields.length === 0) return;
    values.push(id);
    await this.db.run(`UPDATE survey_records SET ${fields.join(', ')} WHERE id = ?`, ...values);
  }

  async upsert(projectId: number, data: Partial<SurveyRecord>): Promise<number> {
    const existing = await this.getByProjectId(projectId);
    if (existing) {
      await this.update(existing.id, data);
      return existing.id;
    }
    const newId = await this.create({ projectId });
    await this.update(newId, data);
    return newId;
  }
}
