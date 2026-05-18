import { describe, it, expect } from 'vitest'
import {
  CHARACTER_MAX_LEVEL,
  PET_MAX_LEVEL,
  expRequiredToNextLevel,
  totalExpToReachLevel,
  getLevelFromTotalExp,
  applyExpTowardLevelUp,
  getAffinityPointsTotal,
  getFreeAttributePointsTotal,
  petExpRequiredToNextLevel,
  applyPetExp,
} from './characterLevelConfig.js'

describe('expRequiredToNextLevel', () => {
  it('level 1 matches first knot (120)', () => {
    expect(expRequiredToNextLevel(1)).toBe(120)
  })
  it('level 2 matches second knot (230)', () => {
    expect(expRequiredToNextLevel(2)).toBe(230)
  })
  it('level 10 matches knot (2375)', () => {
    expect(expRequiredToNextLevel(10)).toBe(2375)
  })
  it('level 30 matches knot (119968)', () => {
    expect(expRequiredToNextLevel(30)).toBe(119968)
  })
  it('level 50 matches knot (2771697)', () => {
    expect(expRequiredToNextLevel(50)).toBe(2771697)
  })
  it('level 100 matches knot (147960000)', () => {
    expect(expRequiredToNextLevel(100)).toBe(147960000)
  })
  it('interpolates between level 5 and 10', () => {
    const v = expRequiredToNextLevel(7)
    expect(v).toBeGreaterThan(expRequiredToNextLevel(5))
    expect(v).toBeLessThan(expRequiredToNextLevel(10))
  })
  it('max level returns 0 (no more leveling)', () => {
    expect(expRequiredToNextLevel(CHARACTER_MAX_LEVEL)).toBe(0)
    expect(expRequiredToNextLevel(CHARACTER_MAX_LEVEL + 1)).toBe(0)
  })
  it('above-max returns 0', () => {
    expect(expRequiredToNextLevel(999)).toBe(0)
  })
  it('strictly increasing from 1 to 94 (95→100 knot dips intentionally)', () => {
    for (let L = 1; L < 94; L++) {
      expect(expRequiredToNextLevel(L)).toBeLessThan(expRequiredToNextLevel(L + 1))
    }
  })
})

describe('totalExpToReachLevel', () => {
  it('level 1 requires 0 cumulative exp', () => {
    expect(totalExpToReachLevel(1)).toBe(0)
  })
  it('level 2 requires exactly exp(1)', () => {
    expect(totalExpToReachLevel(2)).toBe(expRequiredToNextLevel(1))
  })
  it('level 3 requires exp(1)+exp(2)', () => {
    expect(totalExpToReachLevel(3)).toBe(
      expRequiredToNextLevel(1) + expRequiredToNextLevel(2)
    )
  })
  it('monotonically increasing', () => {
    for (let L = 1; L < 20; L++) {
      expect(totalExpToReachLevel(L)).toBeLessThan(totalExpToReachLevel(L + 1))
    }
  })
})

describe('getLevelFromTotalExp', () => {
  it('0 exp = level 1', () => {
    expect(getLevelFromTotalExp(0)).toBe(1)
  })
  it('exactly enough for level 2 -> level 2', () => {
    expect(getLevelFromTotalExp(totalExpToReachLevel(2))).toBe(2)
  })
  it('huge exp caps at CHARACTER_MAX_LEVEL', () => {
    expect(getLevelFromTotalExp(Number.MAX_SAFE_INTEGER)).toBe(CHARACTER_MAX_LEVEL)
  })
})

describe('applyExpTowardLevelUp', () => {
  it('small gain stays at same level', () => {
    const r = applyExpTowardLevelUp(1, 0, 50)
    expect(r.newLevel).toBe(1)
    expect(r.expIntoLevel).toBe(50)
    expect(r.levelsGained).toBe(0)
  })
  it('exact level-up gain', () => {
    const needed = expRequiredToNextLevel(1)
    const r = applyExpTowardLevelUp(1, 0, needed)
    expect(r.newLevel).toBe(2)
    expect(r.expIntoLevel).toBe(0)
    expect(r.levelsGained).toBe(1)
  })
  it('overshoot gain carries remainder', () => {
    const needed = expRequiredToNextLevel(1)
    const r = applyExpTowardLevelUp(1, 0, needed + 100)
    expect(r.newLevel).toBe(2)
    expect(r.expIntoLevel).toBe(100)
    expect(r.levelsGained).toBe(1)
  })
  it('multi-level gain', () => {
    const exp = expRequiredToNextLevel(1) + expRequiredToNextLevel(2) + expRequiredToNextLevel(3) + 1
    const r = applyExpTowardLevelUp(1, 0, exp)
    expect(r.newLevel).toBe(4)
    expect(r.levelsGained).toBe(3)
  })
  it('at max level, extra exp does not raise level', () => {
    const r = applyExpTowardLevelUp(CHARACTER_MAX_LEVEL, 0, 999_999_999)
    expect(r.newLevel).toBe(CHARACTER_MAX_LEVEL)
    expect(r.levelsGained).toBe(0)
  })
})

describe('getAffinityPointsTotal', () => {
  it('level 1 = 0', () => expect(getAffinityPointsTotal(1)).toBe(0))
  it('level 10 = 5 (奇数3-9 = 3,5,7,9 = 4点 + 里程碑1 = 5)', () => {
    expect(getAffinityPointsTotal(10)).toBe(5)
  })
  it('level 60 = 30', () => expect(getAffinityPointsTotal(60)).toBe(30))
  it('level 61 = 30 (61不新增相性)', () => expect(getAffinityPointsTotal(61)).toBe(30))
  it('level 62 = 31', () => expect(getAffinityPointsTotal(62)).toBe(31))
  it('level 80 = 49', () => expect(getAffinityPointsTotal(80)).toBe(49))
  it('level 100 = 69', () => expect(getAffinityPointsTotal(100)).toBe(69))
})

describe('getFreeAttributePointsTotal', () => {
  it('level 1 = 0', () => expect(getFreeAttributePointsTotal(1)).toBe(0))
  it('level 2 = 4', ()  => expect(getFreeAttributePointsTotal(2)).toBe(4))
  it('level 50 = 196', () => expect(getFreeAttributePointsTotal(50)).toBe(196))
  it('level 100 = 396', () => expect(getFreeAttributePointsTotal(100)).toBe(396))
})

describe('petExpRequiredToNextLevel', () => {
  it('level 1 knot (80)', () => expect(petExpRequiredToNextLevel(1)).toBe(80))
  it('level 10 knot (1544)', () => expect(petExpRequiredToNextLevel(10)).toBe(1544))
  it('PET_MAX_LEVEL returns 0', () => expect(petExpRequiredToNextLevel(PET_MAX_LEVEL)).toBe(0))
  it('strictly increasing from 1 to 94 (95→100 knot dips intentionally)', () => {
    for (let L = 1; L < 94; L++) {
      expect(petExpRequiredToNextLevel(L)).toBeLessThan(petExpRequiredToNextLevel(L + 1))
    }
  })
  it('roughly 60-70% of char exp at same level', () => {
    for (const L of [10, 30, 50, 70]) {
      const ratio = petExpRequiredToNextLevel(L) / expRequiredToNextLevel(L)
      expect(ratio).toBeGreaterThan(0.50)
      expect(ratio).toBeLessThan(0.80)
    }
  })
})

describe('applyPetExp', () => {
  it('gains exp within level', () => {
    const r = applyPetExp(1, 0, 40)
    expect(r.level).toBe(1)
    expect(r.expIntoLevel).toBe(40)
  })
  it('levels up on sufficient exp', () => {
    const needed = petExpRequiredToNextLevel(1)
    const r = applyPetExp(1, 0, needed + 10)
    expect(r.level).toBe(2)
    expect(r.expIntoLevel).toBe(10)
    expect(r.levelsGained).toBe(1)
  })
  it('stops at PET_MAX_LEVEL', () => {
    const r = applyPetExp(PET_MAX_LEVEL, 0, 999_999_999)
    expect(r.level).toBe(PET_MAX_LEVEL)
    expect(r.expIntoLevel).toBe(0)
  })
})
