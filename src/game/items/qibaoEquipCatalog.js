/**
 * 奇宝斋导出的装备/武器目录（不含交易、区服、筛选字段；无 id，已按类型与等级排序）。
 * 数据由 `python/export_game_equip_json.py` 生成至 `../data/qibaoEquipCatalog.json`。
 */

import catalog from '../data/qibaoEquipCatalog.json'

/** @typedef {typeof catalog[number]} QibaoEquipRow */

/** @type {ReadonlyArray<QibaoEquipRow>} */
export const QIBAO_EQUIP_CATALOG = catalog

const byItemInfoCode = new Map()
for (const r of catalog) {
  const c = r.item_info_code
  if (typeof c === 'number' && Number.isFinite(c)) {
    byItemInfoCode.set(String(Math.trunc(c)), r)
  }
}

/**
 * @param {number | string} itemInfoCode 奇宝斋 ItemInfoCode
 * @returns {QibaoEquipRow | null}
 */
export function getQibaoEquipByItemInfoCode(itemInfoCode) {
  const k =
    typeof itemInfoCode === 'number' && Number.isFinite(itemInfoCode)
      ? String(Math.trunc(itemInfoCode))
      : String(itemInfoCode ?? '').trim()
  if (!k) return null
  return byItemInfoCode.get(k) ?? null
}

/** @returns {ReadonlyArray<QibaoEquipRow>} */
export function listQibaoEquipCatalog() {
  return catalog
}

/**
 * 背包等是否用奇宝条目作键：可用 item_info_code 数字或字符串。
 * @param {unknown} ref
 */
export function isQibaoEquipItemRef(ref) {
  if (typeof ref === 'number' && Number.isFinite(ref)) return getQibaoEquipByItemInfoCode(ref) != null
  if (typeof ref === 'string' && /^\d+$/.test(ref)) return getQibaoEquipByItemInfoCode(ref) != null
  return false
}
