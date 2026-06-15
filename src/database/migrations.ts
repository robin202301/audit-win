import { Database } from 'sqlite';

export async function runMigrations(db: Database): Promise<void> {
  // 项目表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      audited_target TEXT NOT NULL DEFAULT '',
      audit_type TEXT NOT NULL DEFAULT '经济责任审计',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 兼容旧数据库：如果存在 audited_unit 列则重命名为 audited_target
  try {
    await db.exec(`ALTER TABLE projects RENAME COLUMN audited_unit TO audited_target`);
  } catch {
    // 列不存在或已重命名，忽略
  }

  // 阶段进度表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS stage_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      stage TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not_started',
      data_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, stage)
    );
  `);

  // 兼容旧数据库：stage_key → stage，补充缺失列
  try {
    await db.exec(`ALTER TABLE stage_progress RENAME COLUMN stage_key TO stage`);
  } catch {
    // 列不存在或已重命名，忽略
  }
  try {
    await db.exec(`ALTER TABLE stage_progress ADD COLUMN data_json TEXT NOT NULL DEFAULT '{}'`);
  } catch {
    // 列已存在，忽略
  }
  try {
    await db.exec(`ALTER TABLE stage_progress ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))`);
  } catch {
    // 列已存在，忽略
  }

  // 取证单表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS evidence_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      serial_number TEXT NOT NULL DEFAULT '',
      project_name TEXT NOT NULL DEFAULT '',
      audited_unit TEXT NOT NULL DEFAULT '',
      matter_summary TEXT NOT NULL DEFAULT '',
      evidence_content TEXT NOT NULL DEFAULT '',
      legal_basis TEXT NOT NULL DEFAULT '',
      auditor_name TEXT NOT NULL DEFAULT '',
      compile_date TEXT NOT NULL DEFAULT '',
      provider_opinion TEXT NOT NULL DEFAULT '',
      provider_signature TEXT NOT NULL DEFAULT '',
      feedback_deadline TEXT NOT NULL DEFAULT '',
      attachment_paths TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // 底稿表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS working_papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      index_number TEXT NOT NULL DEFAULT '',
      project_name TEXT NOT NULL DEFAULT '',
      audit_matter TEXT NOT NULL DEFAULT '',
      auditor_name TEXT NOT NULL DEFAULT '',
      compile_date TEXT NOT NULL DEFAULT '',
      audit_process TEXT NOT NULL DEFAULT '',
      fact_summary TEXT NOT NULL DEFAULT '',
      audit_conclusion TEXT NOT NULL DEFAULT '',
      reviewer_opinion TEXT NOT NULL DEFAULT '',
      reviewer_name TEXT NOT NULL DEFAULT '',
      review_date TEXT NOT NULL DEFAULT '',
      attachment_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // 调查记录表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS survey_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      unit_name TEXT NOT NULL DEFAULT '',
      unit_nature TEXT NOT NULL DEFAULT '',
      legal_representative TEXT NOT NULL DEFAULT '',
      supervising_unit TEXT NOT NULL DEFAULT '',
      staff_quota INTEGER NOT NULL DEFAULT 0,
      current_staff_count INTEGER NOT NULL DEFAULT 0,
      org_structure TEXT NOT NULL DEFAULT '',
      responsibility_scope TEXT NOT NULL DEFAULT '',
      law_execution TEXT NOT NULL DEFAULT '',
      financial_system TEXT NOT NULL DEFAULT '',
      performance_indicators TEXT NOT NULL DEFAULT '',
      internal_control TEXT NOT NULL DEFAULT '',
      info_systems TEXT NOT NULL DEFAULT '',
      economic_environment TEXT NOT NULL DEFAULT '',
      previous_audit TEXT NOT NULL DEFAULT '',
      other_info TEXT NOT NULL DEFAULT '',
      filler_name TEXT NOT NULL DEFAULT '',
      fill_date TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // 文件附件表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS file_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // 取证单与底稿关联表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS evidence_working_paper_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      evidence_id INTEGER NOT NULL UNIQUE,
      working_paper_id INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (evidence_id) REFERENCES evidence_items(id) ON DELETE CASCADE,
      FOREIGN KEY (working_paper_id) REFERENCES working_papers(id) ON DELETE CASCADE
    );
  `);

  // 初始化项目阶段记录（26个步骤）
  await db.exec(`
    CREATE TRIGGER IF NOT EXISTS init_stage_progress
    AFTER INSERT ON projects
    BEGIN
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'notice', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'eight_prohibitions', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'delivery_receipt', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'audit_announcement', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'commitment_letter', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'survey', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'survey_assessment', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'survey_measures', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'plan', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'task_list', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'interview_record', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'evidence', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'working_paper', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'working_paper_summary', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'task_list_completion', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'report', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'report_consultation', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'audit_opinion', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'review_opinion', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'adjudication_opinion', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'adjudication_meeting', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'draft_cover', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'external_report', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'result_report', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'issues_not_reflected', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'audit_decision', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'issue_ledger', 'not_started');
      INSERT OR IGNORE INTO stage_progress (project_id, stage, status) VALUES (NEW.id, 'archive_catalog', 'not_started');
    END;
  `);

  // 迁移：解除取证单与底稿的 1:1 约束，改为 1:N
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS evidence_working_paper_links_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        evidence_id INTEGER NOT NULL,
        working_paper_id INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (evidence_id) REFERENCES evidence_items(id) ON DELETE CASCADE,
        FOREIGN KEY (working_paper_id) REFERENCES working_papers(id) ON DELETE CASCADE
      );
    `);
    await db.exec(`INSERT OR IGNORE INTO evidence_working_paper_links_new SELECT * FROM evidence_working_paper_links`);
    await db.exec(`DROP TABLE IF EXISTS evidence_working_paper_links`);
    await db.exec(`ALTER TABLE evidence_working_paper_links_new RENAME TO evidence_working_paper_links`);
  } catch {
    // 已迁移或表不存在，忽略
  }

  // 自动更新 updated_at
  await db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_project_timestamp
    AFTER UPDATE ON projects
    BEGIN
      UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);
}
