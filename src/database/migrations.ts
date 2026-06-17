import { Database } from 'sqlite';

/** 当前数据库 Schema 版本号。修改任何表结构后必须 +1，下次启动会自动重建。 */
const DB_SCHEMA_VERSION = 1;

export async function runMigrations(db: Database): Promise<void> {
  // 确保版本表存在
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_info (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // 读取当前版本
  const row = await db.get<{ value: string }>(
    'SELECT value FROM schema_info WHERE key = ?',
    'version'
  );
  const currentVersion = row ? parseInt(row.value, 10) : 0;

  if (currentVersion >= DB_SCHEMA_VERSION) {
    return; // Schema 已是最新，跳过
  }

  // ── 完整重建 ──────────────────────────────────────────────
  // 关闭外键约束以允许任意顺序 DROP TABLE
  await db.exec('PRAGMA foreign_keys = OFF');

  // 1. 删除所有旧对象
  await db.exec(`DROP TRIGGER IF EXISTS init_stage_progress`);
  await db.exec(`DROP TRIGGER IF EXISTS update_project_timestamp`);
  await db.exec(`DROP TABLE IF EXISTS evidence_working_paper_links`);
  await db.exec(`DROP TABLE IF EXISTS file_attachments`);
  await db.exec(`DROP TABLE IF EXISTS survey_records`);
  await db.exec(`DROP TABLE IF EXISTS working_papers`);
  await db.exec(`DROP TABLE IF EXISTS evidence_items`);
  await db.exec(`DROP TABLE IF EXISTS stage_progress`);
  await db.exec(`DROP TABLE IF EXISTS projects`);

  // 2. 创建所有表（纯 DDL，无 IF NOT EXISTS）
  await createAllTables(db);

  // 3. 记录版本号
  await db.run(
    'INSERT OR REPLACE INTO schema_info (key, value) VALUES (?, ?)',
    'version',
    String(DB_SCHEMA_VERSION)
  );

  // 4. 重新开启外键
  await db.exec('PRAGMA foreign_keys = ON');
}

// ── 所有建表语句集中管理 ─────────────────────────────────────
async function createAllTables(db: Database): Promise<void> {
  // 项目表
  await db.exec(`
    CREATE TABLE projects (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      name           TEXT    NOT NULL,
      audited_target TEXT    NOT NULL DEFAULT '',
      audit_type     TEXT    NOT NULL DEFAULT '经济责任审计',
      status         TEXT    NOT NULL DEFAULT 'active',
      created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 阶段进度表
  await db.exec(`
    CREATE TABLE stage_progress (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      stage      TEXT    NOT NULL,
      status     TEXT    NOT NULL DEFAULT 'not_started',
      data_json  TEXT    NOT NULL DEFAULT '{}',
      updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, stage)
    );
  `);

  // 取证单表
  await db.exec(`
    CREATE TABLE evidence_items (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id        INTEGER NOT NULL,
      serial_number     TEXT    NOT NULL DEFAULT '',
      project_name      TEXT    NOT NULL DEFAULT '',
      audited_unit      TEXT    NOT NULL DEFAULT '',
      matter_summary    TEXT    NOT NULL DEFAULT '',
      evidence_content  TEXT    NOT NULL DEFAULT '',
      legal_basis       TEXT    NOT NULL DEFAULT '',
      auditor_name      TEXT    NOT NULL DEFAULT '',
      compile_date      TEXT    NOT NULL DEFAULT '',
      provider_opinion  TEXT    NOT NULL DEFAULT '',
      provider_signature TEXT   NOT NULL DEFAULT '',
      feedback_deadline TEXT    NOT NULL DEFAULT '',
      attachment_paths  TEXT    NOT NULL DEFAULT '[]',
      created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // 底稿表
  await db.exec(`
    CREATE TABLE working_papers (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id       INTEGER NOT NULL,
      index_number     TEXT    NOT NULL DEFAULT '',
      project_name     TEXT    NOT NULL DEFAULT '',
      audit_matter     TEXT    NOT NULL DEFAULT '',
      auditor_name     TEXT    NOT NULL DEFAULT '',
      compile_date     TEXT    NOT NULL DEFAULT '',
      audit_process    TEXT    NOT NULL DEFAULT '',
      fact_summary     TEXT    NOT NULL DEFAULT '',
      audit_conclusion TEXT    NOT NULL DEFAULT '',
      reviewer_opinion TEXT    NOT NULL DEFAULT '',
      reviewer_name    TEXT    NOT NULL DEFAULT '',
      review_date      TEXT    NOT NULL DEFAULT '',
      attachment_count INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // 调查记录表
  await db.exec(`
    CREATE TABLE survey_records (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id             INTEGER NOT NULL UNIQUE,
      unit_name              TEXT    NOT NULL DEFAULT '',
      unit_nature            TEXT    NOT NULL DEFAULT '',
      legal_representative   TEXT    NOT NULL DEFAULT '',
      supervising_unit       TEXT    NOT NULL DEFAULT '',
      staff_quota            INTEGER NOT NULL DEFAULT 0,
      current_staff_count    INTEGER NOT NULL DEFAULT 0,
      org_structure          TEXT    NOT NULL DEFAULT '',
      responsibility_scope   TEXT    NOT NULL DEFAULT '',
      law_execution          TEXT    NOT NULL DEFAULT '',
      financial_system       TEXT    NOT NULL DEFAULT '',
      performance_indicators TEXT    NOT NULL DEFAULT '',
      internal_control       TEXT    NOT NULL DEFAULT '',
      info_systems           TEXT    NOT NULL DEFAULT '',
      economic_environment   TEXT    NOT NULL DEFAULT '',
      previous_audit         TEXT    NOT NULL DEFAULT '',
      other_info             TEXT    NOT NULL DEFAULT '',
      filler_name            TEXT    NOT NULL DEFAULT '',
      fill_date              TEXT    NOT NULL DEFAULT '',
      created_at             TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at             TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // 文件附件表
  await db.exec(`
    CREATE TABLE file_attachments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id  INTEGER NOT NULL,
      entity_type TEXT    NOT NULL,
      entity_id   INTEGER NOT NULL,
      file_path   TEXT    NOT NULL,
      file_name   TEXT    NOT NULL,
      file_type   TEXT    NOT NULL,
      file_size   INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // 取证单与底稿关联表（1:N，无 UNIQUE 约束）
  await db.exec(`
    CREATE TABLE evidence_working_paper_links (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id       INTEGER NOT NULL,
      evidence_id      INTEGER NOT NULL,
      working_paper_id INTEGER NOT NULL,
      FOREIGN KEY (project_id)       REFERENCES projects(id)       ON DELETE CASCADE,
      FOREIGN KEY (evidence_id)      REFERENCES evidence_items(id) ON DELETE CASCADE,
      FOREIGN KEY (working_paper_id) REFERENCES working_papers(id) ON DELETE CASCADE
    );
  `);

  // 触发器：新建项目时自动创建 28 个阶段记录
  await db.exec(`
    CREATE TRIGGER init_stage_progress
    AFTER INSERT ON projects
    BEGIN
      ${STAGE_NAMES.map((s) => `INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, '${s}', 'not_started');`).join('\n      ')}
    END;
  `);

  // 触发器：自动更新项目时间戳
  await db.exec(`
    CREATE TRIGGER update_project_timestamp
    AFTER UPDATE ON projects
    BEGIN
      UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);
}

// ── 审计阶段清单（28 步）─────────────────────────────────────
const STAGE_NAMES = [
  'notice',
  'eight_prohibitions',
  'delivery_receipt',
  'audit_announcement',
  'commitment_letter',
  'survey',
  'survey_assessment',
  'survey_measures',
  'plan',
  'task_list',
  'interview_record',
  'evidence',
  'working_paper',
  'working_paper_summary',
  'task_list_completion',
  'report',
  'report_consultation',
  'audit_opinion',
  'review_opinion',
  'adjudication_opinion',
  'adjudication_meeting',
  'draft_cover',
  'external_report',
  'result_report',
  'issues_not_reflected',
  'audit_decision',
  'issue_ledger',
  'archive_catalog',
];
