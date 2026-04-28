import { describe, expect, it } from 'vitest'
import {
  CHARACTER_MAX_LEVEL,
  applyExpTowardLevelUp,
  expIntoCurrentLevel,
  expRemainingToNext,
  expRequiredToNextLevel,
  getAffinityPointsTotal,
  getFreeAttributePointsTotal,
  getLevelFromTotalExp,
  normalizeLevelBar,
  remainingExpToNextLevel,
  totalExpFromLevelBar,
  totalExpToReachLevel,
} from './characterLevelConfig.js'

describe('characterLevelConfig', () => {
  it('表列节点：升级所需经验', () => {
    expect(expRequiredToNextLevel(1)).toBe(120)
    expect(expRequiredToNextLevel(5)).toBe(774)
    expect(expRequiredToNextLevel(10)).toBe(2375)
    expect(expRequiredToNextLevel(100)).toBe(147960000)
    // 139→140 用 135～140 段插值；已满级则不再升级
    expect(expRequiredToNextLevel(139)).toBe(2741200000)
    expect(expRequiredToNextLevel(CHARACTER_MAX_LEVEL)).toBe(0)
  })

  it('中间等级线性插值（5→10 段）', () => {
    const e6 = expRequiredToNextLevel(6)
    const e9 = expRequiredToNextLevel(9)
    expect(e6).toBeGreaterThan(774)
    expect(e9).toBeLessThan(2375)
    expect(e6).toBeLessThan(e9)
  })

  it('累计经验与等级互逆', () => {
    const t2 = totalExpToReachLevel(2)
    expect(t2).toBe(120)
    expect(getLevelFromTotalExp(0)).toBe(1)
    expect(getLevelFromTotalExp(119)).toBe(1)
    expect(getLevelFromTotalExp(120)).toBe(2)
    expect(getLevelFromTotalExp(totalExpToReachLevel(50))).toBe(50)
  })

  it('里程碑：自由属性点（累计）', () => {
    expect(getFreeAttributePointsTotal(1)).toBe(0)
    expect(getFreeAttributePointsTotal(10)).toBe(36)
    expect(getFreeAttributePointsTotal(30)).toBe(116)
    expect(getFreeAttributePointsTotal(61)).toBe(240)
    expect(getFreeAttributePointsTotal(62)).toBe(244)
    expect(getFreeAttributePointsTotal(80)).toBe(316)
    expect(getFreeAttributePointsTotal(100)).toBe(396)
    expect(getFreeAttributePointsTotal(120)).toBe(476)
    expect(getFreeAttributePointsTotal(140)).toBe(556)
  })

  it('里程碑：相性点（累计）', () => {
    expect(getAffinityPointsTotal(1)).toBe(0)
    expect(getAffinityPointsTotal(10)).toBe(5)
    expect(getAffinityPointsTotal(30)).toBe(15)
    expect(getAffinityPointsTotal(60)).toBe(30)
    expect(getAffinityPointsTotal(61)).toBe(30)
    expect(getAffinityPointsTotal(62)).toBe(31)
    expect(getAffinityPointsTotal(80)).toBe(49)
    expect(getAffinityPointsTotal(100)).toBe(69)
    expect(getAffinityPointsTotal(120)).toBe(89)
    expect(getAffinityPointsTotal(140)).toBe(109)
  })

  it('expIntoCurrentLevel / expRemainingToNext', () => {
    const t = totalExpToReachLevel(5)
    expect(getLevelFromTotalExp(t)).toBe(5)
    expect(expIntoCurrentLevel(t)).toBe(0)
    expect(expRemainingToNext(t)).toBe(expRequiredToNextLevel(5))
    const half = t + Math.floor(expRequiredToNextLevel(5) / 2)
    expect(expIntoCurrentLevel(half)).toBe(Math.floor(expRequiredToNextLevel(5) / 2))
  })

  it('applyExpTowardLevelUp 连升', () => {
    const r = applyExpTowardLevelUp(1, 0, 120 + 230 + 50)
    expect(r.levelsGained).toBe(2)
    expect(r.newLevel).toBe(3)
    expect(r.expIntoLevel).toBe(50)
  })

  it('normalizeLevelBar 消化溢出经验', () => {
    expect(normalizeLevelBar(1, 120 + 230)).toEqual({ level: 3, expIntoLevel: 0 })
    const mid = normalizeLevelBar(5, 999999999)
    expect(mid.level).toBeGreaterThan(5)
    expect(mid.expIntoLevel).toBeLessThan(999999999)
    const lastJump = expRequiredToNextLevel(139)
    expect(normalizeLevelBar(139, lastJump + 1000)).toEqual({
      level: CHARACTER_MAX_LEVEL,
      expIntoLevel: 1000,
    })
  })

  it('level + bar 与总经验互逆', () => {
    const level = 5
    const into = Math.floor(expRequiredToNextLevel(5) / 3)
    const total = totalExpFromLevelBar(level, into)
    expect(getLevelFromTotalExp(total)).toBe(level)
    expect(expIntoCurrentLevel(total)).toBe(into)
    expect(remainingExpToNextLevel(level, into)).toBe(expRequiredToNextLevel(5) - into)
  })
})
