import { getConsumable } from './items/catalog.js'

/** @typedef {Record<string, number>} Inventory */

export function createEmptyInventory() {
  return /** @type {Inventory} */ ({})
}

/** 开局演示：少量低阶药 */
export function createStarterInventory() {
  return /** @type {Inventory} */ ({
    zhixuecao: 3,
    yiyecao: 2,
    baiguo: 3,
    xuelinglong: 1,
    falinglong: 1,
  })
}

export function getQty(inv, itemId) {
  return Math.max(0, Math.floor(inv[itemId] ?? 0))
}

/**
 * @param {Inventory} inv
 * @param {Array<{ itemId: string, qty: number }>} stacks
 */
export function addLootStacks(inv, stacks) {
  const next = { ...inv }
  for (const { itemId, qty } of stacks) {
    if (!getConsumable(itemId)) continue
    const q = Math.max(1, Math.floor(qty))
    next[itemId] = (next[itemId] ?? 0) + q
  }
  return next
}

/** 消耗 1 个；不足则返回 null */
export function tryConsumeOne(inv, itemId) {
  const cur = getQty(inv, itemId)
  if (cur < 1) return null
  const next = { ...inv }
  if (cur <= 1) delete next[itemId]
  else next[itemId] = cur - 1
  return next
}

export function listInventoryStacks(inv) {
  return Object.entries(inv)
    .filter(([, q]) => q > 0)
    .map(([itemId, qty]) => ({ itemId, qty, def: getConsumable(itemId) }))
    .filter((x) => x.def)
    .sort((a, b) => (a.def.tier ?? 99) - (b.def.tier ?? 99) || a.itemId.localeCompare(b.itemId))
}
