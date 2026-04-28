import { describe, expect, it } from 'vitest'
import { computeCaptureProbability } from './pets.js'

describe('computeCaptureProbability', () => {
  it('is 0 for world boss', () => {
    expect(computeCaptureProbability({ hp: 10, maxHp: 100, isWorldBoss: true })).toBe(0)
  })

  it('reaches pMax at or below 30% HP', () => {
    expect(computeCaptureProbability({ hp: 30, maxHp: 100 })).toBe(0.55)
    expect(computeCaptureProbability({ hp: 15, maxHp: 100 })).toBe(0.55)
  })

  it('interpolates above 30% HP', () => {
    const p = computeCaptureProbability({ hp: 100, maxHp: 100 })
    expect(p).toBeCloseTo(0.04, 5)
    const mid = computeCaptureProbability({ hp: 65, maxHp: 100 })
    expect(mid).toBeGreaterThan(0.04)
    expect(mid).toBeLessThan(0.55)
  })
})
