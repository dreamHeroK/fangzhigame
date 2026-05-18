import { CONSUMABLE_BY_ID, getConsumable, potionIdsForTier, tierFromMonsterLevel } from './catalog.js'

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)]
}

/**
 * @typedef {{ itemId: string, qty: number }} LootStack
 */

/**
 * 单只已击倒怪物掉落（概率与等级相关；世界 BOSS 额外加玲珑概率）
 * @param {{ level: number, isWorldBoss?: boolean, templateKey?: string }} foe
 */
export function rollDropsForFoe(foe, rng = Math.random) {
  /** @type {LootStack[]} */
  const out = []
  const L = foe.level ?? 1
  const tier = tierFromMonsterLevel(L)
  const potIds = potionIdsForTier(tier)
  const boss      = !!foe.isWorldBoss
  const fieldBoss = !!foe.isFieldBoss

  const hpPotIds = potIds.filter((id) => CONSUMABLE_BY_ID[id]?.kind === 'hp')
  const mpPotIds = potIds.filter((id) => CONSUMABLE_BY_ID[id]?.kind === 'mp')

  const hpChance = boss ? 0.85 : fieldBoss ? 0.65 : 0.42
  const mpChance = boss ? 0.85 : fieldBoss ? 0.60 : 0.38
  const potQty   = boss ? 2 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 2)

  if (hpPotIds.length && rng() < hpChance) out.push({ itemId: pick(hpPotIds, rng), qty: potQty })
  if (mpPotIds.length && rng() < mpChance) out.push({ itemId: pick(mpPotIds, rng), qty: potQty })

  if (boss) {
    if (rng() < 0.35) out.push({ itemId: 'xuelinglong', qty: 1 })
    if (rng() < 0.35) out.push({ itemId: 'falinglong', qty: 1 })
  } else {
    const linglongChance = fieldBoss ? 0.15 + tier * 0.01 : 0.02 + tier * 0.008
    if (rng() < linglongChance) out.push({ itemId: 'xuelinglong', qty: 1 })
    if (rng() < linglongChance) out.push({ itemId: 'falinglong', qty: 1 })
  }

  return mergeLootStacks(out)
}

export function mergeLootStacks(stacks) {
  /** @type {Record<string, number>} */
  const m = {}
  for (const { itemId, qty } of stacks) {
    const q = Math.max(1, Math.floor(qty))
    if (!getConsumable(itemId)) continue
    m[itemId] = (m[itemId] ?? 0) + q
  }
  return Object.entries(m).map(([itemId, qty]) => ({ itemId, qty }))
}

/**
 * @param {Array<{ level: number, isWorldBoss?: boolean }>} foes 含已死敌方
 */
export function rollBattleDrops(foes, rng = Math.random) {
  /** @type {LootStack[]} */
  const acc = []
  for (const f of foes) {
    if (f.side !== 'foe') continue
    acc.push(...rollDropsForFoe(f, rng))
  }
  return mergeLootStacks(acc)
}

export function formatLootLine(stacks) {
  if (!stacks.length) return '本次无药品掉落。'
  return `获得：${stacks.map((s) => `${getConsumable(s.itemId)?.name ?? s.itemId}×${s.qty}`).join('、')}`
}
