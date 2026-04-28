import { describe, expect, it } from 'vitest'
import { computeHeroDerived, createDefaultHeroSheet, getEffectiveAttributeRates } from './playerSheet.js'

describe('playerSheet', () => {
  it('getEffectiveAttributeRates matches documented simplified formulas', () => {
    const sheet = {
      displayName: 'x',
      school: '法金',
      vit: 10,
      int: 10,
      str: 10,
      agi: 10,
      affMetal: 30,
      affWood: 12,
      affWater: 6,
      affFire: 42,
      affEarth: 21,
      daoYears: 0,
      daoDays: 0,
      potential: 0,
      fame: 0,
      staminaCur: 0,
      staminaMax: 0,
      meritRecord: 0,
    }
    const r = getEffectiveAttributeRates(sheet)
    expect(r.magPerInt).toBeCloseTo(5 + 30 / 6, 5)
    expect(r.hpPerVit).toBeCloseTo(5 + 12 / 6, 5)
    expect(r.mpPerInt).toBeCloseTo(7.5 + 12 / 8, 5)
    expect(r.defPerVit).toBeCloseTo(1.5 + 6 / 6, 5)
    // 火相 42 点超出单项上限 30，按 30 计算：2 + 30/42
    expect(r.spdPerAgi).toBeCloseTo(2 + 30 / 42, 5)
    expect(r.phyPerStr).toBeCloseTo(5 + 21 / 2.1, 5)
    expect(r.accPerStr).toBe(1)
  })

  it('computeHeroDerived includes rates and finite battle stats', () => {
    const sheet = createDefaultHeroSheet(12)
    const d = computeHeroDerived(12, sheet)
    expect(d.maxHp).toBeGreaterThan(0)
    expect(d.magDmg).toBeGreaterThan(0)
    expect(d.rates.magPerInt).toBeGreaterThan(0)
    expect(d.daoBarrierBonus).toBeGreaterThanOrEqual(0)
  })
})
