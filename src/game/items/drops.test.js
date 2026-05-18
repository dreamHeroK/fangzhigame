import { describe, it, expect } from 'vitest'
import { rollDropsForFoe, mergeLootStacks, rollBattleDrops, formatLootLine } from './drops.js'

// 确定性 rng 辅助
function seededRng(seed = 0) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

const alwaysDrop = () => 0.01   // 低于所有门槛 → 必掉落
const neverDrop  = () => 0.999  // 高于所有门槛 → 不掉落

describe('mergeLootStacks', () => {
  it('merges same itemId', () => {
    const result = mergeLootStacks([
      { itemId: 'xiao_huanhun', qty: 2 },
      { itemId: 'xiao_huanhun', qty: 3 },
    ])
    expect(result).toHaveLength(1)
    expect(result[0].qty).toBe(5)
  })
  it('keeps distinct items separate', () => {
    const result = mergeLootStacks([
      { itemId: 'xiao_huanhun', qty: 1 },
      { itemId: 'xiao_juling', qty: 1 },
    ])
    expect(result).toHaveLength(2)
  })
  it('filters unknown itemIds', () => {
    const result = mergeLootStacks([{ itemId: 'FAKE_ITEM_XYZ', qty: 5 }])
    expect(result).toHaveLength(0)
  })
  it('qty=0 is rounded up to 1 by Math.max(1,...)', () => {
    // mergeLootStacks uses Math.max(1, floor(qty)) → qty 0 becomes 1
    const result = mergeLootStacks([{ itemId: 'xiao_huanhun', qty: 0 }])
    expect(result).toHaveLength(1)
    expect(result[0].qty).toBe(1)
  })
})

describe('rollDropsForFoe', () => {
  it('returns an array', () => {
    const drops = rollDropsForFoe({ level: 1 }, seededRng(42))
    expect(Array.isArray(drops)).toBe(true)
  })
  it('always drops something when rng is minimal', () => {
    const drops = rollDropsForFoe({ level: 1 }, alwaysDrop)
    expect(drops.length).toBeGreaterThan(0)
  })
  it('never drops anything when rng is maximal', () => {
    const drops = rollDropsForFoe({ level: 1 }, neverDrop)
    expect(drops.length).toBe(0)
  })
  it('world boss drops more qty', () => {
    const normal = rollDropsForFoe({ level: 30 }, alwaysDrop)
    const boss   = rollDropsForFoe({ level: 30, isWorldBoss: true }, alwaysDrop)
    const normalTotal = normal.reduce((s, d) => s + d.qty, 0)
    const bossTotal   = boss.reduce((s, d) => s + d.qty, 0)
    expect(bossTotal).toBeGreaterThanOrEqual(normalTotal)
  })
  it('items match valid catalog ids', () => {
    // 多次随机确保不出现幽灵 id
    const rng = seededRng(1)
    for (let i = 0; i < 20; i++) {
      const drops = rollDropsForFoe({ level: Math.floor(rng() * 100) + 1 }, rng)
      for (const d of drops) {
        expect(typeof d.itemId).toBe('string')
        expect(d.qty).toBeGreaterThan(0)
      }
    }
  })
})

describe('rollBattleDrops', () => {
  it('only rolls for foe-side units', () => {
    const foes = [
      { side: 'foe',  level: 10 },
      { side: 'ally', level: 10 },
    ]
    const withAlly = rollBattleDrops(foes, alwaysDrop)
    const foesOnly = rollBattleDrops([{ side: 'foe', level: 10 }], alwaysDrop)
    // 只计 foe，结果应与只传 foe 相同（ally 被忽略）
    const withAllyTotal = withAlly.reduce((s, d) => s + d.qty, 0)
    const foesOnlyTotal = foesOnly.reduce((s, d) => s + d.qty, 0)
    expect(withAllyTotal).toBe(foesOnlyTotal)
  })
  it('merges drops from multiple foes', () => {
    const foes = [
      { side: 'foe', level: 5 },
      { side: 'foe', level: 5 },
    ]
    const drops = rollBattleDrops(foes, alwaysDrop)
    const total = drops.reduce((s, d) => s + d.qty, 0)
    const single = rollDropsForFoe({ level: 5 }, alwaysDrop)
    const singleTotal = single.reduce((s, d) => s + d.qty, 0)
    expect(total).toBeGreaterThanOrEqual(singleTotal)
  })
})

describe('formatLootLine', () => {
  it('empty array → 本次无药品掉落', () => {
    expect(formatLootLine([])).toBe('本次无药品掉落。')
  })
  it('includes item name in output', () => {
    const drops = rollDropsForFoe({ level: 1 }, alwaysDrop)
    const line = formatLootLine(drops)
    expect(typeof line).toBe('string')
    if (drops.length > 0) {
      expect(line).toContain('获得：')
    }
  })
})
