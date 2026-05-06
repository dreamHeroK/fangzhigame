import { getConsumable, isQuotaOrbItemId, LINGLONG_DEFAULT_QUOTA } from './items/catalog.js'

/**
 * 背包：普通药为数量；血玲珑/法玲珑为数组，每项一颗玲珑 `{ remaining }`（不可叠加为多格）。
 * @typedef {Record<string, number | Array<{ remaining: number }>>} Inventory
 */

/**
 * @param {unknown} raw
 * @returns {Array<{ remaining: number }>}
 */
export function normalizeOrbArray(raw) {
  if (raw == null) return []
  if (Array.isArray(raw)) {
    return raw
      .map((o) => ({ remaining: Math.max(0, Math.floor(/** @type {{ remaining?: number }} */ (o)?.remaining ?? 0)) }))
      .filter((o) => o.remaining > 0)
  }
  if (typeof raw === 'number' && raw > 0) {
    return Array.from({ length: Math.floor(raw) }, () => ({ remaining: LINGLONG_DEFAULT_QUOTA }))
  }
  return []
}

/**
 * 将旧存档中的玲珑数量写法转为额度数组。
 * @param {Inventory} inv
 * @returns {Inventory}
 */
export function migrateInventory(inv) {
  if (!inv || typeof inv !== 'object') return /** @type {Inventory} */ ({})
  const next = { ...inv }
  for (const id of /** @type {const} */ (['xuelinglong', 'falinglong'])) {
    const v = next[id]
    if (v == null) continue
    if (Array.isArray(v)) {
      next[id] = normalizeOrbArray(v)
      continue
    }
    if (typeof v === 'number' && v > 0) {
      next[id] = Array.from({ length: Math.floor(v) }, () => ({ remaining: LINGLONG_DEFAULT_QUOTA }))
    }
  }
  return /** @type {Inventory} */ (next)
}

export function createEmptyInventory() {
  return /** @type {Inventory} */ ({})
}

/** 开局演示：少量低阶药 + 玲珑各 1（迁移后为单颗额度型） */
export function createStarterInventory() {
  return migrateInventory(
    /** @type {Inventory} */ ({
      zhixuecao: 3,
      yiyecao: 2,
      baiguo: 3,
      xuelinglong: 1,
      falinglong: 1,
    })
  )
}

export function getQty(inv, itemId) {
  const m = migrateInventory(inv)
  if (isQuotaOrbItemId(itemId)) return normalizeOrbArray(m[itemId]).length
  const cur = m[itemId]
  return typeof cur === 'number' ? Math.max(0, Math.floor(cur)) : 0
}

/**
 * @param {Inventory} inv
 * @param {Array<{ itemId: string, qty: number }>} stacks
 */
export function addLootStacks(inv, stacks) {
  let next = migrateInventory(inv)
  for (const { itemId, qty } of stacks) {
    if (!getConsumable(itemId)) continue
    const q = Math.max(1, Math.floor(qty))
    if (isQuotaOrbItemId(itemId)) {
      const arr = normalizeOrbArray(next[itemId])
      for (let i = 0; i < q; i++) arr.push({ remaining: LINGLONG_DEFAULT_QUOTA })
      next = { ...next, [itemId]: arr }
    } else {
      const cur = typeof next[itemId] === 'number' ? next[itemId] : 0
      next = { ...next, [itemId]: cur + q }
    }
  }
  return next
}

/** 消耗品叠放：扣 1 个；玲珑请用 consumeInventoryRow */
export function tryConsumeOne(inv, itemId) {
  const m = migrateInventory(inv)
  if (isQuotaOrbItemId(itemId)) return null
  const cur = getQty(m, itemId)
  if (cur < 1) return null
  const next = { ...m }
  if (cur <= 1) delete next[itemId]
  else next[itemId] = cur - 1
  return next
}

/**
 * 行键：叠放为 itemId；玲珑为 `itemId#orbIndex`（与 migrate 后数组下标一致）。
 * @param {string} rowKey
 */
export function parseInventoryRowKey(rowKey) {
  const i = rowKey.indexOf('#')
  if (i < 0) return { itemId: rowKey, orbIndex: /** @type {const} */ (null) }
  const itemId = rowKey.slice(0, i)
  const orbIndex = parseInt(rowKey.slice(i + 1), 10)
  if (!isQuotaOrbItemId(itemId) || !Number.isFinite(orbIndex)) return { itemId: rowKey, orbIndex: null }
  return { itemId, orbIndex }
}

/**
 * 使用成功后扣背包：普通药 -1；玲珑按本次实际回复扣等额额度，额度归零删格。
 * @param {Inventory} inv
 * @param {{ itemId: string, orbIndex: number | null }} parsed
 * @param {{ hpRestored?: number, mpRestored?: number }} deltas
 * @returns {Inventory | null}
 */
export function consumeInventoryRow(inv, parsed, deltas) {
  const m = migrateInventory(inv)
  const { itemId, orbIndex } = parsed
  if (isQuotaOrbItemId(itemId)) {
    if (orbIndex == null || !Number.isFinite(orbIndex)) return null
    const arr = normalizeOrbArray(m[itemId])
    const o = arr[orbIndex]
    if (!o || o.remaining <= 0) return null
    const cost =
      itemId === 'xuelinglong'
        ? Math.max(0, Math.floor(deltas.hpRestored ?? 0))
        : Math.max(0, Math.floor(deltas.mpRestored ?? 0))
    if (cost <= 0) return null
    if (cost > o.remaining) return null
    const nextRem = o.remaining - cost
    const nextArr = [...arr]
    if (nextRem <= 0) nextArr.splice(orbIndex, 1)
    else nextArr[orbIndex] = { remaining: nextRem }
    return { ...m, [itemId]: nextArr }
  }
  return tryConsumeOne(m, itemId)
}

/**
 * @param {Inventory} inv
 * @returns {Array<{ itemId: string, qty: number, def: NonNullable<ReturnType<typeof getConsumable>>, stackable: boolean, rowKey: string, orbIndex?: number, remaining?: number }>}
 */
export function listInventoryStacks(inv) {
  const m = migrateInventory(inv)
  /** @type {Array<{ itemId: string, qty: number, def: NonNullable<ReturnType<typeof getConsumable>>, stackable: boolean, rowKey: string, orbIndex?: number, remaining?: number }>} */
  const rows = []
  for (const itemId of Object.keys(m)) {
    const def = getConsumable(itemId)
    if (!def) continue
    if (isQuotaOrbItemId(itemId)) {
      const slots = normalizeOrbArray(m[itemId])
      slots.forEach((o, orbIndex) => {
        rows.push({
          itemId,
          qty: 1,
          def,
          stackable: false,
          rowKey: `${itemId}#${orbIndex}`,
          orbIndex,
          remaining: o.remaining,
        })
      })
    } else {
      const qty = typeof m[itemId] === 'number' ? Math.max(0, Math.floor(m[itemId])) : 0
      if (qty > 0) rows.push({ itemId, qty, def, stackable: true, rowKey: itemId })
    }
  }
  rows.sort((a, b) => {
    const ta = a.def.tier ?? 99
    const tb = b.def.tier ?? 99
    if (ta !== tb) return ta - tb
    if (a.itemId !== b.itemId) return a.itemId.localeCompare(b.itemId)
    return (a.orbIndex ?? -1) - (b.orbIndex ?? -1)
  })
  return rows
}
