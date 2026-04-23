import { Database } from 'sqlite';
import { Project } from '@shared/types';

export class ProjectRepo {
  constructor(private db: Database) {}

  async getAll(): Promise<Project[]> {
    return this.db.all<Project[]>('SELECT * FROM projects ORDER BY created_at DESC');
  }

  async getById(id: number): Promise<Project | undefined> {
    return this.db.get<Project>('SELECT * FROM projects WHERE id = ?', id);
  }

  async create(data: { name: string; auditedTarget?: string; auditType?: string }): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO projects (name, audited_target, audit_type) VALUES (?, ?, ?)',
      data.name,
      data.auditedTarget || '',
      data.auditType || '经济责任审计'
    );
    return result.lastID!;
  }

  async update(id: number, data: Partial<Project>): Promise<void> {
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
    await this.db.run(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, ...values);
  }

  async delete(id: number): Promise<void> {
    await this.db.run('DELETE FROM projects WHERE id = ?', id);
  }
}
