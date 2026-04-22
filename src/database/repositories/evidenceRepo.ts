import { Database } from 'sqlite';
import { EvidenceItem } from '@shared/types';

export class EvidenceRepo {
  constructor(private db: Database) {}

  async getByProjectId(projectId: number): Promise<EvidenceItem[]> {
    return this.db.all<EvidenceItem[]>(
      'SELECT * FROM evidence_items WHERE project_id = ? ORDER BY created_at DESC',
      projectId
    );
  }

  async getById(id: number): Promise<EvidenceItem | undefined> {
    return this.db.get<EvidenceItem>('SELECT * FROM evidence_items WHERE id = ?', id);
  }

  async create(data: {
    projectId: number;
    serialNumber?: string;
    projectName?: string;
    auditedUnit?: string;
    matterSummary?: string;
    evidenceContent?: string;
    legalBasis?: string;
    auditorName?: string;
    compileDate?: string;
    providerOpinion?: string;
    providerSignature?: string;
    feedbackDeadline?: string;
    attachmentPaths?: string;
  }): Promise<number> {
    const result = await this.db.run(
      `INSERT INTO evidence_items (project_id, serial_number, project_name, audited_unit, matter_summary, evidence_content, legal_basis, auditor_name, compile_date, provider_opinion, provider_signature, feedback_deadline, attachment_paths)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.projectId,
      data.serialNumber || '',
      data.projectName || '',
      data.auditedUnit || '',
      data.matterSummary || '',
      data.evidenceContent || '',
      data.legalBasis || '',
      data.auditorName || '',
      data.compileDate || '',
      data.providerOpinion || '',
      data.providerSignature || '',
      data.feedbackDeadline || '',
      data.attachmentPaths || '[]'
    );
    return result.lastID!;
  }

  async update(id: number, data: Partial<EvidenceItem>): Promise<void> {
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
    await this.db.run(`UPDATE evidence_items SET ${fields.join(', ')} WHERE id = ?`, ...values);
  }

  async delete(id: number): Promise<void> {
    await this.db.run('DELETE FROM evidence_items WHERE id = ?', id);
  }
}
