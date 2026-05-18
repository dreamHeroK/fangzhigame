import { describe, it, expect } from 'vitest'
import {
  deriveStatsFromLevel,
  inferSkillPool,
  spawnMonster,
  spawnFromWendaoSpawn,
  createAllyUnit,
  rollFoeCount,
  buildEncounter,
} from './monsters.js'

function seededRng(seed = 1) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

describe('deriveStatsFromLevel', () => {
  it('all stats > 0 at level 1', () => {
    const s = deriveStatsFromLevel(1)
    expect(s.hp).toBeGreaterThan(0)
    expect(s.mp).toBeGreaterThan(0)
    expect(s.atk).toBeGreaterThan(0)
    expect(s.def).toBeGreaterThan(0)
    expect(s.speed).toBeGreaterThan(0)
  })
  it('higher level → higher stats', () => {
    const s1 = deriveStatsFromLevel(10)
    const s2 = deriveStatsFromLevel(50)
    expect(s2.hp).toBeGreaterThan(s1.hp)
    expect(s2.atk).toBeGreaterThan(s1.atk)
  })
  it('boss multiplier raises hp significantly', () => {
    const normal = deriveStatsFromLevel(30)
    const boss   = deriveStatsFromLevel(30, { isBoss: true })
    expect(boss.hp).toBeGreaterThan(normal.hp * 2)
  })
})

describe('inferSkillPool', () => {
  it('always includes normal_attack', () => {
    const pool = inferSkillPool({ tags: [], level: 1 })
    expect(pool).toContain('normal_attack')
  })
  it('aquatic adds shuiyan', () => {
    const pool = inferSkillPool({ tags: ['aquatic'], level: 1 })
    expect(pool).toContain('shuiyan')
  })
  it('fire tag adds liehuo', () => {
    const pool = inferSkillPool({ tags: ['fire'], level: 1 })
    expect(pool).toContain('liehuo')
  })
  it('world_boss pool includes advanced skills', () => {
    const pool = inferSkillPool({ tags: ['world_boss'], level: 80 })
    expect(pool).toContain('lipojun')
    expect(pool).toContain('bingdong')
  })
  it('level 70+ adds lipojun', () => {
    const pool = inferSkillPool({ tags: ['beast'], level: 70 })
    expect(pool).toContain('lipojun')
  })
  it('returns unique entries', () => {
    const pool = inferSkillPool({ tags: ['ghost', 'ice', 'dark'], level: 50 })
    const set = new Set(pool)
    expect(set.size).toBe(pool.length)
  })
})

describe('spawnMonster', () => {
  const template = {
    key: 'test_mob',
    name: '测试怪',
    level: 20,
    hp: 500,
    mp: 100,
    atk: 40,
    def: 20,
    speed: 15,
    skillPool: ['normal_attack'],
    affinity: null,
  }

  it('has correct side and name', () => {
    const unit = spawnMonster(template)
    expect(unit.side).toBe('foe')
    expect(unit.name).toBe('测试怪')
  })
  it('hp equals maxHp at spawn', () => {
    const unit = spawnMonster(template)
    expect(unit.hp).toBe(unit.maxHp)
  })
  it('scale 1.2 raises stats', () => {
    const base = spawnMonster(template, 1)
    const scaled = spawnMonster(template, 1.2)
    expect(scaled.maxHp).toBeGreaterThan(base.maxHp)
    expect(scaled.atk).toBeGreaterThan(base.atk)
  })
  it('scale clamps to 0.85–1.35', () => {
    const low  = spawnMonster(template, 0)
    const high = spawnMonster(template, 99)
    expect(low.maxHp).toBe(Math.round(template.hp * 0.85))
    expect(high.maxHp).toBe(Math.round(template.hp * 1.35))
  })
})

describe('createAllyUnit', () => {
  const stats = { level: 30, maxHp: 800, maxMp: 300, atk: 80, mAtk: 90, def: 40, speed: 25 }

  it('side is ally', () => {
    const u = createAllyUnit('英雄', stats, ['normal_attack'])
    expect(u.side).toBe('ally')
  })
  it('templateKey is player', () => {
    const u = createAllyUnit('英雄', stats, ['normal_attack'])
    expect(u.templateKey).toBe('player')
  })
  it('hp === maxHp at creation', () => {
    const u = createAllyUnit('英雄', stats, ['normal_attack'])
    expect(u.hp).toBe(u.maxHp)
  })
  it('uses provided skillPool', () => {
    const pool = ['normal_attack', 'liehuo']
    const u = createAllyUnit('英雄', stats, pool)
    expect(u.skillPool).toEqual(pool)
  })
})

describe('rollFoeCount', () => {
  it('result in [partySize, partySize*2]', () => {
    const rng = seededRng(5)
    for (let i = 0; i < 50; i++) {
      const n = rollFoeCount(3, rng)
      expect(n).toBeGreaterThanOrEqual(3)
      expect(n).toBeLessThanOrEqual(6)
    }
  })
  it('partySize 1 → range [1, 2]', () => {
    const rng = seededRng(2)
    for (let i = 0; i < 20; i++) {
      const n = rollFoeCount(1, rng)
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(2)
    }
  })
})

describe('buildEncounter', () => {
  it('returns an array of foe units', () => {
    const foes = buildEncounter(2, { rng: seededRng(7) })
    expect(foes.length).toBeGreaterThan(0)
    foes.forEach(f => expect(f.side).toBe('foe'))
  })
  it('count is in [partySize, partySize*2]', () => {
    const rng = seededRng(3)
    for (let i = 0; i < 10; i++) {
      const foes = buildEncounter(3, { rng })
      expect(foes.length).toBeGreaterThanOrEqual(3)
      expect(foes.length).toBeLessThanOrEqual(6)
    }
  })
  it('each foe has valid stats', () => {
    const foes = buildEncounter(2, { rng: seededRng(9) })
    foes.forEach(f => {
      expect(f.hp).toBeGreaterThan(0)
      expect(f.maxHp).toBeGreaterThan(0)
      expect(f.skillPool).toContain('normal_attack')
    })
  })
})
