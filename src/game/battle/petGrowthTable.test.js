import { describe, expect, it } from 'vitest'
import {
  getPetGrowthConfig,
  rollPetGrowthDetail,
  sumGrowthParts,
} from './petGrowthTable.js'

describe('getPetGrowthConfig', () => {
  it('returns frog row for qingwa', () => {
    const c = getPetGrowthConfig('qingwa')
    expect(c.total[0]).toBe(135)
    expect(c.hp[0]).toBe(50)
  })

  it('falls back for unknown key', () => {
    const c = getPetGrowthConfig('unknown_xyz')
    expect(c.total).toEqual([200, 290])
  })
})

describe('rollPetGrowthDetail', () => {
  it('rolls within configured bounds', () => {
    const rng = () => 0
    const g = rollPetGrowthDetail('qingwa', rng)
    expect(g.hp).toBe(50)
    expect(g.mp).toBe(50)
    expect(g.spd).toBe(25)
    expect(g.pAtk).toBe(-10)
    expect(g.mAtk).toBe(20)
  })

  it('ghost row is fixed', () => {
    const g = rollPetGrowthDetail('ghost_lianyu_xuemoa', Math.random)
    expect(sumGrowthParts(g)).toBe(320)
  })
})
