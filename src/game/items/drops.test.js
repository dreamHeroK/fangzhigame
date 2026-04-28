import { describe, expect, it } from 'vitest'
import { rollBattleDrops, rollDropsForFoe } from './drops.js'

function rngFixed(seq) {
  let i = 0
  return () => {
    const v = seq[i] ?? 0.5
    i++
    return v
  }
}

describe('drops', () => {
  it('低等级野怪在固定 rng 下可掉血药', () => {
    const foe = { side: 'foe', level: 5, isWorldBoss: false }
    const drops = rollDropsForFoe(foe, rngFixed([0.1, 0.1, 0.99, 0.99]))
    expect(drops.some((d) => d.itemId === 'zhixuecao' || d.itemId === 'yiyecao')).toBe(true)
  })

  it('rollBattleDrops 合并多只', () => {
    const foes = [
      { side: 'foe', level: 2, isWorldBoss: false },
      { side: 'foe', level: 3, isWorldBoss: false },
    ]
    const drops = rollBattleDrops(foes, rngFixed([0.1, 0.99, 0.1, 0.99, 0.99, 0.99]))
    expect(drops.length).toBeGreaterThanOrEqual(1)
  })
})
