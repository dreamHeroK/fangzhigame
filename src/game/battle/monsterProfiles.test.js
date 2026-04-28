import { describe, expect, it } from 'vitest'
import { getMonsterProfile, rollInnateIds } from './monsterProfiles.js'

describe('rollInnateIds', () => {
  it('returns empty when pool empty', () => {
    expect(rollInnateIds([], { rng: () => 0 })).toEqual([])
  })

  it('takes all when rng always 0', () => {
    const pool = ['a', 'b', 'c']
    expect(rollInnateIds(pool, { rng: () => 0, carryProb: 1 })).toEqual(pool)
  })

  it('takes none when rng always 1', () => {
    const pool = ['a', 'b', 'c']
    expect(rollInnateIds(pool, { rng: () => 1, carryProb: 0.5 })).toEqual([])
  })
})

describe('getMonsterProfile', () => {
  it('returns 桃精 pool with 拔苗助长 id', () => {
    const p = getMonsterProfile('taojing')
    expect(p.affinity).toBe('木')
    expect(p.innatePool).toContain('bamiaozhuzhang')
  })

  it('棋灵 has empty innate pool', () => {
    const p = getMonsterProfile('qiling')
    expect(p.innatePool).toEqual([])
  })
})
