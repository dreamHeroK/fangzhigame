/**
 * SQLite (sql.js) 核心层
 * - 数据库文件以 Uint8Array 形式存在 IndexedDB 中
 * - 所有 SQL 操作同步执行，仅 init / persist 是异步
 */
const WASM_URL  = '/sql-wasm.wasm'
const IDB_NAME  = 'wendao_sqlite'
const IDB_STORE = 'dbfile'
const IDB_KEY   = 'main'

let sqlJs = null
let db    = null

// ── IndexedDB helpers ───────────────────────────────────────────────────────

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(IDB_STORE)
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror   = ()  => reject(new Error('IDB open failed'))
  })
}

async function idbLoad() {
  try {
    const idb = await idbOpen()
    return await new Promise((resolve) => {
      const tx  = idb.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror   = () => resolve(null)
    })
  } catch { return null }
}

async function idbSave(data) {
  try {
    const idb = await idbOpen()
    await new Promise((resolve, reject) => {
      const tx  = idb.transaction(IDB_STORE, 'readwrite')
      const req = tx.objectStore(IDB_STORE).put(data, IDB_KEY)
      req.onsuccess = resolve
      req.onerror   = reject
    })
  } catch { /* non-fatal */ }
}

// ── Schema ──────────────────────────────────────────────────────────────────

const SCHEMA = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS saves (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  char_name   TEXT    NOT NULL DEFAULT '',
  char_level  INTEGER NOT NULL DEFAULT 1,
  char_school TEXT    NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  is_current  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS character_snapshots (
  save_id   INTEGER PRIMARY KEY,
  data_json TEXT    NOT NULL,
  FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS battle_history (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  save_id         INTEGER NOT NULL,
  fought_at       INTEGER NOT NULL,
  outcome         TEXT    NOT NULL,
  map_name        TEXT    DEFAULT '',
  foe_count       INTEGER DEFAULT 0,
  rounds          INTEGER DEFAULT 0,
  exp_gained      INTEGER DEFAULT 0,
  pet_exp_gained  INTEGER DEFAULT 0,
  gold_gained     INTEGER DEFAULT 0,
  loot_json       TEXT    DEFAULT '[]',
  FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skill_memory (
  template_key  TEXT    PRIMARY KEY,
  skill_id      TEXT    NOT NULL,
  updated_at    INTEGER NOT NULL
);
`

// ── Public API ───────────────────────────────────────────────────────────────

/** Promise that resolves once the DB is ready */
export const dbReady = (async () => {
  const m = await import('sql.js')
  const initSqlJs = m.default ?? m
  sqlJs = await initSqlJs({ locateFile: () => WASM_URL })
  const saved = await idbLoad()
  db = saved ? new sqlJs.Database(saved) : new sqlJs.Database()
  db.run(SCHEMA)
  if (!saved) await persistDb() // write initial empty DB
})()

/** Raw sql.js Database instance (throws if not ready) */
export function getDb() {
  if (!db) throw new Error('DB not initialized — await dbReady first')
  return db
}

/** Serialize and persist DB to IndexedDB */
export async function persistDb() {
  if (!db) return
  await idbSave(db.export())
}

/**
 * Execute a SELECT and return rows as plain objects.
 * @param {string} sql
 * @param {any[]} [params]
 */
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

/**
 * Execute a SELECT and return first row or null.
 */
export function queryOne(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const row = stmt.step() ? stmt.getAsObject() : null
  stmt.free()
  return row
}

/**
 * Execute INSERT/UPDATE/DELETE.
 */
export function run(sql, params = []) {
  db.run(sql, params)
}

/** last_insert_rowid() */
export function lastInsertId() {
  return db.exec('SELECT last_insert_rowid()')[0].values[0][0]
}

/** Download the DB as a .db file */
export function exportDbFile(filename = 'wendao_save.db') {
  const blob = new Blob([db.export()], { type: 'application/x-sqlite3' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

/** Load a .db file from an ArrayBuffer (replaces current DB) */
export async function importDbFile(arrayBuffer) {
  if (db) db.close()
  db = new sqlJs.Database(new Uint8Array(arrayBuffer))
  db.run(SCHEMA) // ensure schema
  await persistDb()
}

/** Run arbitrary SQL and return { columns, rows } (for debug console) */
export function execSql(sql) {
  const results = db.exec(sql)
  if (!results.length) return { columns: [], rows: [] }
  const { columns, values } = results[0]
  return { columns, rows: values }
}
