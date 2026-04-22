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
    if (status) {
      await this.db.run(
        'UPDATE stage_progress SET data_json = ?, status = ?, updated_at = datetime(\'now\') WHERE project_id = ? AND stage = ?',
        dataJson,
        status,
        projectId,
        stage
      );
    } else {
      await this.db.run(
        'UPDATE stage_progress SET data_json = ?, updated_at = datetime(\'now\') WHERE project_id = ? AND stage = ?',
        dataJson,
        projectId,
        stage
      );
    }
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
