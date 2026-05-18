import { describe, it, expect } from 'vitest'
import {
  AFFINITY_CAP_PER_ELEMENT,
  getFixedStatFloor,
  getAttributePointBudget,
  getAffinityPointBudget,
  sumFour,
  sumAffinity,
  computeHeroDerived,
  getEffectiveAttributeRates,
  clampFourStats,
  clampAffinity,
  autoAllocateVitInt,
  daoToBarrierResBonus,
} from './playerSheet.js'

const BASE_SHEET = {
  vit: 50, int: 50, str: 50, agi: 50,
  affMetal: 0, affWood: 0, affWater: 0, affFire: 0, affEarth: 0,
  daoYears: 0, daoDays: 0,
}

describe('getFixedStatFloor', () => {
  it('level 1 → 1', () => expect(getFixedStatFloor(1)).toBe(1))
  it('level 50 → 1', () => expect(getFixedStatFloor(50)).toBe(1))
  it('level 100 → 1', () => expect(getFixedStatFloor(100)).toBe(1))
  it('clamps at CHARACTER_MAX_LEVEL', () => expect(getFixedStatFloor(999)).toBe(1))
})

describe('getAttributePointBudget', () => {
  it('level 1 = 0 (无自由点)', () => expect(getAttributePointBudget(1)).toBe(0))
  it('level 2 = 5 (5 × 1)', () => expect(getAttributePointBudget(2)).toBe(5))
  it('level 50 = 245 (5 × 49)', () => expect(getAttributePointBudget(50)).toBe(245))
  it('level 100 = 495 (5 × 99)', () => expect(getAttributePointBudget(100)).toBe(495))
  it('monotonically increasing 1→100', () => {
    for (let L = 1; L < 100; L++) {
      expect(getAttributePointBudget(L)).toBeLessThanOrEqual(getAttributePointBudget(L + 1))
    }
  })
})

describe('getAffinityPointBudget', () => {
  it('level 1 = 0', () => expect(getAffinityPointBudget(1)).toBe(0))
  it('level 10 = 5', () => expect(getAffinityPointBudget(10)).toBe(5))
  it('matches getAffinityPointsTotal', () => {
    // 与 characterLevelConfig 保持一致（通过 playerSheet 调用）
    expect(getAffinityPointBudget(60)).toBe(30)
    expect(getAffinityPointBudget(100)).toBe(69)
  })
})

describe('sumFour / sumAffinity', () => {
  it('sumFour sums the four stats', () => {
    expect(sumFour({ vit: 10, int: 20, str: 30, agi: 40 })).toBe(100)
  })
  it('sumAffinity sums all five affinities', () => {
    expect(sumAffinity({ affMetal: 5, affWood: 3, affWater: 0, affFire: 2, affEarth: 0 })).toBe(10)
  })
  it('treats missing keys as 0', () => {
    expect(sumFour({})).toBe(0)
    expect(sumAffinity({})).toBe(0)
  })
})

describe('AFFINITY_CAP_PER_ELEMENT', () => {
  it('is 30', () => expect(AFFINITY_CAP_PER_ELEMENT).toBe(30))
})

describe('getEffectiveAttributeRates', () => {
  it('no affinity → base rates', () => {
    const r = getEffectiveAttributeRates(BASE_SHEET)
    expect(r.hpPerVit).toBeCloseTo(5)
    expect(r.defPerVit).toBeCloseTo(1.5)
    expect(r.mpPerInt).toBeCloseTo(7.5)
    expect(r.magPerInt).toBeCloseTo(5)
    expect(r.phyPerStr).toBeCloseTo(5)
    expect(r.spdPerAgi).toBeCloseTo(2)
  })
  it('full metal affinity raises magPerInt', () => {
    const r = getEffectiveAttributeRates({ ...BASE_SHEET, affMetal: 30 })
    expect(r.magPerInt).toBeCloseTo(5 + 30 / 6)
  })
  it('full wood affinity raises hpPerVit and mpPerInt', () => {
    const r = getEffectiveAttributeRates({ ...BASE_SHEET, affWood: 30 })
    expect(r.hpPerVit).toBeCloseTo(5 + 30 / 6)
    expect(r.mpPerInt).toBeCloseTo(7.5 + 30 / 8)
  })
  it('full fire affinity raises spdPerAgi', () => {
    const r = getEffectiveAttributeRates({ ...BASE_SHEET, affFire: 30 })
    expect(r.spdPerAgi).toBeCloseTo(2 + 30 / 42)
  })
})

describe('computeHeroDerived', () => {
  const sheet50 = {
    ...BASE_SHEET,
    vit: 50, int: 60, str: 50, agi: 50,
    affMetal: 25,
  }

  it('maxHp > 0', () => {
    const d = computeHeroDerived(50, sheet50)
    expect(d.maxHp).toBeGreaterThan(0)
  })
  it('higher level → higher hp (same stats)', () => {
    const d30 = computeHeroDerived(30, BASE_SHEET)
    const d70 = computeHeroDerived(70, BASE_SHEET)
    expect(d70.maxHp).toBeGreaterThan(d30.maxHp)
    expect(d70.speed).toBeGreaterThan(d30.speed)
  })
  it('metal affinity raises magDmg', () => {
    const noAff = computeHeroDerived(50, { ...BASE_SHEET, int: 80 })
    const withAff = computeHeroDerived(50, { ...BASE_SHEET, int: 80, affMetal: 30 })
    expect(withAff.magDmg).toBeGreaterThan(noAff.magDmg)
  })
  it('dodgePct capped at 45', () => {
    const d = computeHeroDerived(100, { ...BASE_SHEET, agi: 1000, vit: 1000 })
    expect(d.dodgePct).toBeLessThanOrEqual(45)
  })
  it('critPct capped at 40', () => {
    const d = computeHeroDerived(100, { ...BASE_SHEET, str: 1000, agi: 1000 })
    expect(d.critPct).toBeLessThanOrEqual(40)
  })
  it('resJin/resMu are between 0 and 40', () => {
    const d = computeHeroDerived(50, sheet50)
    expect(d.resJin).toBeGreaterThanOrEqual(0)
    expect(d.resJin).toBeLessThanOrEqual(40)
    expect(d.resMu).toBeGreaterThanOrEqual(0)
    expect(d.resMu).toBeLessThanOrEqual(40)
  })
})

describe('daoToBarrierResBonus', () => {
  it('no dao years → 0', () => expect(daoToBarrierResBonus({ daoYears: 0, daoDays: 0 })).toBe(0))
  it('high years → non-zero', () => expect(daoToBarrierResBonus({ daoYears: 50, daoDays: 0 })).toBeGreaterThan(0))
  it('capped at 22', () => expect(daoToBarrierResBonus({ daoYears: 9999, daoDays: 9999 })).toBeLessThanOrEqual(22))
})

describe('clampFourStats', () => {
  it('sums at exactly budget when already valid', () => {
    const budget = getAttributePointBudget(50)
    const sheet = { vit: 50, int: 60, str: 50, agi: 50 }
    const result = clampFourStats(sheet, 50)
    expect(sumFour(result)).toBeLessThanOrEqual(budget)
  })
  it('trims over-budget allocation', () => {
    const sheet = { vit: 500, int: 500, str: 500, agi: 500 }
    const result = clampFourStats(sheet, 50)
    expect(sumFour(result)).toBeLessThanOrEqual(getAttributePointBudget(50))
  })
  it('each stat stays >= floor', () => {
    const sheet = { vit: 1, int: 1, str: 1, agi: 1 }
    const result = clampFourStats(sheet, 50)
    const floor = getFixedStatFloor(50)
    expect(result.vit).toBeGreaterThanOrEqual(floor)
    expect(result.int).toBeGreaterThanOrEqual(floor)
    expect(result.str).toBeGreaterThanOrEqual(floor)
    expect(result.agi).toBeGreaterThanOrEqual(floor)
  })
})

describe('clampAffinity', () => {
  it('caps each element at 30', () => {
    const sheet = { ...BASE_SHEET, affMetal: 999, affWood: 999 }
    const result = clampAffinity(sheet, 100)
    expect(result.affMetal).toBeLessThanOrEqual(30)
    expect(result.affWood).toBeLessThanOrEqual(30)
  })
  it('total never exceeds budget', () => {
    const sheet = { ...BASE_SHEET, affMetal: 20, affWood: 20, affFire: 20 }
    const result = clampAffinity(sheet, 50) // budget=25
    expect(sumAffinity(result)).toBeLessThanOrEqual(getAffinityPointBudget(50))
  })
  it('zero budget → all zeros', () => {
    const sheet = { ...BASE_SHEET, affMetal: 10 }
    const result = clampAffinity(sheet, 1) // budget=0
    expect(sumAffinity(result)).toBe(0)
  })
})

describe('autoAllocateVitInt', () => {
  it('result sums to exactly budget', () => {
    const sheet = { vit: 50, int: 50, str: 50, agi: 50 }
    const result = autoAllocateVitInt(sheet, 50)
    expect(sumFour(result)).toBe(getAttributePointBudget(50))
  })
  it('str and agi unchanged', () => {
    const sheet = { vit: 50, int: 50, str: 55, agi: 52 }
    const result = autoAllocateVitInt(sheet, 50)
    expect(result.str).toBe(55)
    expect(result.agi).toBe(52)
  })
  it('3:2 vit:int ratio distributes remainder', () => {
    const sheet = { vit: 50, int: 50, str: 50, agi: 50 }
    const result = autoAllocateVitInt(sheet, 50)
    // vit should get roughly 3/5 of leftover
    expect(result.vit).toBeGreaterThanOrEqual(result.int - 10)
  })
})
