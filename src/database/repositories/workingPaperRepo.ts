import { Database } from 'sqlite';
import { WorkingPaper } from '@shared/types';

export class WorkingPaperRepo {
  constructor(private db: Database) {}

  async getByProjectId(projectId: number): Promise<WorkingPaper[]> {
    return this.db.all<WorkingPaper[]>(
      'SELECT * FROM working_papers WHERE project_id = ? ORDER BY created_at DESC',
      projectId
    );
  }

  async getById(id: number): Promise<WorkingPaper | undefined> {
    return this.db.get<WorkingPaper>('SELECT * FROM working_papers WHERE id = ?', id);
  }

  async create(data: {
    projectId: number;
    indexNumber?: string;
    projectName?: string;
    auditMatter?: string;
    auditorName?: string;
    compileDate?: string;
    auditProcess?: string;
    factSummary?: string;
    auditConclusion?: string;
    reviewerOpinion?: string;
    reviewerName?: string;
    reviewDate?: string;
    attachmentCount?: number;
  }): Promise<number> {
    const result = await this.db.run(
      `INSERT INTO working_papers (project_id, index_number, project_name, audit_matter, auditor_name, compile_date, audit_process, fact_summary, audit_conclusion, reviewer_opinion, reviewer_name, review_date, attachment_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.projectId,
      data.indexNumber || '',
      data.projectName || '',
      data.auditMatter || '',
      data.auditorName || '',
      data.compileDate || '',
      data.auditProcess || '',
      data.factSummary || '',
      data.auditConclusion || '',
      data.reviewerOpinion || '',
      data.reviewerName || '',
      data.reviewDate || '',
      data.attachmentCount || 0
    );
    return result.lastID!;
  }

  async update(id: number, data: Partial<WorkingPaper>): Promise<void> {
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
    await this.db.run(`UPDATE working_papers SET ${fields.join(', ')} WHERE id = ?`, ...values);
  }

  async delete(id: number): Promise<void> {
    await this.db.run('DELETE FROM working_papers WHERE id = ?', id);
  }
}
