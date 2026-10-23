import { Database } from 'sqlite';
import { EvidenceItem } from '@shared/types';

export class EvidenceRepo {
  constructor(private db: Database) {}

  // 显式别名映射为 camelCase：sqlite 返回原始 snake_case 列名，
  // 渲染进程按 camelCase 读取，未映射会导致保存的数据加载后全部丢失
  private static readonly SELECT_COLUMNS = `
    id,
    project_id AS projectId,
    serial_number AS serialNumber,
    project_name AS projectName,
    audited_unit AS auditedUnit,
    matter_summary AS matterSummary,
    summary_text AS summaryText,
    evidence_content AS evidenceContent,
    legal_basis AS legalBasis,
    auditor_name AS auditorName,
    compile_date AS compileDate,
    provider_opinion AS providerOpinion,
    provider_signature AS providerSignature,
    feedback_deadline AS feedbackDeadline,
    attachment_paths AS attachmentPaths,
    created_at AS createdAt,
    updated_at AS updatedAt
  `;

  async getByProjectId(projectId: number): Promise<EvidenceItem[]> {
    return this.db.all<EvidenceItem[]>(
      `SELECT ${EvidenceRepo.SELECT_COLUMNS} FROM evidence_items WHERE project_id = ? ORDER BY created_at DESC`,
      projectId
    );
  }

  async getById(id: number): Promise<EvidenceItem | undefined> {
    return this.db.get<EvidenceItem>(
      `SELECT ${EvidenceRepo.SELECT_COLUMNS} FROM evidence_items WHERE id = ?`,
      id
    );
  }

  async create(data: {
    projectId: number;
    serialNumber?: string;
    projectName?: string;
    auditedUnit?: string;
    matterSummary?: string;
    summaryText?: string;
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
      `INSERT INTO evidence_items (project_id, serial_number, project_name, audited_unit, matter_summary, summary_text, evidence_content, legal_basis, auditor_name, compile_date, provider_opinion, provider_signature, feedback_deadline, attachment_paths)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.projectId,
      data.serialNumber || '',
      data.projectName || '',
      data.auditedUnit || '',
      data.matterSummary || '',
      data.summaryText || '',
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
