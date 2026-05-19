/**
 * 存档管理 & 战斗记录
 * 所有写操作结束后调用 persistDb() 刷盘
 */
import { queryAll, queryOne, run, lastInsertId, persistDb } from './sqliteDb.js'

// ── 存档列表 ────────────────────────────────────────────────────────────────

export function listSaves() {
  return queryAll('SELECT * FROM saves ORDER BY updated_at DESC')
}

export function getCurrentSaveId() {
  const row = queryOne('SELECT id FROM saves WHERE is_current=1 LIMIT 1')
  return row ? row.id : null
}

// ── 存档 CRUD ────────────────────────────────────────────────────────────────

/**
 * 新建存档并设为当前存档；返回新 save_id。
 * @param {string} name
 * @param {object} charState  characterStore 的完整 state 快照
 */
export async function createSave(name, charState) {
  const now = Date.now()
  run('UPDATE saves SET is_current=0')
  run(
    `INSERT INTO saves (name, char_name, char_level, char_school, created_at, updated_at, is_current)
     VALUES (?,?,?,?,?,?,1)`,
    [name, charState.name, charState.level, charState.school, now, now],
  )
  const saveId = lastInsertId()
  run(
    'INSERT OR REPLACE INTO character_snapshots (save_id, data_json) VALUES (?,?)',
    [saveId, JSON.stringify(charState)],
  )
  await persistDb()
  return saveId
}

/**
 * 更新当前存档的角色快照（自动存档用）。
 */
export async function updateCurrentSave(charState) {
  const saveId = getCurrentSaveId()
  if (!saveId) return false
  const now = Date.now()
  run(
    'UPDATE saves SET char_name=?, char_level=?, char_school=?, updated_at=? WHERE id=?',
    [charState.name, charState.level, charState.school, now, saveId],
  )
  run(
    'INSERT OR REPLACE INTO character_snapshots (save_id, data_json) VALUES (?,?)',
    [saveId, JSON.stringify(charState)],
  )
  await persistDb()
  return true
}

/**
 * 读取存档快照，返回 charState 对象（可直接写入 store）。
 */
export function loadSaveData(saveId) {
  const row = queryOne('SELECT data_json FROM character_snapshots WHERE save_id=?', [saveId])
  if (!row) return null
  try { return JSON.parse(row.data_json) } catch { return null }
}

/**
 * 切换当前存档。
 */
export async function setCurrentSave(saveId) {
  run('UPDATE saves SET is_current=0')
  run('UPDATE saves SET is_current=1 WHERE id=?', [saveId])
  await persistDb()
}

/**
 * 删除存档（级联删除快照和战斗记录）。
 */
export async function deleteSave(saveId) {
  run('DELETE FROM saves WHERE id=?', [saveId])
  await persistDb()
}

// ── 战斗历史 ────────────────────────────────────────────────────────────────

/**
 * 记录一场战斗结果。
 * @param {{ outcome, mapName, foeCount, rounds, expGained, petExpGained, goldGained, loot }} result
 */
export async function recordBattle(result) {
  const saveId = getCurrentSaveId()
  if (!saveId) return
  const { outcome, mapName, foeCount, rounds, expGained, petExpGained, goldGained, loot } = result
  run(
    `INSERT INTO battle_history
       (save_id, fought_at, outcome, map_name, foe_count, rounds,
        exp_gained, pet_exp_gained, gold_gained, loot_json)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      saveId, Date.now(), outcome, mapName ?? '', foeCount ?? 0, rounds ?? 0,
      expGained ?? 0, petExpGained ?? 0, goldGained ?? 0,
      JSON.stringify(loot ?? []),
    ],
  )
  await persistDb()
}

/**
 * 查询战斗历史（最新在前）。
 */
export function getBattleHistory(saveId, limit = 100) {
  return queryAll(
    'SELECT * FROM battle_history WHERE save_id=? ORDER BY fought_at DESC LIMIT ?',
    [saveId, limit],
  )
}

// ── 行动记忆 ────────────────────────────────────────────────────────────────

/**
 * 读取全部行动记忆，返回 { [templateKey]: skillId }。
 */
export function loadSkillMemory() {
  try {
    const rows = queryAll('SELECT template_key, skill_id FROM skill_memory')
    return Object.fromEntries(rows.map(r => [r.template_key, r.skill_id]))
  } catch { return {} }
}

/**
 * 写入单条行动记忆（upsert），异步刷盘。
 * @param {string} templateKey
 * @param {string} skillId
 */
export async function saveSkillEntry(templateKey, skillId) {
  run(
    'INSERT OR REPLACE INTO skill_memory (template_key, skill_id, updated_at) VALUES (?,?,?)',
    [templateKey, skillId, Date.now()],
  )
  await persistDb()
}

/**
 * 当前存档战斗统计汇总。
 */
export function getBattleStats(saveId) {
  return queryOne(
    `SELECT
       COUNT(*)                                        AS total,
       SUM(CASE WHEN outcome='victory' THEN 1 ELSE 0 END) AS victories,
       SUM(CASE WHEN outcome='defeat'  THEN 1 ELSE 0 END) AS defeats,
       SUM(exp_gained)                                 AS total_exp,
       SUM(gold_gained)                                AS total_gold
     FROM battle_history WHERE save_id=?`,
    [saveId],
  ) ?? { total: 0, victories: 0, defeats: 0, total_exp: 0, total_gold: 0 }
}
