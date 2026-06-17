import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { app } from 'electron';
import { runMigrations } from './migrations';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) return db;

  const dbPath = path.join(app.getPath('userData'), 'audit.db');
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
