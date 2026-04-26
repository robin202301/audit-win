import { Database } from 'sqlite';

export interface EvidencePaperLink {
  id: number;
  projectId: number;
  evidenceId: number;
  workingPaperId: number;
}

export class EvidencePaperLinkRepo {
  constructor(private db: Database) {}

  async getByProjectId(projectId: number): Promise<EvidencePaperLink[]> {
    return this.db.all<EvidencePaperLink[]>(
      'SELECT * FROM evidence_working_paper_links WHERE project_id = ? ORDER BY id',
      projectId
    );
  }

  async getPaperByEvidence(evidenceId: number): Promise<EvidencePaperLink | undefined> {
    return this.db.get<EvidencePaperLink>(
      'SELECT * FROM evidence_working_paper_links WHERE evidence_id = ?',
      evidenceId
    );
  }

  async create(data: { projectId: number; evidenceId: number; workingPaperId: number }): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO evidence_working_paper_links (project_id, evidence_id, working_paper_id) VALUES (?, ?, ?)',
      data.projectId,
      data.evidenceId,
      data.workingPaperId
    );
    return result.lastID!;
  }

  async deleteByEvidence(evidenceId: number): Promise<void> {
    await this.db.run('DELETE FROM evidence_working_paper_links WHERE evidence_id = ?', evidenceId);
  }

  async deleteByPaper(workingPaperId: number): Promise<void> {
    await this.db.run('DELETE FROM evidence_working_paper_links WHERE working_paper_id = ?', workingPaperId);
  }
}
