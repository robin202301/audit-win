import { Database } from 'sqlite';

export interface Setting {
  key: string;
  value: string;
  label: string;
  updatedAt: string;
}

export class SettingsRepo {
  constructor(private db: Database) {}

  async getAll(): Promise<Setting[]> {
    return this.db.all<Setting[]>('SELECT * FROM settings');
  }

  async get(key: string): Promise<Setting | undefined> {
    return this.db.get<Setting>('SELECT * FROM settings WHERE key = ?', key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.db.run(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')",
      key, value, value
    );
  }
}
