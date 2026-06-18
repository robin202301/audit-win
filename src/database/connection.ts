import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { runMigrations } from './migrations';

let db: Database | null = null;
let cleaned = false;

/**
 * 每次安装/升级时清理旧版本数据库残留。
 * audit2.db 保留（当前版本），仅删除旧版本遗留文件。
 */
function cleanOldData(): void {
  if (cleaned) return;
  const userDataDir = app.getPath('userData');
  // 仅删除已知旧版本残留文件，不删除当前 audit2.db
  const legacyFiles = ['audit.db', 'auditsystem.db', 'audit_persistence.db'];
  for (const f of legacyFiles) {
    const p = path.join(userDataDir, f);
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch { /* ignore */ }
    }
    for (const ext of ['-wal', '-shm', '-journal']) {
      const wp = path.join(userDataDir, f + ext);
      if (fs.existsSync(wp)) {
        try { fs.unlinkSync(wp); } catch { /* ignore */ }
      }
    }
  }
  cleaned = true;
}

export async function getDatabase(): Promise<Database> {
  if (db) return db;

  // 清理旧环境残留
  cleanOldData();

  const dbPath = path.join(app.getPath('userData'), 'audit2.db');
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // 启用外键约束，确保 ON DELETE CASCADE 生效
  await db.exec('PRAGMA foreign_keys = ON');
  await runMigrations(db);
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}
