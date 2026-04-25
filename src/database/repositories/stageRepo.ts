import { Database } from 'sqlite';
import { StageProgress, AuditStage } from '@shared/types';

export class StageRepo {
  constructor(private db: Database) {}

  async getByProjectId(projectId: number): Promise<StageProgress[]> {
    return this.db.all<StageProgress[]>(
      'SELECT * FROM stage_progress WHERE project_id = ? ORDER BY id',
      projectId
    );
  }

  async getByProjectAndStage(projectId: number, stage: AuditStage): Promise<StageProgress | undefined> {
    return this.db.get<StageProgress>(
      'SELECT * FROM stage_progress WHERE project_id = ? AND stage = ?',
      projectId,
      stage
    );
  }

  async updateData(projectId: number, stage: AuditStage | string, dataJson: string, status?: string): Promise<void> {
    const finalStatus = status || 'in_progress';
    await this.db.run(
      `INSERT INTO stage_progress (project_id, stage, data_json, status, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(project_id, stage)
       DO UPDATE SET data_json = excluded.data_json, status = excluded.status, updated_at = datetime('now')`,
      projectId,
      stage,
      dataJson,
      finalStatus
    );
  }

  async getStatus(projectId: number, stage: AuditStage): Promise<string | undefined> {
    const row = await this.db.get<{ status: string }>(
      'SELECT status FROM stage_progress WHERE project_id = ? AND stage = ?',
      projectId,
      stage
    );
    return row?.status;
  }
}
