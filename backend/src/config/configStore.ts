import { EventEmitter } from "node:events";
import { db } from "../db.js";
import {
  ALERT_KINDS, AlertConfigSchema, SettingsSchema,
  DEFAULT_ALERTS, DEFAULT_SETTINGS,
  type AlertKind, type AlertConfig, type Settings,
} from "./schema.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS alert_config (kind TEXT PRIMARY KEY, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL);
`)

class ConfigStore extends EventEmitter {
  private alerts = new Map<AlertKind, AlertConfig>();
  private settings: Settings = DEFAULT_SETTINGS;

  init(): void {
    const seedAlert = db.prepare(`INSERT OR IGNORE INTO alert_config (kind, data) VALUES (?, ?)`);
    const readAlert = db.prepare(`SELECT data FROM alert_config WHERE kind = ?`);
    for (const kind of ALERT_KINDS) {
      seedAlert.run(kind, JSON.stringify(DEFAULT_ALERTS[kind]));
      const row = readAlert.get(kind) as { data: string };
      this.alerts.set(kind, AlertConfigSchema.parse(JSON.parse(row.data)));
    }
    db.prepare(`INSERT OR IGNORE INTO settings (id, data) VALUES (1, ?)`).run(JSON.stringify(DEFAULT_SETTINGS));
    const s = db.prepare(`SELECT data FROM settings WHERE id = 1`).get() as { data: string };
    this.settings = SettingsSchema.parse(JSON.parse(s.data));
  }


  getAll() { return { alerts: Object.fromEntries(this.alerts), settings: this.settings }; }
  getAlert(kind: AlertKind) { return this.alerts.get(kind); }
  getSettings() { return this.settings; }

  updateAlert(kind: AlertKind, patch: unknown): AlertConfig {
    const current = this.alerts.get(kind);
    if (!current) throw new Error(`unknown alert kind: ${kind}`);
    const next = AlertConfigSchema.parse({ ...current, ...(patch as object) });
    db.prepare(`UPDATE alert_config SET data = ? WHERE kind = ?`).run(JSON.stringify(next), kind);
    this.alerts.set(kind, next);
    this.emit("changed");
    return next;
  }

  updateSettings(patch: unknown): Settings {
    const next = SettingsSchema.parse({ ...this.settings, ...(patch as object) });
    db.prepare(`UPDATE settings SET data = ? WHERE id = 1`).run(JSON.stringify(next));
    this.settings = next;
    this.emit("changed");
    return next;
  }
}


export const configStore = new ConfigStore();
